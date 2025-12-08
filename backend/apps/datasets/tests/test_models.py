"""
Tests for Dataset models.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.datasets.models import Dataset, DatasetColumn
from apps.users.models import User


@pytest.mark.django_db
class TestDatasetModel:
    """Tests for the Dataset model."""

    def test_create_dataset(self, user):
        """Test creating a dataset."""
        csv_content = b'col1,col2\n1,2\n3,4'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test Dataset',
            description='Test description',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            row_count=2,
            column_count=2,
        )

        assert dataset.id is not None
        assert dataset.name == 'Test Dataset'
        assert dataset.owner == user
        assert dataset.file_type == 'csv'
        assert dataset.status == Dataset.Status.UPLOADING

    def test_dataset_has_uuid_pk(self, user):
        """Test that dataset has UUID primary key."""
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

        # UUID should be 36 chars with hyphens
        assert len(str(dataset.id)) == 36

    def test_dataset_status_choices(self, user):
        """Test dataset status choices."""
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

        # Test all status values
        for status_value, _ in Dataset.Status.choices:
            dataset.status = status_value
            dataset.save()
            dataset.refresh_from_db()
            assert dataset.status == status_value

    def test_dataset_string_representation(self, user):
        """Test dataset string representation."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='My Dataset',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        assert 'My Dataset' in str(dataset)

    def test_dataset_timestamps(self, user):
        """Test that dataset has created_at and updated_at."""
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

        assert dataset.created_at is not None
        assert dataset.updated_at is not None

    def test_dataset_ordering(self, user):
        """Test that datasets are ordered by created_at descending."""
        csv_content = b'col1,col2\n1,2'

        for i in range(3):
            file = SimpleUploadedFile(f'test{i}.csv', csv_content, content_type='text/csv')
            Dataset.objects.create(
                owner=user,
                name=f'Dataset {i}',
                file=file,
                original_filename=f'test{i}.csv',
                file_type='csv',
                file_size=len(csv_content),
            )

        datasets = list(Dataset.objects.filter(owner=user))
        assert datasets[0].name == 'Dataset 2'
        assert datasets[1].name == 'Dataset 1'
        assert datasets[2].name == 'Dataset 0'

    def test_dataset_file_size_display(self, user):
        """Test file_size_display property."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        # Small file (bytes)
        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=500,
        )
        assert 'B' in dataset.file_size_display

        # KB file
        dataset.file_size = 5000
        dataset.save()
        assert 'KB' in dataset.file_size_display

        # MB file
        dataset.file_size = 5000000
        dataset.save()
        assert 'MB' in dataset.file_size_display

    def test_dataset_schema_json(self, user):
        """Test that schema is stored as JSON."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        schema = {
            'col1': {'dtype': 'numeric', 'nullable': False},
            'col2': {'dtype': 'numeric', 'nullable': False},
        }

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            schema=schema,
        )

        dataset.refresh_from_db()
        assert dataset.schema == schema
        assert dataset.schema['col1']['dtype'] == 'numeric'

    def test_dataset_cascade_delete(self, user):
        """Test that deleting user deletes their datasets."""
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
        dataset_id = dataset.id

        user.delete()

        assert not Dataset.objects.filter(id=dataset_id).exists()


@pytest.mark.django_db
class TestDatasetColumnModel:
    """Tests for the DatasetColumn model."""

    def test_create_dataset_column(self, user):
        """Test creating a dataset column."""
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

        column = DatasetColumn.objects.create(
            dataset=dataset,
            name='col1',
            original_name='col1',
            dtype='numeric',
            position=0,
            unique_count=2,
            sample_values=[1, 3],
        )

        assert column.id is not None
        assert column.name == 'col1'
        assert column.dtype == 'numeric'

    def test_dataset_column_ordering(self, user):
        """Test that columns are ordered by position."""
        csv_content = b'col1,col2,col3\n1,2,3'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        # Create in reverse order
        for i in range(3, 0, -1):
            DatasetColumn.objects.create(
                dataset=dataset,
                name=f'col{i}',
                original_name=f'col{i}',
                dtype='numeric',
                position=i - 1,
            )

        columns = list(dataset.columns.all())
        assert columns[0].name == 'col1'
        assert columns[1].name == 'col2'
        assert columns[2].name == 'col3'

    def test_dataset_column_string_representation(self, user):
        """Test column string representation."""
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test Dataset',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
        )

        column = DatasetColumn.objects.create(
            dataset=dataset,
            name='my_column',
            original_name='my_column',
            dtype='numeric',
            position=0,
        )

        assert 'my_column' in str(column)

    def test_dataset_column_cascade_delete(self, user):
        """Test that deleting dataset deletes its columns."""
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

        column = DatasetColumn.objects.create(
            dataset=dataset,
            name='col1',
            original_name='col1',
            dtype='numeric',
            position=0,
        )
        column_id = column.id

        dataset.delete()

        assert not DatasetColumn.objects.filter(id=column_id).exists()

    def test_dataset_column_null_statistics(self, user):
        """Test column null statistics fields."""
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

        column = DatasetColumn.objects.create(
            dataset=dataset,
            name='col1',
            original_name='col1',
            dtype='numeric',
            position=0,
            null_count=5,
            null_ratio=0.25,
        )

        column.refresh_from_db()
        assert column.null_count == 5
        assert column.null_ratio == 0.25
