"""
Models for dataset management.
"""

import hashlib
import os
import uuid

from django.conf import settings
from django.db import models


def dataset_upload_path(instance, filename):
    """Generate upload path for dataset files."""
    ext = os.path.splitext(filename)[1]
    return f'datasets/{instance.owner.id}/{instance.id}{ext}'


class Dataset(models.Model):
    """
    Uploaded dataset metadata.

    Stores information about uploaded CSV/XLSX files including
    schema, row/column counts, and processing status.
    """

    class Status(models.TextChoices):
        UPLOADING = 'uploading', 'Uploading'
        PROCESSING = 'processing', 'Processing'
        READY = 'ready', 'Ready'
        ERROR = 'error', 'Error'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='datasets'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')

    # File information
    file = models.FileField(upload_to=dataset_upload_path)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)  # 'csv', 'xlsx', 'xls'
    file_size = models.PositiveIntegerField(help_text='File size in bytes')
    file_hash = models.CharField(
        max_length=64,
        blank=True,
        default='',
        db_index=True,
        help_text='SHA256 hash of file content for caching'
    )

    # Dataset statistics
    row_count = models.PositiveIntegerField(null=True, blank=True)
    column_count = models.PositiveIntegerField(null=True, blank=True)

    # Schema as JSON: {column_name: {dtype, nullable, unique_count, null_ratio}}
    schema = models.JSONField(default=dict, blank=True)

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADING
    )
    error_message = models.TextField(blank=True, default='')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'datasets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.name} ({self.owner.email})'

    @property
    def file_size_display(self):
        """Return human-readable file size."""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'

    def delete(self, *args, **kwargs):
        """Delete the file when the dataset is deleted."""
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)

    def compute_file_hash(self) -> str:
        """
        Compute SHA256 hash of the file content.

        Returns:
            64-character hex string of the file hash
        """
        if not self.file:
            return ''

        sha256_hash = hashlib.sha256()
        self.file.seek(0)

        for chunk in iter(lambda: self.file.read(8192), b''):
            sha256_hash.update(chunk)

        self.file.seek(0)
        return sha256_hash.hexdigest()


class DatasetColumn(models.Model):
    """
    Column metadata for a dataset.

    Stores detailed information about each column including
    data type, null counts, and sample values.
    """

    class DataType(models.TextChoices):
        NUMERIC = 'numeric', 'Numeric'
        CATEGORICAL = 'categorical', 'Categorical'
        ORDINAL = 'ordinal', 'Ordinal'
        DATETIME = 'datetime', 'DateTime'
        TEXT = 'text', 'Text'
        BOOLEAN = 'boolean', 'Boolean'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name='columns'
    )

    # Column identification
    name = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    position = models.PositiveIntegerField()

    # Data type information
    dtype = models.CharField(
        max_length=50,
        choices=DataType.choices
    )
    pandas_dtype = models.CharField(
        max_length=50,
        help_text='Original pandas dtype'
    )

    # Statistics
    nullable = models.BooleanField(default=True)
    null_count = models.PositiveIntegerField(default=0)
    null_ratio = models.FloatField(default=0.0)
    unique_count = models.PositiveIntegerField(default=0)

    # Sample values (first 5 non-null values)
    sample_values = models.JSONField(default=list, blank=True)

    # Additional statistics for numeric columns
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    mean_value = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'dataset_columns'
        ordering = ['position']
        unique_together = ['dataset', 'name']
        indexes = [
            models.Index(fields=['dataset', 'position']),
        ]

    def __str__(self):
        return f'{self.dataset.name}.{self.name}'
