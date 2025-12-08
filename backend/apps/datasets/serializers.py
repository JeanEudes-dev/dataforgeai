"""
Serializers for the datasets app.
"""

from rest_framework import serializers

from .models import Dataset, DatasetColumn


class DatasetColumnSerializer(serializers.ModelSerializer):
    """Serializer for dataset columns."""

    class Meta:
        model = DatasetColumn
        fields = [
            'id',
            'name',
            'original_name',
            'position',
            'dtype',
            'pandas_dtype',
            'nullable',
            'null_count',
            'null_ratio',
            'unique_count',
            'sample_values',
            'min_value',
            'max_value',
            'mean_value',
        ]
        read_only_fields = fields


class DatasetListSerializer(serializers.ModelSerializer):
    """Serializer for dataset list view."""

    file_size_display = serializers.ReadOnlyField()

    class Meta:
        model = Dataset
        fields = [
            'id',
            'name',
            'description',
            'original_filename',
            'file_type',
            'file_size',
            'file_size_display',
            'row_count',
            'column_count',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class DatasetDetailSerializer(serializers.ModelSerializer):
    """Serializer for dataset detail view."""

    columns = DatasetColumnSerializer(many=True, read_only=True)
    file_size_display = serializers.ReadOnlyField()

    class Meta:
        model = Dataset
        fields = [
            'id',
            'name',
            'description',
            'original_filename',
            'file_type',
            'file_size',
            'file_size_display',
            'row_count',
            'column_count',
            'schema',
            'status',
            'error_message',
            'columns',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class DatasetUploadSerializer(serializers.Serializer):
    """Serializer for dataset upload."""

    file = serializers.FileField(required=True)
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_name(self, value):
        """Validate and clean the name."""
        if value:
            return value.strip()
        return value


class DatasetUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating dataset metadata."""

    class Meta:
        model = Dataset
        fields = ['name', 'description']

    def validate_name(self, value):
        """Validate name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Name cannot be empty.')
        return value.strip()


class DatasetPreviewSerializer(serializers.Serializer):
    """Serializer for dataset preview response."""

    columns = serializers.ListField(child=serializers.CharField())
    rows = serializers.ListField(child=serializers.DictField())
    total_rows = serializers.IntegerField()


class DatasetSchemaSerializer(serializers.Serializer):
    """Serializer for dataset schema response."""

    columns = DatasetColumnSerializer(many=True)
    total_columns = serializers.IntegerField()
