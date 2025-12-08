"""
Dataset validation service.

Handles validation of uploaded files including file type,
size limits, and basic content validation.
"""

import logging
import os

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

from apps.core.exceptions import FileUploadError, ValidationError

logger = logging.getLogger(__name__)


class DatasetValidatorService:
    """
    Service for validating dataset uploads.

    Responsibilities:
    - Validate file type (CSV, XLSX, XLS)
    - Validate file size
    - Check file content is readable
    """

    ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
    ALLOWED_MIME_TYPES = {
        'text/csv',
        'application/csv',
        'text/plain',  # Some systems report CSV as text/plain
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }

    def __init__(self, file: UploadedFile):
        self.file = file
        self.filename = file.name
        self.file_size = file.size

    def validate(self) -> dict:
        """
        Validate the uploaded file.

        Returns:
            Dictionary with file metadata

        Raises:
            FileUploadError: If validation fails
        """
        self._validate_extension()
        self._validate_size()
        self._validate_content()

        return {
            'original_filename': self.filename,
            'file_type': self._get_file_type(),
            'file_size': self.file_size,
        }

    def _validate_extension(self) -> None:
        """Validate file extension."""
        ext = os.path.splitext(self.filename)[1].lower()

        if ext not in self.ALLOWED_EXTENSIONS:
            raise FileUploadError(
                detail=f'Invalid file type. Allowed types: {", ".join(self.ALLOWED_EXTENSIONS)}',
                code='INVALID_FILE_TYPE',
                meta={'extension': ext, 'allowed': list(self.ALLOWED_EXTENSIONS)}
            )

    def _validate_size(self) -> None:
        """Validate file size."""
        max_size = settings.MAX_UPLOAD_SIZE

        if self.file_size > max_size:
            max_mb = settings.MAX_UPLOAD_SIZE_MB
            raise FileUploadError(
                detail=f'File too large. Maximum size is {max_mb}MB.',
                code='FILE_TOO_LARGE',
                meta={
                    'size': self.file_size,
                    'max_size': max_size,
                    'max_size_mb': max_mb
                }
            )

        if self.file_size == 0:
            raise FileUploadError(
                detail='File is empty.',
                code='EMPTY_FILE'
            )

    def _validate_content(self) -> None:
        """Validate file content is readable."""
        try:
            # Try to detect file type by content
            import magic

            # Read first 1024 bytes for magic detection
            self.file.seek(0)
            file_head = self.file.read(1024)
            self.file.seek(0)

            mime_type = magic.from_buffer(file_head, mime=True)

            # For CSV files, also check that it looks like text
            ext = os.path.splitext(self.filename)[1].lower()
            if ext == '.csv':
                # Check if it looks like text
                try:
                    file_head.decode('utf-8')
                except UnicodeDecodeError:
                    try:
                        file_head.decode('latin-1')
                    except UnicodeDecodeError:
                        raise FileUploadError(
                            detail='CSV file appears to be corrupted or in an unsupported encoding.',
                            code='INVALID_ENCODING'
                        )

            logger.debug(f'File {self.filename} detected as {mime_type}')

        except ImportError:
            # python-magic not installed, skip content validation
            logger.warning('python-magic not installed, skipping content type validation')

        except Exception as e:
            logger.warning(f'Content validation failed: {str(e)}')
            # Don't fail on content validation errors, let parser handle it

    def _get_file_type(self) -> str:
        """Get the file type from extension."""
        ext = os.path.splitext(self.filename)[1].lower()
        return ext[1:]  # Remove the dot


def validate_dataset_name(name: str) -> str:
    """
    Validate and clean dataset name.

    Args:
        name: The dataset name to validate

    Returns:
        Cleaned dataset name

    Raises:
        ValidationError: If name is invalid
    """
    if not name or not name.strip():
        raise ValidationError(
            detail='Dataset name is required.',
            code='NAME_REQUIRED'
        )

    name = name.strip()

    if len(name) > 255:
        raise ValidationError(
            detail='Dataset name is too long (max 255 characters).',
            code='NAME_TOO_LONG'
        )

    return name
