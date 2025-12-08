"""
Tests for Predictions models.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.datasets.models import Dataset
from apps.ml.models import TrainedModel, TrainingJob
from apps.predictions.models import PredictionJob


@pytest.mark.django_db
class TestPredictionJobModel:
    """Tests for the PredictionJob model."""

    def test_create_prediction_job(self, user):
        """Test creating a prediction job."""
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

        training_job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        trained_model = TrainedModel.objects.create(
            training_job=training_job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
            feature_columns=['col1', 'col2'],
        )

        prediction_job = PredictionJob.objects.create(
            model=trained_model,
            owner=user,
            input_type=PredictionJob.InputType.JSON,
            input_data=[{'col1': 1, 'col2': 2}],
        )

        assert prediction_job.id is not None
        assert prediction_job.model == trained_model
        assert prediction_job.owner == user
        assert prediction_job.status == PredictionJob.Status.PENDING

    def test_prediction_job_status_choices(self, user):
        """Test prediction job status choices."""
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

        training_job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        trained_model = TrainedModel.objects.create(
            training_job=training_job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
        )

        prediction_job = PredictionJob.objects.create(
            model=trained_model,
            owner=user,
        )

        for status_value, _ in PredictionJob.Status.choices:
            prediction_job.status = status_value
            prediction_job.save()
            prediction_job.refresh_from_db()
            assert prediction_job.status == status_value

    def test_prediction_job_input_types(self, user):
        """Test prediction job input type choices."""
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

        training_job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        trained_model = TrainedModel.objects.create(
            training_job=training_job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
        )

        # JSON input
        job1 = PredictionJob.objects.create(
            model=trained_model,
            owner=user,
            input_type=PredictionJob.InputType.JSON,
        )
        assert job1.input_type == PredictionJob.InputType.JSON

        # File input
        job2 = PredictionJob.objects.create(
            model=trained_model,
            owner=user,
            input_type=PredictionJob.InputType.FILE,
        )
        assert job2.input_type == PredictionJob.InputType.FILE

    def test_prediction_job_json_fields(self, user):
        """Test prediction job JSON fields."""
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

        training_job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        trained_model = TrainedModel.objects.create(
            training_job=training_job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
        )

        input_data = [{'col1': 1, 'col2': 2}, {'col1': 3, 'col2': 4}]
        predictions = [0, 1]

        prediction_job = PredictionJob.objects.create(
            model=trained_model,
            owner=user,
            input_type=PredictionJob.InputType.JSON,
            input_data=input_data,
            predictions=predictions,
        )

        prediction_job.refresh_from_db()
        assert prediction_job.input_data == input_data
        assert prediction_job.predictions == predictions

    def test_prediction_job_cascade_delete_model(self, user):
        """Test that deleting model deletes prediction jobs."""
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

        training_job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        trained_model = TrainedModel.objects.create(
            training_job=training_job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
        )

        prediction_job = PredictionJob.objects.create(
            model=trained_model,
            owner=user,
        )
        job_id = prediction_job.id

        trained_model.delete()

        assert not PredictionJob.objects.filter(id=job_id).exists()

    def test_prediction_job_ordering(self, user):
        """Test that prediction jobs are ordered by created_at descending."""
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

        training_job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        trained_model = TrainedModel.objects.create(
            training_job=training_job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
        )

        job1 = PredictionJob.objects.create(model=trained_model, owner=user)
        job2 = PredictionJob.objects.create(model=trained_model, owner=user)
        job3 = PredictionJob.objects.create(model=trained_model, owner=user)

        jobs = list(PredictionJob.objects.filter(owner=user))
        assert jobs[0].id == job3.id
        assert jobs[1].id == job2.id
        assert jobs[2].id == job1.id

    def test_prediction_job_string_representation(self, user):
        """Test prediction job string representation."""
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

        training_job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
        )

        trained_model = TrainedModel.objects.create(
            training_job=training_job,
            dataset=dataset,
            owner=user,
            name='random_forest',
            display_name='Random Forest',
            algorithm_type=TrainedModel.AlgorithmType.RANDOM_FOREST,
            task_type=TrainingJob.TaskType.CLASSIFICATION,
            target_column='target',
        )

        prediction_job = PredictionJob.objects.create(
            model=trained_model,
            owner=user,
        )

        assert 'Prediction' in str(prediction_job)
        assert prediction_job.status in str(prediction_job)
