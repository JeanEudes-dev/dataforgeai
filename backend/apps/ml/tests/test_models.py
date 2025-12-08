"""
Tests for ML models.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.datasets.models import Dataset
from apps.ml.models import TrainedModel, TrainingJob


@pytest.mark.django_db
class TestTrainingJobModel:
    """Tests for the TrainingJob model."""

    def test_create_training_job(self, user):
        """Test creating a training job."""
        csv_content = b'col1,col2,target\n1,2,0\n3,4,1'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
            feature_columns=['col1', 'col2'],
            task_type=TrainingJob.TaskType.CLASSIFICATION,
        )

        assert job.id is not None
        assert job.dataset == dataset
        assert job.owner == user
        assert job.status == TrainingJob.Status.PENDING

    def test_training_job_status_choices(self, user):
        """Test training job status choices."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        for status_value, _ in TrainingJob.Status.choices:
            job.status = status_value
            job.save()
            job.refresh_from_db()
            assert job.status == status_value

    def test_training_job_task_type_choices(self, user):
        """Test training job task type choices."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        for task_type, _ in TrainingJob.TaskType.choices:
            job = TrainingJob.objects.create(
                dataset=dataset,
                owner=user,
                target_column='target',
                task_type=task_type,
            )
            assert job.task_type == task_type

    def test_training_job_progress(self, user):
        """Test training job progress field."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        job.progress = 50.0
        job.save()
        job.refresh_from_db()
        assert job.progress == 50.0

    def test_training_job_cascade_delete(self, user):
        """Test that deleting dataset deletes training jobs."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )
        job_id = job.id

        dataset.delete()

        assert not TrainingJob.objects.filter(id=job_id).exists()


@pytest.mark.django_db
class TestTrainedModelModel:
    """Tests for the TrainedModel model."""

    def test_create_trained_model(self, user):
        """Test creating a trained model."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        model = TrainedModel.objects.create(
            training_job=job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
            feature_columns=['col1', 'col2'],
        )

        assert model.id is not None
        assert model.name == 'random_forest'

    def test_trained_model_metrics(self, user):
        """Test that metrics are stored correctly."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        metrics = {
            'accuracy': 0.95,
            'f1_weighted': 0.94,
            'precision': 0.93,
            'recall': 0.92,
        }

        model = TrainedModel.objects.create(
            training_job=job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
            feature_columns=['col1', 'col2'],
            metrics=metrics,
        )

        model.refresh_from_db()
        assert model.metrics == metrics
        assert model.metrics['accuracy'] == 0.95

    def test_trained_model_primary_metric(self, user):
        """Test primary_metric property."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        # Classification model
        model = TrainedModel.objects.create(
            training_job=job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
            feature_columns=['col1', 'col2'],
            metrics={'f1_weighted': 0.94, 'accuracy': 0.95},
        )

        assert model.primary_metric == 0.94  # f1_weighted for classification

        # Regression model
        model.task_type = TrainingJob.TaskType.REGRESSION
        model.metrics = {'rmse': 5.5, 'r2': 0.85}
        model.save()

        assert model.primary_metric == 5.5  # rmse for regression

    def test_trained_model_feature_importance(self, user):
        """Test feature importance storage."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        feature_importance = {
            'col1': 0.7,
            'col2': 0.3,
        }

        model = TrainedModel.objects.create(
            training_job=job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
            feature_columns=['col1', 'col2'],
            feature_importance=feature_importance,
        )

        model.refresh_from_db()
        assert model.feature_importance == feature_importance

    def test_trained_model_is_best(self, user):
        """Test is_best field."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        model1 = TrainedModel.objects.create(
            training_job=job,
            dataset=dataset,
            owner=user,
            name='model1',
            display_name='Model 1',
            algorithm_type=TrainedModel.AlgorithmType.LOGISTIC_REGRESSION,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
            is_best=True,
        )

        model2 = TrainedModel.objects.create(
            training_job=job,
            dataset=dataset,
            owner=user,
            name='model2',
            display_name='Model 2',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
            is_best=False,
        )

        assert model1.is_best is True
        assert model2.is_best is False

    def test_trained_model_model_size_display(self, user):
        """Test model_size_display property."""
        csv_content = b'col1,col2,target\n1,2,0'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        model = TrainedModel.objects.create(
            training_job=job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
            model_size=1024 * 1024,  # 1MB
        )

        assert 'MB' in model.model_size_display
