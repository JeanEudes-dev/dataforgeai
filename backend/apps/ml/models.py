"""
Models for Machine Learning training and model management.
"""

import os
import uuid

from django.conf import settings
from django.db import models

from apps.datasets.models import Dataset


def model_upload_path(instance, filename):
    """Generate upload path for trained models."""
    return f'models/{instance.owner.id}/{instance.id}.joblib'


class TrainingJob(models.Model):
    """
    ML training job metadata.

    Tracks the status and configuration of a training run.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        ERROR = 'error', 'Error'
        CANCELLED = 'cancelled', 'Cancelled'

    class TaskType(models.TextChoices):
        CLASSIFICATION = 'classification', 'Classification'
        REGRESSION = 'regression', 'Regression'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name='training_jobs'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='training_jobs'
    )

    # Configuration
    target_column = models.CharField(max_length=255)
    feature_columns = models.JSONField(
        default=list,
        help_text='List of feature column names'
    )
    task_type = models.CharField(
        max_length=20,
        choices=TaskType.choices
    )
    task_type_auto_detected = models.BooleanField(
        default=True,
        help_text='Whether task type was auto-detected'
    )

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    progress = models.FloatField(
        default=0.0,
        help_text='Progress percentage (0-100)'
    )
    current_step = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )

    # Results
    best_model = models.ForeignKey(
        'TrainedModel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='selected_by_jobs'
    )

    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default='')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'training_jobs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['dataset']),
        ]

    def __str__(self):
        return f'Training {self.id} ({self.dataset.name} -> {self.target_column})'


class TrainedModel(models.Model):
    """
    Trained ML model metadata and artifact reference.

    Stores information about trained models including metrics,
    hyperparameters, and the serialized model file.
    """

    class AlgorithmType(models.TextChoices):
        LOGISTIC_REGRESSION = 'logistic_regression', 'Logistic Regression'
        LINEAR_REGRESSION = 'linear_regression', 'Linear Regression'
        RANDOM_FOREST = 'random_forest', 'Random Forest'
        GRADIENT_BOOSTING = 'gradient_boosting', 'Gradient Boosting'
        SVM = 'svm', 'Support Vector Machine'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    training_job = models.ForeignKey(
        TrainingJob,
        on_delete=models.CASCADE,
        related_name='models'
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name='trained_models'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trained_models'
    )

    # Model identification
    name = models.CharField(
        max_length=100,
        help_text='Algorithm name (e.g., random_forest)'
    )
    display_name = models.CharField(max_length=255)
    algorithm_type = models.CharField(
        max_length=50,
        choices=AlgorithmType.choices
    )
    task_type = models.CharField(
        max_length=20,
        choices=TrainingJob.TaskType.choices
    )

    # Feature/schema information
    feature_columns = models.JSONField(default=list)
    target_column = models.CharField(max_length=255)
    input_schema = models.JSONField(
        default=dict,
        help_text='Expected input schema for predictions'
    )
    preprocessing_params = models.JSONField(
        default=dict,
        help_text='Preprocessing configuration (encoders, scalers)'
    )

    # Metrics
    metrics = models.JSONField(
        default=dict,
        help_text='Evaluation metrics (accuracy, f1, rmse, etc.)'
    )
    feature_importance = models.JSONField(
        default=dict,
        help_text='Feature importance scores'
    )
    cross_val_scores = models.JSONField(
        default=list,
        help_text='Cross-validation scores'
    )
    shap_values = models.JSONField(
        default=dict,
        blank=True,
        help_text='SHAP-based feature importance and explanations'
    )

    # Hyperparameters
    hyperparameters = models.JSONField(
        default=dict,
        help_text='Model hyperparameters'
    )

    # Model artifact
    model_file = models.FileField(
        upload_to=model_upload_path,
        null=True,
        blank=True
    )
    model_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Model file size in bytes'
    )

    # Selection
    is_best = models.BooleanField(
        default=False,
        help_text='Whether this is the best model for its training job'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'trained_models'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['training_job']),
            models.Index(fields=['is_best']),
        ]

    def __str__(self):
        return f'{self.display_name} ({self.dataset.name})'

    @property
    def primary_metric(self):
        """Get the primary metric value based on task type."""
        if self.task_type == TrainingJob.TaskType.CLASSIFICATION:
            return self.metrics.get('f1_weighted') or self.metrics.get('accuracy')
        else:
            return self.metrics.get('rmse')

    @property
    def model_size_display(self):
        """Return human-readable model size."""
        if not self.model_size:
            return 'Unknown'

        size = self.model_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'

    def delete(self, *args, **kwargs):
        """Delete the model file when the record is deleted."""
        if self.model_file:
            if os.path.isfile(self.model_file.path):
                os.remove(self.model_file.path)
        super().delete(*args, **kwargs)
