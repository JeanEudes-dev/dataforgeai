"""
Tests for EDA Celery tasks.
"""

import pytest
from unittest.mock import patch, MagicMock

from apps.eda.tasks import run_eda_task


class TestRunEDATask:
    """Tests for run_eda_task."""

    @pytest.mark.django_db
    def test_run_eda_task_dataset_not_found(self):
        """Test task with non-existent dataset."""
        from apps.datasets.models import Dataset

        with pytest.raises(Dataset.DoesNotExist):
            run_eda_task('00000000-0000-0000-0000-000000000000')

    @pytest.mark.django_db
    def test_run_eda_task_updates_status_to_running(self):
        """Test that task updates EDA result status to running."""
        from apps.datasets.models import Dataset
        from apps.eda.models import EDAResult
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
        eda_result = EDAResult.objects.create(
            dataset=dataset,
            status=EDAResult.Status.PENDING,
        )

        # Patch EDAAnalyzerService
        with patch('apps.eda.services.EDAAnalyzerService') as mock_analyzer_class:
            mock_analyzer = MagicMock()
            # Make analyze() return the eda_result with COMPLETED status
            def update_eda_status(eda_result=eda_result):
                eda_result.status = EDAResult.Status.COMPLETED
                eda_result.save()
                return eda_result

            mock_analyzer.analyze.side_effect = update_eda_status
            mock_analyzer_class.return_value = mock_analyzer

            # Run task
            result = run_eda_task(str(dataset.id), str(eda_result.id))

            # Verify analyzer was called
            mock_analyzer_class.assert_called_once_with(dataset)
            mock_analyzer.analyze.assert_called_once()

            # Verify result
            assert result['eda_result_id'] == str(eda_result.id)
            assert result['dataset_id'] == str(dataset.id)

    @pytest.mark.django_db
    def test_run_eda_task_creates_result_if_not_provided(self):
        """Test that task creates EDA result if not provided."""
        from apps.datasets.models import Dataset
        from apps.eda.models import EDAResult
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

        # Patch EDAAnalyzerService
        with patch('apps.eda.services.EDAAnalyzerService') as mock_analyzer_class:
            mock_analyzer = MagicMock()
            # Make analyze() return a new EDA result with COMPLETED status
            new_eda_result = MagicMock()
            new_eda_result.id = 'new-id'
            new_eda_result.status = EDAResult.Status.COMPLETED
            mock_analyzer.analyze.return_value = new_eda_result
            mock_analyzer_class.return_value = mock_analyzer

            # Run task without eda_result_id
            result = run_eda_task(str(dataset.id), None)

            # Verify analyzer was called
            mock_analyzer_class.assert_called_once_with(dataset)
            mock_analyzer.analyze.assert_called_once()

            # Verify result
            assert result['dataset_id'] == str(dataset.id)
