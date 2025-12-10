"""
Models for the Reports app.
"""

import uuid

from django.conf import settings
from django.db import models

from apps.datasets.models import Dataset
from apps.eda.models import EDAResult
from apps.ml.models import TrainedModel


class Report(models.Model):
    """Generated analysis report."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        GENERATING = 'generating', 'Generating'
        COMPLETED = 'completed', 'Completed'
        ERROR = 'error', 'Error'

    class ReportType(models.TextChoices):
        EDA = 'eda', 'EDA Report'
        MODEL = 'model', 'Model Report'
        FULL = 'full', 'Full Analysis Report'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    eda_result = models.ForeignKey(
        EDAResult,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    trained_model = models.ForeignKey(
        TrainedModel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )

    # Report info
    title = models.CharField(max_length=255)
    report_type = models.CharField(
        max_length=20,
        choices=ReportType.choices,
        default=ReportType.EDA
    )

    # Content
    content = models.JSONField(default=dict)
    ai_summary = models.TextField(blank=True)

    # Model comparison data (stores all models metrics for comparison)
    model_comparison = models.JSONField(default=list, blank=True)

    # Report metadata for UI display
    report_metadata = models.JSONField(default=dict, blank=True)

    # Sharing functionality
    share_token = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        unique=True,
        help_text="Unique token for sharing report publicly"
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Whether report is publicly accessible via share link"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    error_message = models.TextField(blank=True)

    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['dataset']),
            models.Index(fields=['status']),
            models.Index(fields=['share_token']),
        ]

    def __str__(self):
        return f"{self.title} ({self.report_type})"

    @property
    def share_url(self):
        """Generate the share URL if report is public."""
        if self.share_token and self.is_public:
            return f"/reports/shared/{self.share_token}"
        return None

    def generate_share_token(self):
        """Generate a unique share token for this report."""
        import secrets
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(32)
        return self.share_token
