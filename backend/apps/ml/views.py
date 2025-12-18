"""
Views for the ML app.
"""

import logging

from django.http import FileResponse
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.core.exceptions import DatasetNotFoundError, ModelNotFoundError, TrainingError
from apps.datasets.models import Dataset

from .models import TrainedModel, TrainingJob
from .serializers import (
    TrainedModelDetailSerializer,
    TrainedModelListSerializer,
    TrainingJobCreateSerializer,
    TrainingJobDetailSerializer,
    TrainingJobListSerializer,
)
from .services import ModelTrainerService

logger = logging.getLogger(__name__)


class TrainingJobViewSet(ReadOnlyModelViewSet):
    """
    ViewSet for training jobs.

    Provides read operations for training jobs:
    - list: GET /api/v1/ml/jobs/
    - retrieve: GET /api/v1/ml/jobs/{id}/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return training jobs owned by the current user."""
        return TrainingJob.objects.filter(
            owner=self.request.user
        ).select_related('dataset', 'best_model')

    def get_serializer_class(self):
        if self.action == 'list':
            return TrainingJobListSerializer
        return TrainingJobDetailSerializer


class TrainedModelViewSet(ReadOnlyModelViewSet):
    """
    ViewSet for trained models.

    Provides read operations for trained models:
    - list: GET /api/v1/ml/models/
    - retrieve: GET /api/v1/ml/models/{id}/
    - download: GET /api/v1/ml/models/{id}/download/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return trained models owned by the current user."""
        return TrainedModel.objects.filter(
            owner=self.request.user
        ).select_related('dataset', 'training_job')

    def get_serializer_class(self):
        if self.action == 'list':
            return TrainedModelListSerializer
        return TrainedModelDetailSerializer

    def destroy(self, request, *args, **kwargs):
        """Delete a trained model."""
        try:
            model = self.get_object()
            model_id = str(model.id)
            model.delete()

            logger.info(f'Model {model_id} deleted by user {request.user.email}')

            return Response(
                {'detail': 'Model deleted successfully.'},
                status=status.HTTP_200_OK
            )
        except TrainedModel.DoesNotExist:
            raise ModelNotFoundError()

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the trained model file."""
        try:
            model = self.get_object()

            if not model.model_file:
                return Response(
                    {
                        'detail': 'Model file not found.',
                        'code': 'FILE_NOT_FOUND',
                        'meta': {}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            response = FileResponse(
                model.model_file.open('rb'),
                as_attachment=True,
                filename=f'{model.name}_{model.id}.joblib'
            )
            return response

        except Exception as e:
            logger.error(f'Failed to download model: {str(e)}')
            return Response(
                {
                    'detail': 'Failed to download model.',
                    'code': 'DOWNLOAD_ERROR',
                    'meta': {}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def shap(self, request, pk=None):
        """
        Get SHAP explanations for a model.

        GET /api/v1/ml/models/{id}/shap/
        """
        model = self.get_object()

        if not model.shap_values:
            return Response(
                {
                    'detail': 'SHAP values not available for this model.',
                    'code': 'SHAP_NOT_AVAILABLE',
                    'meta': {
                        'model_id': str(model.id),
                        'algorithm': model.algorithm_type,
                    }
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'model_id': str(model.id),
            'model_name': model.display_name,
            'algorithm_type': model.algorithm_type,
            'shap_data': model.shap_values,
        })


class TriggerTrainingView(APIView):
    """
    Trigger model training for a dataset.

    POST /api/v1/ml/train/

    Query Parameters:
        async: If 'true', run training as background task (returns 202 Accepted)
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TrainingJobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dataset_id = serializer.validated_data['dataset_id']
        target_column = serializer.validated_data['target_column']
        feature_columns = serializer.validated_data.get('feature_columns', [])
        task_type = serializer.validated_data.get('task_type')
        run_async = request.query_params.get('async', 'false').lower() == 'true'

        # Get the dataset and verify ownership
        try:
            dataset = Dataset.objects.get(
                id=dataset_id,
                owner=request.user
            )
        except Dataset.DoesNotExist:
            raise DatasetNotFoundError()

        # Check dataset is ready
        if dataset.status != Dataset.Status.READY:
            return Response({
                'detail': 'Dataset is not ready for training.',
                'code': 'DATASET_NOT_READY',
                'meta': {'status': dataset.status}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create training job
        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=request.user,
            target_column=target_column,
            feature_columns=feature_columns,
            task_type=task_type or '',
            task_type_auto_detected=not bool(task_type),
        )

        if run_async:
            # Dispatch async task
            from .tasks import train_models_task
            train_models_task.delay(str(job.id))

            logger.info(
                f'Async training triggered for dataset {dataset_id} by user {request.user.email}'
            )

            return Response({
                'job_id': str(job.id),
                'status': job.status,
                'message': 'Training job queued. Check status at /api/v1/ml/jobs/{job_id}/',
            }, status=status.HTTP_202_ACCEPTED)

        # Run training synchronously
        try:
            trainer = ModelTrainerService(job)
            job = trainer.train()

            logger.info(
                f'Training triggered for dataset {dataset_id} by user {request.user.email}'
            )

            return Response(
                TrainingJobDetailSerializer(job).data,
                status=status.HTTP_201_CREATED
            )

        except TrainingError:
            raise
        except Exception as e:
            logger.error(f'Training failed: {str(e)}')
            raise TrainingError(
                detail='Failed to train models.',
                meta={'error': str(e)}
            )


class DatasetModelsView(APIView):
    """
    Get trained models for a specific dataset.

    GET /api/v1/ml/dataset/{dataset_id}/models/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, dataset_id):
        # Verify dataset ownership
        try:
            dataset = Dataset.objects.get(
                id=dataset_id,
                owner=request.user
            )
        except Dataset.DoesNotExist:
            raise DatasetNotFoundError()

        models = TrainedModel.objects.filter(
            dataset=dataset,
            is_best=True
        ).order_by('-created_at')

        serializer = TrainedModelListSerializer(models, many=True)

        return Response({
            'results': serializer.data,
            'count': models.count(),
        })
