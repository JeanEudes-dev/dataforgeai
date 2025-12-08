"""
Serializers for the Predictions app.
"""

from rest_framework import serializers

from apps.ml.serializers import TrainedModelListSerializer

from .models import PredictionJob


class PredictionJobListSerializer(serializers.ModelSerializer):
    """Serializer for prediction job list view."""

    model_name = serializers.CharField(source='model.display_name', read_only=True)

    class Meta:
        model = PredictionJob
        fields = [
            'id',
            'model',
            'model_name',
            'input_type',
            'input_row_count',
            'status',
            'created_at',
            'completed_at',
        ]
        read_only_fields = fields


class PredictionJobDetailSerializer(serializers.ModelSerializer):
    """Serializer for prediction job detail view."""

    model = TrainedModelListSerializer(read_only=True)

    class Meta:
        model = PredictionJob
        fields = [
            'id',
            'model',
            'input_type',
            'input_data',
            'input_row_count',
            'predictions',
            'status',
            'error_message',
            'created_at',
            'completed_at',
        ]
        read_only_fields = fields


class PredictionCreateSerializer(serializers.Serializer):
    """Serializer for creating a single prediction (JSON input)."""

    model_id = serializers.UUIDField(required=True)
    data = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        min_length=1,
        help_text='List of feature dictionaries for prediction'
    )
    include_probabilities = serializers.BooleanField(
        default=False,
        help_text='Include class probabilities (classification only)'
    )

    def validate_data(self, value):
        """Validate input data."""
        if not value:
            raise serializers.ValidationError('Data cannot be empty.')

        # Check all items are dictionaries
        for i, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f'Item at index {i} is not a dictionary.'
                )

        return value


class BatchPredictionCreateSerializer(serializers.Serializer):
    """Serializer for creating batch predictions (file upload)."""

    model_id = serializers.UUIDField(required=True)
    file = serializers.FileField(required=True)

    def validate_file(self, value):
        """Validate uploaded file."""
        file_name = value.name.lower()
        allowed_extensions = ['.csv', '.xlsx', '.xls']

        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                'Unsupported file type. Please upload CSV or Excel file.'
            )

        # Check file size (10MB limit for predictions)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f'File size exceeds limit of {max_size // (1024 * 1024)}MB.'
            )

        return value


class PredictionResultSerializer(serializers.Serializer):
    """Serializer for prediction results."""

    predictions = serializers.ListField(read_only=True)
    probabilities = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_null=True,
        read_only=True
    )
    row_count = serializers.IntegerField(read_only=True)
    model_id = serializers.UUIDField(read_only=True)
    task_type = serializers.CharField(read_only=True)
