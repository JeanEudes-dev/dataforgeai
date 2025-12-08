"""
Tests for ML Celery tasks.
"""

import pytest
from unittest.mock import patch, MagicMock

from apps.ml.tasks import train_models_task


class TestTrainModelsTask:
    """Tests for train_models_task."""

    @pytest.mark.django_db
    def test_train_models_task_job_not_found(self):
        """Test task with non-existent job."""
        from apps.ml.models import TrainingJob

        with pytest.raises(TrainingJob.DoesNotExist):
            train_models_task('00000000-0000-0000-0000-000000000000')

    @pytest.mark.django_db
    def test_train_models_task_updates_status_to_running(self):
        """Test that task updates job status to running."""
        from apps.datasets.models import Dataset
        from apps.ml.models import TrainingJob
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # Create test data
        user = User.objects.create_user(
            email='test@example.com',
            password='testpassword123'
        )
        dataset = Dataset.objects.create(
            name='Test Dataset',
            owner=user,
            status=Dataset.Status.READY,
            row_count=100,
            column_count=5,
            file_size=1024,
        )
        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
            status=TrainingJob.Status.PENDING,
        )

        # Patch ModelTrainerService to track calls but not actually run training
        with patch('apps.ml.services.ModelTrainerService') as mock_trainer_class:
            mock_trainer = MagicMock()
            # Make train() return the job with COMPLETED status
            def update_job_status(j=job):
                j.status = TrainingJob.Status.COMPLETED
                j.save()
                return j

            mock_trainer.train.side_effect = update_job_status
            mock_trainer_class.return_value = mock_trainer

            # Run task
            train_models_task(str(job.id))

            # Verify trainer was called
            mock_trainer_class.assert_called_once()
            mock_trainer.train.assert_called_once()

    @pytest.mark.django_db
    def test_train_models_task_handles_error(self):
        """Test that task sets error status on failure."""
        from apps.datasets.models import Dataset
        from apps.ml.models import TrainingJob
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # Create test data
        user = User.objects.create_user(
            email='test2@example.com',
            password='testpassword123'
        )
        dataset = Dataset.objects.create(
            name='Test Dataset 2',
            owner=user,
            status=Dataset.Status.READY,
            row_count=100,
            column_count=5,
            file_size=1024,
        )
        job = TrainingJob.objects.create(
            dataset=dataset,
            owner=user,
            target_column='target',
            status=TrainingJob.Status.PENDING,
        )

        # Patch ModelTrainerService to raise error
        with patch('apps.ml.services.ModelTrainerService') as mock_trainer_class:
            mock_trainer = MagicMock()
            mock_trainer.train.side_effect = Exception('Training failed')
            mock_trainer_class.return_value = mock_trainer

            # Run task - should not raise due to error handling
            train_models_task(str(job.id))

            # Verify job status was set to error
            job.refresh_from_db()
            assert job.status == TrainingJob.Status.ERROR
            assert 'Training failed' in job.error_message
