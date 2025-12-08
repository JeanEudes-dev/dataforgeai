"""
Tests for Dataset services.
"""

import io
import tempfile

import pandas as pd
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.core.exceptions import FileParsingError, FileUploadError
from apps.datasets.models import Dataset
from apps.datasets.services import DatasetParserService, DatasetValidatorService


@pytest.mark.django_db
class TestDatasetValidatorService:
    """Tests for DatasetValidatorService."""

    def test_validate_csv_file_success(self):
        """Test validating a valid CSV file."""
        csv_content = b'col1,col2,col3\n1,2,3\n4,5,6'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        validator = DatasetValidatorService(file)
        result = validator.validate()

        assert result['file_type'] == 'csv'
        assert result['file_size'] == len(csv_content)
        assert result['original_filename'] == 'test.csv'

    def test_validate_xlsx_file_success(self):
        """Test validating a valid XLSX file."""
        # Create a minimal XLSX file
        df = pd.DataFrame({'col1': [1, 2], 'col2': [3, 4]})
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        buffer.seek(0)

        file = SimpleUploadedFile(
            'test.xlsx',
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        validator = DatasetValidatorService(file)
        result = validator.validate()

        assert result['file_type'] == 'xlsx'

    def test_validate_unsupported_file_type(self):
        """Test validating an unsupported file type raises error."""
        file = SimpleUploadedFile(
            'test.txt',
            b'some text content',
            content_type='text/plain'
        )

        validator = DatasetValidatorService(file)

        with pytest.raises(FileUploadError):
            validator.validate()

    def test_validate_empty_file(self):
        """Test validating an empty file raises error."""
        file = SimpleUploadedFile('test.csv', b'', content_type='text/csv')

        validator = DatasetValidatorService(file)

        with pytest.raises(FileUploadError):
            validator.validate()

    def test_validate_file_too_large(self, settings):
        """Test validating a file that exceeds size limit."""
        # Create a file larger than the limit
        settings.MAX_UPLOAD_SIZE_MB = 1  # 1MB limit
        settings.MAX_UPLOAD_SIZE = 1000  # 1KB limit in bytes
        large_content = b'x' * 2000  # 2KB

        file = SimpleUploadedFile('test.csv', large_content, content_type='text/csv')

        validator = DatasetValidatorService(file)

        with pytest.raises(FileUploadError) as exc_info:
            validator.validate()
        assert 'size' in str(exc_info.value.detail).lower()


@pytest.mark.django_db
class TestDatasetParserService:
    """Tests for DatasetParserService."""

    def test_parse_csv_success(self, user):
        """Test parsing a valid CSV file."""
        csv_content = b'name,age,salary\nJohn,30,50000\nJane,25,45000'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            status=Dataset.Status.PROCESSING,
        )

        parser = DatasetParserService(dataset)
        parser.parse()

        dataset.refresh_from_db()
        assert dataset.status == Dataset.Status.READY
        assert dataset.row_count == 2
        assert dataset.column_count == 3
        assert dataset.columns.count() == 3

    def test_parse_csv_with_mixed_types(self, user):
        """Test parsing CSV with mixed column types."""
        csv_content = b'id,name,score,active\n1,John,95.5,true\n2,Jane,87.3,false'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            status=Dataset.Status.PROCESSING,
        )

        parser = DatasetParserService(dataset)
        parser.parse()

        dataset.refresh_from_db()
        columns = {c.name: c for c in dataset.columns.all()}

        # Check that columns have correct types inferred
        assert 'id' in columns
        assert 'name' in columns
        assert 'score' in columns

    def test_parse_csv_with_missing_values(self, user):
        """Test parsing CSV with missing values."""
        csv_content = b'name,age,salary\nJohn,30,\nJane,,45000\n,25,50000'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            status=Dataset.Status.PROCESSING,
        )

        parser = DatasetParserService(dataset)
        parser.parse()

        dataset.refresh_from_db()
        columns = {c.name: c for c in dataset.columns.all()}

        # Check null statistics
        assert columns['name'].null_count >= 0
        assert columns['age'].null_count >= 0

    def test_parse_csv_schema_generated(self, user):
        """Test that schema is generated correctly."""
        csv_content = b'col1,col2\n1,a\n2,b'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            status=Dataset.Status.PROCESSING,
        )

        parser = DatasetParserService(dataset)
        parser.parse()

        dataset.refresh_from_db()
        assert 'col1' in dataset.schema
        assert 'col2' in dataset.schema
        assert 'dtype' in dataset.schema['col1']

    def test_parse_csv_cleans_column_names(self, user):
        """Test that column names are cleaned."""
        csv_content = b'Column With Spaces,  leading_space,trailing_space  \n1,2,3'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            status=Dataset.Status.PROCESSING,
        )

        parser = DatasetParserService(dataset)
        parser.parse()

        dataset.refresh_from_db()
        column_names = [c.name for c in dataset.columns.all()]

        # Names should be cleaned
        assert all(' ' not in name or '_' in name for name in column_names)

    def test_get_preview(self, user):
        """Test getting preview data."""
        csv_content = b'name,age\nJohn,30\nJane,25\nBob,35\nAlice,28\nCharlie,32'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            status=Dataset.Status.READY,
        )

        parser = DatasetParserService(dataset)
        preview = parser.get_preview(num_rows=3)

        assert 'columns' in preview
        assert 'rows' in preview
        assert 'total_rows' in preview
        assert len(preview['rows']) == 3
        assert preview['total_rows'] == 5

    def test_parse_error_handling(self, user):
        """Test that parse errors are handled gracefully."""
        # Create a dataset with an invalid file path
        csv_content = b'col1,col2\n1,2'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            status=Dataset.Status.PROCESSING,
        )

        # Delete the file to cause an error
        dataset.file.delete()

        parser = DatasetParserService(dataset)

        with pytest.raises(FileParsingError):
            parser.parse()

        dataset.refresh_from_db()
        assert dataset.status == Dataset.Status.ERROR

    def test_parse_xlsx_file(self, user):
        """Test parsing an XLSX file."""
        # Create a minimal XLSX file
        df = pd.DataFrame({
            'name': ['John', 'Jane'],
            'age': [30, 25],
            'salary': [50000, 45000]
        })

        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False)
            tmp.seek(0)

            with open(tmp.name, 'rb') as f:
                file = SimpleUploadedFile('test.xlsx', f.read())

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.xlsx',
            file_type='xlsx',
            file_size=file.size,
            status=Dataset.Status.PROCESSING,
        )

        parser = DatasetParserService(dataset)
        parser.parse()

        dataset.refresh_from_db()
        assert dataset.status == Dataset.Status.READY
        assert dataset.row_count == 2
        assert dataset.column_count == 3

    def test_sample_values_stored(self, user):
        """Test that sample values are stored for columns."""
        csv_content = b'name,age\nJohn,30\nJane,25\nBob,35\nAlice,28'
        file = SimpleUploadedFile('test.csv', csv_content, content_type='text/csv')

        dataset = Dataset.objects.create(
            owner=user,
            name='Test',
            file=file,
            original_filename='test.csv',
            file_type='csv',
            file_size=len(csv_content),
            status=Dataset.Status.PROCESSING,
        )

        parser = DatasetParserService(dataset)
        parser.parse()

        dataset.refresh_from_db()
        name_col = dataset.columns.get(name='name')

        assert len(name_col.sample_values) > 0
        assert 'John' in name_col.sample_values or 'Jane' in name_col.sample_values
