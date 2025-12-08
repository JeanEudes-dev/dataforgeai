"""
Test factories for DataForge AI models.

Uses factory_boy for creating test instances.
"""

import uuid
from datetime import datetime
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile

from apps.datasets.models import Dataset, DatasetColumn
from apps.eda.models import EDAResult
from apps.ml.models import TrainedModel, TrainingJob
from apps.predictions.models import PredictionJob
from apps.reports.models import Report
from apps.users.models import User


class UserFactory:
    """Factory for creating User instances."""

    @staticmethod
    def create(email=None, username=None, password='testpass123', **kwargs):
        if email is None:
            email = f'user_{uuid.uuid4().hex[:8]}@example.com'
        if username is None:
            username = f'user_{uuid.uuid4().hex[:8]}'

        return User.objects.create_user(
            email=email,
            username=username,
            password=password,
            **kwargs
        )


class DatasetFactory:
    """Factory for creating Dataset instances."""

    @staticmethod
    def create(owner, name=None, **kwargs):
        if name is None:
            name = f'Test Dataset {uuid.uuid4().hex[:8]}'

        # Create a minimal CSV file
        csv_content = b'col1,col2,col3\n1,2,3\n4,5,6\n'
        file = SimpleUploadedFile(
            name='test.csv',
            content=csv_content,
            content_type='text/csv'
        )

        defaults = {
            'name': name,
            'description': 'Test dataset description',
            'file': file,
            'original_filename': 'test.csv',
            'file_type': 'csv',
            'file_size': len(csv_content),
            'row_count': 2,
            'column_count': 3,
            'schema': {
                'col1': {'dtype': 'numeric', 'nullable': False},
                'col2': {'dtype': 'numeric', 'nullable': False},
                'col3': {'dtype': 'numeric', 'nullable': False},
            },
            'status': Dataset.Status.READY,
        }
        defaults.update(kwargs)

        return Dataset.objects.create(owner=owner, **defaults)


class DatasetColumnFactory:
    """Factory for creating DatasetColumn instances."""

    @staticmethod
    def create(dataset, name, position=0, **kwargs):
        defaults = {
            'original_name': name,
            'dtype': 'numeric',
            'nullable': True,
            'null_count': 0,
            'null_ratio': 0.0,
            'unique_count': 10,
            'sample_values': [1, 2, 3],
            'position': position,
        }
        defaults.update(kwargs)

        return DatasetColumn.objects.create(
            dataset=dataset,
            name=name,
            **defaults
        )


class EDAResultFactory:
    """Factory for creating EDAResult instances."""

    @staticmethod
    def create(dataset, **kwargs):
        defaults = {
            'status': EDAResult.Status.COMPLETED,
            'summary_stats': {
                'col1': {'mean': 2.5, 'std': 1.5, 'min': 1, 'max': 4},
            },
            'distributions': {},
            'correlation_matrix': {},
            'missing_analysis': {},
            'outlier_analysis': {},
            'insights': [
                {'type': 'info', 'message': 'Test insight', 'severity': 'low'}
            ],
            'computation_time': 0.5,
        }
        defaults.update(kwargs)

        return EDAResult.objects.create(dataset=dataset, **defaults)


class TrainingJobFactory:
    """Factory for creating TrainingJob instances."""

    @staticmethod
    def create(dataset, owner, **kwargs):
        defaults = {
            'target_column': 'target',
            'feature_columns': ['feature1', 'feature2'],
            'task_type': TrainingJob.TaskType.CLASSIFICATION,
            'task_type_auto_detected': True,
            'status': TrainingJob.Status.PENDING,
        }
        defaults.update(kwargs)

        return TrainingJob.objects.create(
            dataset=dataset,
            owner=owner,
            **defaults
        )


class TrainedModelFactory:
    """Factory for creating TrainedModel instances."""

    @staticmethod
    def create(training_job, dataset, owner, **kwargs):
        defaults = {
            'name': 'random_forest',
            'display_name': 'Random Forest',
            'algorithm_type': TrainedModel.AlgorithmType.RANDOM_FOREST,
            'task_type': TrainingJob.TaskType.CLASSIFICATION,
            'feature_columns': ['feature1', 'feature2'],
            'target_column': 'target',
            'input_schema': {
                'feature1': {'dtype': 'numeric'},
                'feature2': {'dtype': 'numeric'},
            },
            'metrics': {
                'accuracy': 0.85,
                'f1_weighted': 0.84,
                'precision': 0.86,
                'recall': 0.83,
            },
            'feature_importance': {
                'feature1': 0.6,
                'feature2': 0.4,
            },
            'hyperparameters': {
                'n_estimators': 100,
                'max_depth': 10,
            },
            'is_best': True,
        }
        defaults.update(kwargs)

        return TrainedModel.objects.create(
            training_job=training_job,
            dataset=dataset,
            owner=owner,
            **defaults
        )


class PredictionJobFactory:
    """Factory for creating PredictionJob instances."""

    @staticmethod
    def create(model, owner, **kwargs):
        defaults = {
            'input_type': PredictionJob.InputType.JSON,
            'input_data': [{'feature1': 1.0, 'feature2': 2.0}],
            'input_row_count': 1,
            'predictions': [0],
            'status': PredictionJob.Status.COMPLETED,
        }
        defaults.update(kwargs)

        return PredictionJob.objects.create(
            model=model,
            owner=owner,
            **defaults
        )


class ReportFactory:
    """Factory for creating Report instances."""

    @staticmethod
    def create(owner, dataset, **kwargs):
        defaults = {
            'title': 'Test Report',
            'report_type': Report.ReportType.EDA,
            'content': {'dataset': {'name': 'Test'}},
            'ai_summary': 'Test summary',
            'status': Report.Status.COMPLETED,
        }
        defaults.update(kwargs)

        return Report.objects.create(
            owner=owner,
            dataset=dataset,
            **defaults
        )
