"""
Views for the Predictions app.
"""

import logging

from django.http import FileResponse
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.core.exceptions import ModelNotFoundError, PredictionError
from apps.ml.models import TrainedModel

from .models import PredictionJob
from .serializers import (
    BatchPredictionCreateSerializer,
    PredictionCreateSerializer,
    PredictionJobDetailSerializer,
    PredictionJobListSerializer,
    PredictionResultSerializer,
)
from .services import PredictionService

logger = logging.getLogger(__name__)


class PredictionJobViewSet(ReadOnlyModelViewSet):
    """
    ViewSet for prediction jobs.

    Provides read operations for prediction jobs:
    - list: GET /api/v1/predictions/jobs/
    - retrieve: GET /api/v1/predictions/jobs/{id}/
    - download: GET /api/v1/predictions/jobs/{id}/download/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return prediction jobs owned by the current user."""
        return PredictionJob.objects.filter(
            owner=self.request.user
        ).select_related('model')

    def get_serializer_class(self):
        if self.action == 'list':
            return PredictionJobListSerializer
        return PredictionJobDetailSerializer

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the prediction results file."""
        try:
            job = self.get_object()

            if job.status != PredictionJob.Status.COMPLETED:
                return Response(
                    {
                        'detail': 'Prediction job is not completed.',
                        'code': 'NOT_COMPLETED',
                        'meta': {'status': job.status}
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not job.output_file:
                return Response(
                    {
                        'detail': 'Output file not available.',
                        'code': 'FILE_NOT_FOUND',
                        'meta': {}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            response = FileResponse(
                job.output_file.open('rb'),
                as_attachment=True,
                filename=f'predictions_{job.id}.csv'
            )
            return response

        except Exception as e:
            logger.error(f'Failed to download predictions: {str(e)}')
            return Response(
                {
                    'detail': 'Failed to download predictions.',
                    'code': 'DOWNLOAD_ERROR',
                    'meta': {}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PredictView(APIView):
    """
    Run predictions on JSON input data.

    POST /api/v1/predictions/predict/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PredictionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        model_id = serializer.validated_data['model_id']
        input_data = serializer.validated_data['data']
        include_probabilities = serializer.validated_data['include_probabilities']

        # Get the model and verify ownership
        try:
            trained_model = TrainedModel.objects.get(
                id=model_id,
                owner=request.user
            )
        except TrainedModel.DoesNotExist:
            raise ModelNotFoundError()

        # Create prediction job
        job = PredictionJob.objects.create(
            model=trained_model,
            owner=request.user,
            input_type=PredictionJob.InputType.JSON,
            input_data=input_data,
            input_row_count=len(input_data),
        )

        # Run predictions
        try:
            prediction_service = PredictionService(trained_model)

            if include_probabilities:
                result = prediction_service.predict_with_probabilities(input_data)
                predictions = result['predictions']
                probabilities = result['probabilities']
            else:
                predictions = prediction_service.predict(input_data)
                probabilities = None

            # Update job
            job.predictions = predictions
            job.status = PredictionJob.Status.COMPLETED
            job.save()

            logger.info(
                f'Prediction completed for model {model_id} by user {request.user.email}'
            )

            return Response({
                'job_id': str(job.id),
                'predictions': predictions,
                'probabilities': probabilities,
                'row_count': len(predictions),
                'model_id': str(model_id),
                'task_type': trained_model.task_type,
            }, status=status.HTTP_201_CREATED)

        except PredictionError:
            raise
        except Exception as e:
            job.status = PredictionJob.Status.ERROR
            job.error_message = str(e)
            job.save()

            logger.error(f'Prediction failed: {str(e)}')
            raise PredictionError(
                detail='Prediction failed.',
                meta={'error': str(e)}
            )


class BatchPredictView(APIView):
    """
    Run batch predictions on uploaded file.

    POST /api/v1/predictions/batch/

    Query Parameters:
        async: If 'true', run predictions as background task (returns 202 Accepted)
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BatchPredictionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        model_id = serializer.validated_data['model_id']
        uploaded_file = serializer.validated_data['file']
        run_async = request.query_params.get('async', 'false').lower() == 'true'

        # Get the model and verify ownership
        try:
            trained_model = TrainedModel.objects.get(
                id=model_id,
                owner=request.user
            )
        except TrainedModel.DoesNotExist:
            raise ModelNotFoundError()

        # Create prediction job
        job = PredictionJob.objects.create(
            model=trained_model,
            owner=request.user,
            input_type=PredictionJob.InputType.FILE,
        )
        job.input_file.save(uploaded_file.name, uploaded_file)
        job.save()

        if run_async:
            # Dispatch async task
            from .tasks import run_batch_prediction_task
            run_batch_prediction_task.delay(str(job.id))

            logger.info(
                f'Async batch prediction triggered for model {model_id} by user {request.user.email}'
            )

            return Response({
                'job_id': str(job.id),
                'status': job.status,
                'message': 'Batch prediction job queued. Check status at /api/v1/predictions/jobs/{job_id}/',
            }, status=status.HTTP_202_ACCEPTED)

        # Run predictions synchronously
        try:
            prediction_service = PredictionService(trained_model)
            job = prediction_service.run_prediction_job(job)

            logger.info(
                f'Batch prediction completed for model {model_id} by user {request.user.email}'
            )

            return Response(
                PredictionJobDetailSerializer(job).data,
                status=status.HTTP_201_CREATED
            )

        except PredictionError:
            raise
        except Exception as e:
            job.status = PredictionJob.Status.ERROR
            job.error_message = str(e)
            job.save()

            logger.error(f'Batch prediction failed: {str(e)}')
            raise PredictionError(
                detail='Batch prediction failed.',
                meta={'error': str(e)}
            )


class ModelPredictionsView(APIView):
    """
    Get predictions for a specific model.

    GET /api/v1/predictions/model/{model_id}/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, model_id):
        # Verify model ownership
        try:
            trained_model = TrainedModel.objects.get(
                id=model_id,
                owner=request.user
            )
        except TrainedModel.DoesNotExist:
            raise ModelNotFoundError()

        jobs = PredictionJob.objects.filter(
            model=trained_model
        ).order_by('-created_at')

        serializer = PredictionJobListSerializer(jobs, many=True)

        return Response({
            'model_id': str(model_id),
            'model_name': trained_model.display_name,
            'jobs': serializer.data,
            'count': jobs.count(),
        })
