"""
Views for the AI Assistant app.
"""

import logging

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import DatasetNotFoundError, ModelNotFoundError
from apps.datasets.models import Dataset
from apps.eda.models import EDAResult
from apps.ml.models import TrainedModel

from .serializers import (
    AskQuestionSerializer,
    ExplainMetricSerializer,
)
from .services import GeminiService

logger = logging.getLogger(__name__)


class AskQuestionView(APIView):
    """
    Ask a question to the AI assistant.

    POST /api/v1/assistant/ask/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AskQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data['question']
        dataset_id = serializer.validated_data.get('dataset_id')
        model_id = serializer.validated_data.get('model_id')
        eda_result_id = serializer.validated_data.get('eda_result_id')

        # Build context from available resources
        context = {}
        sources = []

        if dataset_id:
            try:
                dataset = Dataset.objects.get(
                    id=dataset_id,
                    owner=request.user
                )
                context['dataset'] = {
                    'name': dataset.name,
                    'description': dataset.description,
                    'row_count': dataset.row_count,
                    'column_count': dataset.column_count,
                    'schema': dataset.schema,
                }
                sources.append(f'Dataset: {dataset.name}')
            except Dataset.DoesNotExist:
                raise DatasetNotFoundError()

        if eda_result_id:
            try:
                eda_result = EDAResult.objects.get(id=eda_result_id)
                # Verify ownership through dataset
                if eda_result.dataset.owner != request.user:
                    raise EDAResult.DoesNotExist
                context['eda'] = {
                    'summary_stats': eda_result.summary_stats,
                    'insights': eda_result.insights,
                    'missing_analysis': eda_result.missing_analysis,
                    'correlation_matrix': eda_result.correlation_matrix,
                }
                sources.append('EDA Analysis')
            except EDAResult.DoesNotExist:
                return Response(
                    {
                        'detail': 'EDA result not found.',
                        'code': 'EDA_NOT_FOUND',
                        'meta': {}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

        if model_id:
            try:
                trained_model = TrainedModel.objects.get(
                    id=model_id,
                    owner=request.user
                )
                context['model'] = {
                    'name': trained_model.display_name,
                    'algorithm': trained_model.algorithm_type,
                    'task_type': trained_model.task_type,
                    'metrics': trained_model.metrics,
                    'feature_importance': trained_model.feature_importance,
                    'hyperparameters': trained_model.hyperparameters,
                }
                sources.append(f'Model: {trained_model.display_name}')
            except TrainedModel.DoesNotExist:
                raise ModelNotFoundError()

        # Get answer from Gemini
        gemini = GeminiService()
        answer = gemini.answer_question(question, context)

        logger.info(
            f'Assistant question answered for user {request.user.email}'
        )

        return Response({
            'answer': answer,
            'sources': sources,
        })


class ExplainMetricView(APIView):
    """
    Get an explanation for a metric.

    POST /api/v1/assistant/explain/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ExplainMetricSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        metric_name = serializer.validated_data['metric_name']
        metric_value = serializer.validated_data['metric_value']
        task_type = serializer.validated_data['task_type']

        # Get explanation from Gemini
        gemini = GeminiService()
        explanation = gemini.explain_metric(metric_name, metric_value, task_type)

        return Response({
            'metric_name': metric_name,
            'metric_value': metric_value,
            'task_type': task_type,
            'explanation': explanation,
        })


class AssistantStatusView(APIView):
    """
    Check AI assistant status.

    GET /api/v1/assistant/status/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        gemini = GeminiService()

        return Response({
            'available': gemini.is_available,
            'model': 'gemini-flash-latest' if gemini.is_available else None,
        })
