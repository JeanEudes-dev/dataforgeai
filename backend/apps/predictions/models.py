"""
Models for the Predictions app.
"""

import uuid

from django.conf import settings
from django.db import models

from apps.ml.models import TrainedModel


class PredictionJob(models.Model):
    """Batch prediction job."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        ERROR = 'error', 'Error'

    class InputType(models.TextChoices):
        JSON = 'json', 'JSON'
        FILE = 'file', 'File'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model = models.ForeignKey(
        TrainedModel,
        on_delete=models.CASCADE,
        related_name='prediction_jobs'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prediction_jobs'
    )

    # Input
    input_type = models.CharField(
        max_length=20,
        choices=InputType.choices,
        default=InputType.JSON
    )
    input_file = models.FileField(
        upload_to='predictions/input/',
        null=True,
        blank=True
    )
    input_data = models.JSONField(default=list, blank=True)
    input_row_count = models.PositiveIntegerField(null=True, blank=True)

    # Output
    output_file = models.FileField(
        upload_to='predictions/output/',
        null=True,
        blank=True
    )
    predictions = models.JSONField(default=list, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    error_message = models.TextField(blank=True)

    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['model']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Prediction {self.id} ({self.status})"
