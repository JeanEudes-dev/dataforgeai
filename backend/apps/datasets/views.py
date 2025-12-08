"""
Views for the datasets app.
"""

import logging
import os

from django.http import FileResponse
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.core.exceptions import DatasetNotFoundError, FileUploadError

from .models import Dataset
from .serializers import (
    DatasetDetailSerializer,
    DatasetListSerializer,
    DatasetPreviewSerializer,
    DatasetSchemaSerializer,
    DatasetUploadSerializer,
    DatasetUpdateSerializer,
    DatasetColumnSerializer,
)
from .services import DatasetParserService, DatasetValidatorService

logger = logging.getLogger(__name__)


class DatasetViewSet(ModelViewSet):
    """
    ViewSet for managing datasets.

    Provides CRUD operations for datasets:
    - list: GET /api/v1/datasets/
    - create: POST /api/v1/datasets/
    - retrieve: GET /api/v1/datasets/{id}/
    - update: PATCH /api/v1/datasets/{id}/
    - destroy: DELETE /api/v1/datasets/{id}/
    - preview: GET /api/v1/datasets/{id}/preview/
    - schema: GET /api/v1/datasets/{id}/schema/
    - download: GET /api/v1/datasets/{id}/download/
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Return datasets owned by the current user."""
        return Dataset.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return DatasetListSerializer
        elif self.action == 'create':
            return DatasetUploadSerializer
        elif self.action in ['update', 'partial_update']:
            return DatasetUpdateSerializer
        return DatasetDetailSerializer

    def get_object(self):
        """Get dataset and ensure ownership."""
        try:
            dataset = Dataset.objects.get(
                id=self.kwargs['pk'],
                owner=self.request.user
            )
            return dataset
        except Dataset.DoesNotExist:
            raise DatasetNotFoundError()

    def create(self, request, *args, **kwargs):
        """
        Upload a new dataset.

        Accepts multipart form data with:
        - file: The CSV/XLSX file
        - name: Optional dataset name (defaults to filename)
        - description: Optional description
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        name = serializer.validated_data.get('name') or os.path.splitext(uploaded_file.name)[0]
        description = serializer.validated_data.get('description', '')

        # Validate the file
        validator = DatasetValidatorService(uploaded_file)
        file_info = validator.validate()

        # Create the dataset
        dataset = Dataset.objects.create(
            owner=request.user,
            name=name,
            description=description,
            file=uploaded_file,
            original_filename=file_info['original_filename'],
            file_type=file_info['file_type'],
            file_size=file_info['file_size'],
            status=Dataset.Status.PROCESSING,
        )

        # Parse the dataset
        try:
            parser = DatasetParserService(dataset)
            parser.parse()
        except Exception as e:
            logger.error(f'Failed to parse dataset {dataset.id}: {str(e)}')
            # Dataset status is updated by the parser service

        # Return the created dataset
        response_serializer = DatasetDetailSerializer(dataset)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Delete a dataset and its file."""
        dataset = self.get_object()
        dataset_id = str(dataset.id)
        dataset.delete()

        logger.info(f'Dataset {dataset_id} deleted by user {request.user.email}')

        return Response(
            {'detail': 'Dataset deleted successfully.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """
        Get a preview of the dataset (first N rows).

        Query params:
        - rows: Number of rows to return (default: 10, max: 100)
        """
        dataset = self.get_object()

        if dataset.status != Dataset.Status.READY:
            return Response(
                {
                    'detail': 'Dataset is not ready for preview.',
                    'code': 'DATASET_NOT_READY',
                    'meta': {'status': dataset.status}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        num_rows = min(int(request.query_params.get('rows', 10)), 100)

        try:
            parser = DatasetParserService(dataset)
            preview_data = parser.get_preview(num_rows)

            serializer = DatasetPreviewSerializer(preview_data)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f'Failed to get preview for dataset {dataset.id}: {str(e)}')
            return Response(
                {
                    'detail': 'Failed to generate preview.',
                    'code': 'PREVIEW_ERROR',
                    'meta': {}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def schema(self, request, pk=None):
        """Get the schema (column information) for the dataset."""
        dataset = self.get_object()

        columns = dataset.columns.all()
        serializer = DatasetColumnSerializer(columns, many=True)

        return Response({
            'columns': serializer.data,
            'total_columns': columns.count(),
        })

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the original dataset file."""
        dataset = self.get_object()

        if not dataset.file:
            return Response(
                {
                    'detail': 'File not found.',
                    'code': 'FILE_NOT_FOUND',
                    'meta': {}
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            response = FileResponse(
                dataset.file.open('rb'),
                as_attachment=True,
                filename=dataset.original_filename
            )
            return response

        except Exception as e:
            logger.error(f'Failed to download dataset {dataset.id}: {str(e)}')
            return Response(
                {
                    'detail': 'Failed to download file.',
                    'code': 'DOWNLOAD_ERROR',
                    'meta': {}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
