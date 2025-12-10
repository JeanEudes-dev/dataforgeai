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

                # Auto-fetch the latest EDA result for this dataset if eda_result_id not provided
                if not eda_result_id:
                    try:
                        eda_result = EDAResult.objects.filter(
                            dataset=dataset,
                            status='completed'
                        ).order_by('-created_at').first()
                        if eda_result:
                            eda_result_id = str(eda_result.id)
                            logger.info(f'Auto-fetched EDA result {eda_result_id} for dataset {dataset.name}')
                        else:
                            logger.info(f'No completed EDA result found for dataset {dataset.name}')
                    except Exception as e:
                        logger.warning(f'Error fetching EDA result: {e}')

            except Dataset.DoesNotExist:
                raise DatasetNotFoundError()

        if eda_result_id:
            try:
                eda_result = EDAResult.objects.get(id=eda_result_id)
                # Verify ownership through dataset
                if eda_result.dataset.owner != request.user:
                    raise EDAResult.DoesNotExist

                # Build rich EDA context with summaries (not raw data)
                eda_context = {
                    'insights': eda_result.insights or [],
                    'ai_insights': eda_result.ai_insights,  # Pre-generated AI insights
                }

                # Add compact summary stats (just key statistics per column)
                if eda_result.summary_stats:
                    column_summaries = []
                    for col_name, stats in list(eda_result.summary_stats.items())[:15]:
                        summary = f"{col_name}: "
                        if 'mean' in stats:
                            summary += f"mean={stats['mean']:.2f}, std={stats.get('std', 0):.2f}"
                        elif 'unique' in stats:
                            summary += f"{stats.get('unique', 0)} unique values"
                        column_summaries.append(summary)
                    eda_context['column_summaries'] = column_summaries

                # Add top correlations as readable strings
                if eda_result.top_correlations:
                    eda_context['top_correlations'] = eda_result.top_correlations[:10]

                # Add missing values summary
                if eda_result.missing_analysis:
                    missing_cols = [
                        {'column': k, 'ratio': v.get('ratio', 0) * 100}
                        for k, v in eda_result.missing_analysis.items()
                        if v.get('ratio', 0) > 0
                    ]
                    missing_cols.sort(key=lambda x: x['ratio'], reverse=True)
                    eda_context['missing_summary'] = missing_cols[:10]

                # Add outlier summary
                if eda_result.outlier_analysis:
                    outlier_cols = [
                        {'column': k, 'ratio': v.get('ratio', 0) * 100}
                        for k, v in eda_result.outlier_analysis.items()
                        if v.get('ratio', 0) > 0.01
                    ]
                    outlier_cols.sort(key=lambda x: x['ratio'], reverse=True)
                    eda_context['outlier_summary'] = outlier_cols[:10]

                # Add data quality score if available
                if hasattr(eda_result, 'data_quality_score') and eda_result.data_quality_score:
                    eda_context['data_quality_score'] = eda_result.data_quality_score

                context['eda'] = eda_context
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

        # Log context summary for debugging
        context_keys = list(context.keys())
        eda_keys = list(context.get('eda', {}).keys()) if 'eda' in context else []
        logger.info(f'Q&A context for user {request.user.email}: top-level={context_keys}, eda={eda_keys}')

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
