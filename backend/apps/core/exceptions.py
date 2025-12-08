"""
Custom exceptions and exception handler for DataForge AI.

All API errors follow a consistent format:
{
    "detail": "Human-readable message",
    "code": "ERROR_CODE",
    "meta": { ...optional context... }
}
"""

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class DataForgeException(APIException):
    """Base exception for all DataForge AI errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'An error occurred.'
    default_code = 'error'

    def __init__(self, detail=None, code=None, meta=None):
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code

        self.detail = detail
        self.code = code
        self.meta = meta or {}

        super().__init__(detail=detail, code=code)


class ValidationError(DataForgeException):
    """Raised when input validation fails."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Validation error.'
    default_code = 'VALIDATION_ERROR'


class FileUploadError(DataForgeException):
    """Raised when file upload fails."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'File upload failed.'
    default_code = 'FILE_UPLOAD_ERROR'


class FileParsingError(DataForgeException):
    """Raised when file parsing fails."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Failed to parse file.'
    default_code = 'FILE_PARSING_ERROR'


class DatasetNotFoundError(DataForgeException):
    """Raised when a dataset is not found."""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Dataset not found.'
    default_code = 'DATASET_NOT_FOUND'


class ModelNotFoundError(DataForgeException):
    """Raised when a model is not found."""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Model not found.'
    default_code = 'MODEL_NOT_FOUND'


class EDAError(DataForgeException):
    """Raised when EDA computation fails."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'EDA computation failed.'
    default_code = 'EDA_ERROR'


class ReportNotFoundError(DataForgeException):
    """Raised when a report is not found."""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Report not found.'
    default_code = 'REPORT_NOT_FOUND'


class TrainingError(DataForgeException):
    """Raised when model training fails."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Model training failed.'
    default_code = 'TRAINING_ERROR'


class PredictionError(DataForgeException):
    """Raised when prediction fails."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Prediction failed.'
    default_code = 'PREDICTION_ERROR'


class SchemaValidationError(DataForgeException):
    """Raised when input schema doesn't match expected schema."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Input schema does not match expected schema.'
    default_code = 'SCHEMA_VALIDATION_ERROR'


class PermissionDeniedError(DataForgeException):
    """Raised when user doesn't have permission to access resource."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'PERMISSION_DENIED'


class GeminiAPIError(DataForgeException):
    """Raised when Gemini API call fails."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'AI service temporarily unavailable.'
    default_code = 'GEMINI_API_ERROR'


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats all errors consistently.

    Returns format:
    {
        "detail": "Human-readable message",
        "code": "ERROR_CODE",
        "meta": { ...optional context... }
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Handle our custom exceptions
        if isinstance(exc, DataForgeException):
            response.data = {
                'detail': str(exc.detail),
                'code': exc.code,
                'meta': exc.meta,
            }
        else:
            # Handle standard DRF exceptions
            code = getattr(exc, 'default_code', 'error')
            if hasattr(code, 'upper'):
                code = code.upper()

            # Normalize the detail field
            detail = response.data.get('detail', str(exc))
            if isinstance(detail, list):
                detail = detail[0] if detail else str(exc)

            response.data = {
                'detail': str(detail),
                'code': code,
                'meta': {},
            }

    return response
