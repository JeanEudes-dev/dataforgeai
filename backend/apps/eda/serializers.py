"""
Serializers for the EDA app.
"""

from rest_framework import serializers

from apps.datasets.serializers import DatasetListSerializer

from .models import EDAResult


class EDAResultListSerializer(serializers.ModelSerializer):
    """Serializer for EDA result list view."""

    dataset_name = serializers.CharField(source='dataset.name', read_only=True)

    class Meta:
        model = EDAResult
        fields = [
            'id',
            'dataset',
            'dataset_name',
            'version',
            'status',
            'sampled',
            'sample_size',
            'computation_time',
            'created_at',
        ]
        read_only_fields = fields


class EDAResultDetailSerializer(serializers.ModelSerializer):
    """Serializer for EDA result detail view."""

    dataset = DatasetListSerializer(read_only=True)

    class Meta:
        model = EDAResult
        fields = [
            'id',
            'dataset',
            'version',
            'status',
            'summary_stats',
            'distributions',
            'correlation_matrix',
            'top_correlations',
            'missing_analysis',
            'outlier_analysis',
            'insights',
            'ai_insights',
            'sampled',
            'sample_size',
            'computation_time',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class EDACreateSerializer(serializers.Serializer):
    """Serializer for triggering EDA."""

    dataset_id = serializers.UUIDField(required=True)


class EDAInsightsSerializer(serializers.Serializer):
    """Serializer for insights response."""

    insights = serializers.ListField(child=serializers.DictField())
    ai_insights = serializers.CharField(allow_blank=True)


class EDACorrelationsSerializer(serializers.Serializer):
    """Serializer for correlations response."""

    correlation_matrix = serializers.DictField()
    top_correlations = serializers.ListField(child=serializers.DictField())


class EDADistributionsSerializer(serializers.Serializer):
    """Serializer for distributions response."""

    distributions = serializers.DictField()


class EDASummaryStatsSerializer(serializers.Serializer):
    """Serializer for summary statistics response."""

    summary_stats = serializers.DictField()
