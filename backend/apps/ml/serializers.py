"""
Serializers for the ML app.
"""

from rest_framework import serializers

from apps.datasets.serializers import DatasetListSerializer

from .models import TrainedModel, TrainingJob


class TrainingJobListSerializer(serializers.ModelSerializer):
    """Serializer for training job list view."""

    dataset_name = serializers.CharField(source='dataset.name', read_only=True)
    duration = serializers.ReadOnlyField()

    class Meta:
        model = TrainingJob
        fields = [
            'id',
            'dataset',
            'dataset_name',
            'target_column',
            'task_type',
            'status',
            'progress',
            'current_step',
            'started_at',
            'completed_at',
            'duration',
            'created_at',
        ]
        read_only_fields = fields


class TrainedModelListSerializer(serializers.ModelSerializer):
    """Serializer for trained model list view."""

    dataset_name = serializers.CharField(source='dataset.name', read_only=True)
    model_size_display = serializers.ReadOnlyField()
    primary_metric = serializers.ReadOnlyField()

    class Meta:
        model = TrainedModel
        fields = [
            'id',
            'name',
            'display_name',
            'algorithm_type',
            'task_type',
            'target_column',
            'dataset',
            'dataset_name',
            'is_best',
            'metrics',
            'primary_metric',
            'model_size',
            'model_size_display',
            'created_at',
        ]
        read_only_fields = fields


class TrainedModelDetailSerializer(serializers.ModelSerializer):
    """Serializer for trained model detail view."""

    dataset = DatasetListSerializer(read_only=True)
    model_size_display = serializers.ReadOnlyField()
    primary_metric = serializers.ReadOnlyField()
    has_shap = serializers.SerializerMethodField()
    training_job_duration = serializers.SerializerMethodField()

    class Meta:
        model = TrainedModel
        fields = [
            'id',
            'training_job',
            'training_job_duration',
            'dataset',
            'name',
            'display_name',
            'algorithm_type',
            'task_type',
            'feature_columns',
            'target_column',
            'input_schema',
            'preprocessing_params',
            'metrics',
            'primary_metric',
            'feature_importance',
            'cross_val_scores',
            'hyperparameters',
            'shap_values',
            'has_shap',
            'model_size',
            'model_size_display',
            'is_best',
            'created_at',
        ]
        read_only_fields = fields

    def get_has_shap(self, obj):
        """Return whether SHAP values are available."""
        return bool(obj.shap_values)

    def get_training_job_duration(self, obj):
        """Return training job duration in seconds."""
        if obj.training_job:
            return obj.training_job.duration
        return None


class TrainingJobDetailSerializer(serializers.ModelSerializer):
    """Serializer for training job detail view."""

    dataset = DatasetListSerializer(read_only=True)
    models = TrainedModelListSerializer(many=True, read_only=True)
    best_model = TrainedModelListSerializer(read_only=True)
    duration = serializers.ReadOnlyField()

    class Meta:
        model = TrainingJob
        fields = [
            'id',
            'dataset',
            'target_column',
            'feature_columns',
            'task_type',
            'task_type_auto_detected',
            'status',
            'progress',
            'current_step',
            'best_model',
            'models',
            'started_at',
            'completed_at',
            'duration',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class TrainingJobCreateSerializer(serializers.Serializer):
    """Serializer for creating a training job."""

    dataset_id = serializers.UUIDField(required=True)
    target_column = serializers.CharField(required=True, max_length=255)
    feature_columns = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    task_type = serializers.ChoiceField(
        choices=TrainingJob.TaskType.choices,
        required=False
    )

    def validate_target_column(self, value):
        """Validate target column name."""
        if not value or not value.strip():
            raise serializers.ValidationError('Target column is required.')
        return value.strip()
