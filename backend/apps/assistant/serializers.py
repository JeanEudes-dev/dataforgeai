"""
Serializers for the AI Assistant app.
"""

from rest_framework import serializers


class AskQuestionSerializer(serializers.Serializer):
    """Serializer for asking questions to the AI assistant."""

    question = serializers.CharField(required=True, max_length=1000)
    dataset_id = serializers.UUIDField(required=False, allow_null=True)
    model_id = serializers.UUIDField(required=False, allow_null=True)
    eda_result_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        """Validate that at least one context is provided."""
        if not any([
            attrs.get('dataset_id'),
            attrs.get('model_id'),
            attrs.get('eda_result_id')
        ]):
            raise serializers.ValidationError(
                'At least one of dataset_id, model_id, or eda_result_id is required.'
            )
        return attrs


class ExplainMetricSerializer(serializers.Serializer):
    """Serializer for explaining a metric."""

    metric_name = serializers.CharField(required=True, max_length=50)
    metric_value = serializers.FloatField(required=True)
    task_type = serializers.ChoiceField(
        choices=[('classification', 'Classification'), ('regression', 'Regression')],
        required=True
    )


class AssistantResponseSerializer(serializers.Serializer):
    """Serializer for assistant responses."""

    answer = serializers.CharField(read_only=True)
    sources = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
        required=False
    )
