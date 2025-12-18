"""
Models for Exploratory Data Analysis.
"""

import uuid

from django.conf import settings
from django.db import models

from apps.datasets.models import Dataset


class EDAResult(models.Model):
    """
    Stores EDA computation results.

    Contains all computed statistics, distributions, correlations,
    and insights for a dataset.
    """

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        ERROR = 'error', 'Error'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name='eda_results'
    )
    version = models.PositiveIntegerField(default=1)

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Summary statistics per column
    # Format: {column_name: {count, mean, std, min, max, 25%, 50%, 75%}}
    summary_stats = models.JSONField(default=dict, blank=True)

    # Distribution data for histograms
    # Format: {column_name: {bins: [...], counts: [...], type: 'numeric'|'categorical'}}
    distributions = models.JSONField(default=dict, blank=True)

    # Correlation matrix for numeric columns
    # Format: {col1: {col2: correlation_value}}
    correlation_matrix = models.JSONField(default=dict, blank=True)

    # Top correlations list
    # Format: [{col1, col2, correlation, strength}]
    top_correlations = models.JSONField(default=list, blank=True)

    # Missing value analysis
    # Format: {column_name: {count, ratio, pattern}}
    missing_analysis = models.JSONField(default=dict, blank=True)

    # Outlier analysis
    # Format: {column_name: {method, count, ratio, bounds}}
    outlier_analysis = models.JSONField(default=dict, blank=True)

    # Cross-type associations (categorical-categorical, categorical-numeric)
    # Format: {categorical_categorical: {}, categorical_numeric: {}, numeric_numeric: {}}
    associations = models.JSONField(default=dict, blank=True)

    # DateTime column analysis
    # Format: {column_name: {min_date, max_date, weekday_dist, month_dist, etc.}}
    datetime_analysis = models.JSONField(default=dict, blank=True)

    # Text column analysis (high cardinality strings)
    # Format: {column_name: {avg_length, word_count, contains_numbers, etc.}}
    text_analysis = models.JSONField(default=dict, blank=True)

    # Target-focused analysis
    # Format: {target_column, task_type, distribution: {}, warnings: []}
    target_analysis = models.JSONField(default=dict, blank=True)

    # Global dataset metrics
    # Format: {duplicate_rows, memory_usage, quality_indicators: {}}
    global_metrics = models.JSONField(default=dict, blank=True)

    # Data quality score (0-100)
    data_quality_score = models.FloatField(null=True, blank=True)

    # Rule-based generated insights
    # Format: [{type, message, severity, column, value}]
    insights = models.JSONField(default=list, blank=True)

    # AI-generated insights (from Gemini)
    ai_insights = models.TextField(blank=True, default='')

    # Metadata
    sampled = models.BooleanField(
        default=False,
        help_text='Whether the EDA was performed on a sample'
    )
    sample_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Number of rows in the sample'
    )
    computation_time = models.FloatField(
        null=True,
        blank=True,
        help_text='Time taken for computation in seconds'
    )
    error_message = models.TextField(blank=True, default='')
    cache_key = models.CharField(
        max_length=64,
        blank=True,
        default='',
        db_index=True,
        help_text='Cache key based on dataset file hash'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'eda_results'
        ordering = ['-created_at']
        unique_together = ['dataset', 'version']
        indexes = [
            models.Index(fields=['dataset', '-created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'EDA v{self.version} for {self.dataset.name}'

    def save(self, *args, **kwargs):
        """Auto-increment version if not set."""
        if self._state.adding:
            # Get the latest version for this dataset
            latest = EDAResult.objects.filter(
                dataset=self.dataset
            ).order_by('-version').first()

            if latest:
                self.version = latest.version + 1
            else:
                self.version = 1

        super().save(*args, **kwargs)
