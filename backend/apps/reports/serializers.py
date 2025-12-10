"""
Serializers for the Reports app.
"""

from rest_framework import serializers

from apps.datasets.serializers import DatasetListSerializer
from apps.ml.models import TrainedModel
from apps.ml.serializers import TrainedModelListSerializer, TrainedModelDetailSerializer

from .models import Report


class ReportListSerializer(serializers.ModelSerializer):
    """Serializer for report list view."""

    dataset_name = serializers.CharField(source='dataset.name', read_only=True)
    is_public = serializers.BooleanField(read_only=True)

    class Meta:
        model = Report
        fields = [
            'id',
            'title',
            'report_type',
            'dataset',
            'dataset_name',
            'status',
            'is_public',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class ReportDetailSerializer(serializers.ModelSerializer):
    """Serializer for report detail view."""

    dataset = DatasetListSerializer(read_only=True)
    trained_model = TrainedModelDetailSerializer(read_only=True)
    all_models = serializers.SerializerMethodField()
    share_url = serializers.ReadOnlyField()

    class Meta:
        model = Report
        fields = [
            'id',
            'title',
            'report_type',
            'dataset',
            'eda_result',
            'trained_model',
            'all_models',
            'content',
            'model_comparison',
            'ai_summary',
            'status',
            'error_message',
            'share_token',
            'share_url',
            'is_public',
            'report_metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_all_models(self, obj):
        """Get all trained models for the dataset for comparison."""
        if obj.dataset:
            models = TrainedModel.objects.filter(
                dataset=obj.dataset
            ).order_by('-is_best', '-created_at')
            return TrainedModelListSerializer(models, many=True).data
        return []


class SharedReportSerializer(serializers.ModelSerializer):
    """Serializer for publicly shared reports (limited fields, no sensitive data)."""

    dataset_name = serializers.CharField(source='dataset.name', read_only=True)
    dataset_row_count = serializers.IntegerField(source='dataset.row_count', read_only=True)
    dataset_column_count = serializers.IntegerField(source='dataset.column_count', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id',
            'title',
            'report_type',
            'dataset_name',
            'dataset_row_count',
            'dataset_column_count',
            'content',
            'model_comparison',
            'ai_summary',
            'report_metadata',
            'created_at',
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
