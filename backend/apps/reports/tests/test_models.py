"""
Tests for Reports models.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.datasets.models import Dataset
from apps.eda.models import EDAResult
from apps.ml.models import TrainedModel, TrainingJob
from apps.reports.models import Report


@pytest.mark.django_db
class TestReportModel:
    """Tests for the Report model."""

    def test_create_report(self, user):
        """Test creating a report."""
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

        report = Report.objects.create(
            owner=user,
            dataset=dataset,
            title='Test Report',
            report_type=Report.ReportType.EDA,
        )

        assert report.id is not None
        assert report.title == 'Test Report'
        assert report.owner == user
        assert report.status == Report.Status.PENDING

    def test_report_status_choices(self, user):
        """Test report status choices."""
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

        report = Report.objects.create(
            owner=user,
            dataset=dataset,
            title='Test',
        )

        for status_value, _ in Report.Status.choices:
            report.status = status_value
            report.save()
            report.refresh_from_db()
            assert report.status == status_value

    def test_report_type_choices(self, user):
        """Test report type choices."""
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

        for report_type, _ in Report.ReportType.choices:
            report = Report.objects.create(
                owner=user,
                dataset=dataset,
                title='Test',
                report_type=report_type,
            )
            assert report.report_type == report_type

    def test_report_with_eda_result(self, user):
        """Test report with EDA result."""
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

        eda_result = EDAResult.objects.create(
            dataset=dataset,
            status=EDAResult.Status.COMPLETED,
        )

        report = Report.objects.create(
            owner=user,
            dataset=dataset,
            eda_result=eda_result,
            title='EDA Report',
            report_type=Report.ReportType.EDA,
        )

        assert report.eda_result == eda_result

    def test_report_with_trained_model(self, user):
        """Test report with trained model."""
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

        report = Report.objects.create(
            owner=user,
            dataset=dataset,
            trained_model=trained_model,
            title='Model Report',
            report_type=Report.ReportType.MODEL,
        )

        assert report.trained_model == trained_model

    def test_report_content_json(self, user):
        """Test report content JSON field."""
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

        content = {
            'dataset': {
                'name': 'Test',
                'rows': 100,
                'columns': 10,
            },
            'eda': {
                'insights': ['Test insight 1', 'Test insight 2'],
            },
        }

        report = Report.objects.create(
            owner=user,
            dataset=dataset,
            title='Test',
            content=content,
        )

        report.refresh_from_db()
        assert report.content == content
        assert report.content['dataset']['name'] == 'Test'

    def test_report_ai_summary(self, user):
        """Test report AI summary field."""
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

        ai_summary = "This is an AI-generated summary of the report."

        report = Report.objects.create(
            owner=user,
            dataset=dataset,
            title='Test',
            ai_summary=ai_summary,
        )

        report.refresh_from_db()
        assert report.ai_summary == ai_summary

    def test_report_cascade_delete_dataset(self, user):
        """Test that deleting dataset deletes reports."""
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

        report = Report.objects.create(
            owner=user,
            dataset=dataset,
            title='Test',
        )
        report_id = report.id

        dataset.delete()

        assert not Report.objects.filter(id=report_id).exists()

    def test_report_ordering(self, user):
        """Test that reports are ordered by created_at descending."""
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

        report1 = Report.objects.create(owner=user, dataset=dataset, title='Report 1')
        report2 = Report.objects.create(owner=user, dataset=dataset, title='Report 2')
        report3 = Report.objects.create(owner=user, dataset=dataset, title='Report 3')

        reports = list(Report.objects.filter(owner=user))
        assert reports[0].title == 'Report 3'
        assert reports[1].title == 'Report 2'
        assert reports[2].title == 'Report 1'

    def test_report_string_representation(self, user):
        """Test report string representation."""
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

        report = Report.objects.create(
            owner=user,
            dataset=dataset,
            title='My Report',
            report_type=Report.ReportType.FULL,
        )

        assert 'My Report' in str(report)
