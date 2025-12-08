"""
Tests for EDA models.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.datasets.models import Dataset
from apps.eda.models import EDAResult


@pytest.mark.django_db
class TestEDAResultModel:
    """Tests for the EDAResult model."""

    def test_create_eda_result(self, user):
        """Test creating an EDA result."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        eda_result = EDAResult.objects.create(
            dataset=dataset,
            status=EDAResult.Status.COMPLETED,
            summary_stats={'col1': {'mean': 1.5}},
        )

        assert eda_result.id is not None
        assert eda_result.dataset == dataset
        assert eda_result.version == 1

    def test_eda_result_version_auto_increment(self, user):
        """Test that version auto-increments for same dataset."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        eda1 = EDAResult.objects.create(dataset=dataset)
        eda2 = EDAResult.objects.create(dataset=dataset)
        eda3 = EDAResult.objects.create(dataset=dataset)

        assert eda1.version == 1
        assert eda2.version == 2
        assert eda3.version == 3

    def test_eda_result_status_choices(self, user):
        """Test EDA result status choices."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        eda_result = EDAResult.objects.create(dataset=dataset)

        for status_value, _ in EDAResult.Status.choices:
            eda_result.status = status_value
            eda_result.save()
            eda_result.refresh_from_db()
            assert eda_result.status == status_value

    def test_eda_result_json_fields(self, user):
        """Test that JSON fields store correctly."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        summary_stats = {'col1': {'mean': 2.5, 'std': 1.0}}
        distributions = {'col1': {'bins': [1, 2, 3], 'counts': [5, 10, 5]}}
        correlation_matrix = {'col1': {'col2': 0.85}}
        insights = [{'type': 'warning', 'message': 'Test insight'}]

        eda_result = EDAResult.objects.create(
            dataset=dataset,
            summary_stats=summary_stats,
            distributions=distributions,
            correlation_matrix=correlation_matrix,
            insights=insights,
        )

        eda_result.refresh_from_db()
        assert eda_result.summary_stats == summary_stats
        assert eda_result.distributions == distributions
        assert eda_result.correlation_matrix == correlation_matrix
        assert eda_result.insights == insights

    def test_eda_result_cascade_delete(self, user):
        """Test that deleting dataset deletes its EDA results."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        eda_result = EDAResult.objects.create(dataset=dataset)
        eda_id = eda_result.id

        dataset.delete()

        assert not EDAResult.objects.filter(id=eda_id).exists()

    def test_eda_result_ordering(self, user):
        """Test that EDA results are ordered by created_at descending."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        eda1 = EDAResult.objects.create(dataset=dataset)
        eda2 = EDAResult.objects.create(dataset=dataset)
        eda3 = EDAResult.objects.create(dataset=dataset)

        results = list(EDAResult.objects.filter(dataset=dataset))
        assert results[0].version == 3
        assert results[1].version == 2
        assert results[2].version == 1

    def test_eda_result_sampling_fields(self, user):
        """Test sampling-related fields."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        eda_result = EDAResult.objects.create(
            dataset=dataset,
            sampled=True,
            sample_size=10000,
            computation_time=5.5,
        )

        eda_result.refresh_from_db()
        assert eda_result.sampled is True
        assert eda_result.sample_size == 10000
        assert eda_result.computation_time == 5.5
