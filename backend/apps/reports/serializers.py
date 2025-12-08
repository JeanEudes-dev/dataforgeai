"""
Serializers for the Reports app.
"""

from rest_framework import serializers

from apps.datasets.serializers import DatasetListSerializer
from apps.ml.serializers import TrainedModelListSerializer

from .models import Report


class ReportListSerializer(serializers.ModelSerializer):
    """Serializer for report list view."""

    dataset_name = serializers.CharField(source='dataset.name', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id',
            'title',
            'report_type',
            'dataset',
            'dataset_name',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class ReportDetailSerializer(serializers.ModelSerializer):
    """Serializer for report detail view."""

    dataset = DatasetListSerializer(read_only=True)
    trained_model = TrainedModelListSerializer(read_only=True)

    class Meta:
        model = Report
        fields = [
            'id',
            'title',
            'report_type',
            'dataset',
            'eda_result',
            'trained_model',
            'content',
            'ai_summary',
            'status',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class ReportCreateSerializer(serializers.Serializer):
    """Serializer for creating a report."""

    dataset_id = serializers.UUIDField(required=True)
    title = serializers.CharField(max_length=255, required=False)
    report_type = serializers.ChoiceField(
        choices=Report.ReportType.choices,
        default=Report.ReportType.FULL
    )
    eda_result_id = serializers.UUIDField(required=False, allow_null=True)
    model_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        """Validate report creation data."""
        report_type = attrs.get('report_type', Report.ReportType.FULL)

        # For EDA report, eda_result is required
        if report_type == Report.ReportType.EDA and not attrs.get('eda_result_id'):
            raise serializers.ValidationError({
                'eda_result_id': 'EDA result ID is required for EDA reports.'
            })

        # For Model report, model_id is required
        if report_type == Report.ReportType.MODEL and not attrs.get('model_id'):
            raise serializers.ValidationError({
                'model_id': 'Model ID is required for model reports.'
            })

        return attrs
