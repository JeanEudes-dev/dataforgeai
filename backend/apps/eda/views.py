"""
Views for the EDA app.
"""

import logging

from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.core.exceptions import DatasetNotFoundError, EDAError
from apps.datasets.models import Dataset

from .models import EDAResult
from .serializers import (
    EDACorrelationsSerializer,
    EDACreateSerializer,
    EDADistributionsSerializer,
    EDAInsightsSerializer,
    EDAResultDetailSerializer,
    EDAResultListSerializer,
    EDASummaryStatsSerializer,
)
from .services import EDAAnalyzerService

logger = logging.getLogger(__name__)


class EDAResultViewSet(ReadOnlyModelViewSet):
    """
    ViewSet for EDA results.

    Provides read operations for EDA results:
    - list: GET /api/v1/eda/
    - retrieve: GET /api/v1/eda/{id}/
    - insights: GET /api/v1/eda/{id}/insights/
    - correlations: GET /api/v1/eda/{id}/correlations/
    - distributions: GET /api/v1/eda/{id}/distributions/
    - stats: GET /api/v1/eda/{id}/stats/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return EDA results for datasets owned by the current user."""
        return EDAResult.objects.filter(
            dataset__owner=self.request.user
        ).select_related('dataset')

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return EDAResultListSerializer
        return EDAResultDetailSerializer

    @action(detail=True, methods=['get'])
    def insights(self, request, pk=None):
        """Get just the insights from an EDA result."""
        eda_result = self.get_object()

        return Response({
            'insights': eda_result.insights,
            'ai_insights': eda_result.ai_insights,
        })

    @action(detail=True, methods=['get'])
    def correlations(self, request, pk=None):
        """Get the correlation matrix and top correlations."""
        eda_result = self.get_object()

        return Response({
            'correlation_matrix': eda_result.correlation_matrix,
            'top_correlations': eda_result.top_correlations,
        })

    @action(detail=True, methods=['get'])
    def distributions(self, request, pk=None):
        """Get the distribution data for all columns."""
        eda_result = self.get_object()

        return Response({
            'distributions': eda_result.distributions,
        })

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get the summary statistics for all columns."""
        eda_result = self.get_object()

        return Response({
            'summary_stats': eda_result.summary_stats,
        })


class TriggerEDAView(APIView):
    """
    Trigger EDA computation for a dataset.

    POST /api/v1/eda/

    Query Parameters:
        async: If 'true', run EDA as background task (returns 202 Accepted)
        force_refresh: If 'true', bypass cache and recompute EDA
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EDACreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dataset_id = serializer.validated_data['dataset_id']
        run_async = request.query_params.get('async', 'false').lower() == 'true'
        force_refresh = request.query_params.get('force_refresh', 'false').lower() == 'true'

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
                'detail': 'Dataset is not ready for analysis.',
                'code': 'DATASET_NOT_READY',
                'meta': {'status': dataset.status}
            }, status=status.HTTP_400_BAD_REQUEST)

        if run_async:
            # Create EDA result with pending status
            eda_result = EDAResult.objects.create(
                dataset=dataset,
                status=EDAResult.Status.PENDING
            )

            # Dispatch async task
            from .tasks import run_eda_task
            run_eda_task.delay(str(dataset_id), str(eda_result.id))

            logger.info(
                f'Async EDA triggered for dataset {dataset_id} by user {request.user.email}'
            )

            return Response({
                'eda_result_id': str(eda_result.id),
                'dataset_id': str(dataset_id),
                'status': eda_result.status,
                'message': 'EDA job queued. Check status at /api/v1/eda/{eda_result_id}/',
            }, status=status.HTTP_202_ACCEPTED)

        # Run EDA synchronously
        try:
            analyzer = EDAAnalyzerService(dataset)
            eda_result = analyzer.analyze(force_refresh=force_refresh)

            logger.info(
                f'EDA triggered for dataset {dataset_id} by user {request.user.email}'
            )

            return Response(
                EDAResultDetailSerializer(eda_result).data,
                status=status.HTTP_201_CREATED
            )

        except EDAError:
            raise
        except Exception as e:
            logger.error(f'EDA failed: {str(e)}')
            raise EDAError(
                detail='Failed to perform EDA.',
                meta={'error': str(e)}
            )


class DatasetEDAListView(generics.ListAPIView):
    """
    List EDA results for a specific dataset.

    GET /api/v1/eda/dataset/{dataset_id}/
    """

    serializer_class = EDAResultListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        dataset_id = self.kwargs['dataset_id']

        # Verify dataset ownership
        try:
            dataset = Dataset.objects.get(
                id=dataset_id,
                owner=self.request.user
            )
        except Dataset.DoesNotExist:
            raise DatasetNotFoundError()

        return EDAResult.objects.filter(dataset=dataset)


class LatestEDAView(APIView):
    """
    Get the latest EDA result for a dataset.

    GET /api/v1/eda/dataset/{dataset_id}/latest/
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

        # Get latest completed EDA
        eda_result = EDAResult.objects.filter(
            dataset=dataset,
            status=EDAResult.Status.COMPLETED
        ).order_by('-created_at').first()

        if not eda_result:
            return Response({
                'detail': 'No EDA results found for this dataset.',
                'code': 'NO_EDA_RESULTS',
                'meta': {}
            }, status=status.HTTP_404_NOT_FOUND)

        return Response(EDAResultDetailSerializer(eda_result).data)
