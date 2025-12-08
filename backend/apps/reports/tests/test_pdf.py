"""
Tests for PDF Report Generation.
"""

import pytest
from unittest.mock import MagicMock

from apps.reports.services.chart_generator import ChartGeneratorService
from apps.reports.services.pdf_generator import PDFGeneratorService


class TestChartGeneratorService:
    """Tests for ChartGeneratorService."""

    @pytest.fixture
    def chart_generator(self):
        return ChartGeneratorService()

    def test_generate_distribution_chart_numeric(self, chart_generator):
        """Test generating numeric distribution chart."""
        data = {
            'bins': [0, 10, 20, 30, 40, 50],
            'counts': [5, 15, 25, 10, 5]
        }

        result = chart_generator.generate_distribution_chart(data, 'Test Distribution')

        assert result.startswith('data:image/png;base64,')
        assert len(result) > 100  # Should have actual content

    def test_generate_distribution_chart_categorical(self, chart_generator):
        """Test generating categorical distribution chart."""
        data = {
            'labels': ['Category A', 'Category B', 'Category C'],
            'counts': [30, 50, 20]
        }

        result = chart_generator.generate_distribution_chart(data, 'Test Categories')

        assert result.startswith('data:image/png;base64,')

    def test_generate_correlation_heatmap(self, chart_generator):
        """Test generating correlation heatmap."""
        correlation_matrix = {
            'col1': {'col1': 1.0, 'col2': 0.5, 'col3': -0.3},
            'col2': {'col1': 0.5, 'col2': 1.0, 'col3': 0.8},
            'col3': {'col1': -0.3, 'col2': 0.8, 'col3': 1.0},
        }

        result = chart_generator.generate_correlation_heatmap(correlation_matrix)

        assert result.startswith('data:image/png;base64,')

    def test_generate_correlation_heatmap_empty(self, chart_generator):
        """Test correlation heatmap with empty data."""
        result = chart_generator.generate_correlation_heatmap({})

        assert result == ''

    def test_generate_feature_importance_chart(self, chart_generator):
        """Test generating feature importance chart."""
        feature_importance = {
            'feature_1': 0.35,
            'feature_2': 0.25,
            'feature_3': 0.20,
            'feature_4': 0.12,
            'feature_5': 0.08,
        }

        result = chart_generator.generate_feature_importance_chart(feature_importance)

        assert result.startswith('data:image/png;base64,')

    def test_generate_feature_importance_chart_empty(self, chart_generator):
        """Test feature importance with empty data."""
        result = chart_generator.generate_feature_importance_chart({})

        assert result == ''

    def test_generate_roc_curve(self, chart_generator):
        """Test generating ROC curve."""
        roc_data = {
            'fpr': [0.0, 0.1, 0.2, 0.4, 0.6, 1.0],
            'tpr': [0.0, 0.3, 0.5, 0.7, 0.9, 1.0],
            'roc_auc': 0.85
        }

        result = chart_generator.generate_roc_curve(roc_data)

        assert result.startswith('data:image/png;base64,')

    def test_generate_roc_curve_empty(self, chart_generator):
        """Test ROC curve with empty data."""
        result = chart_generator.generate_roc_curve({})

        assert result == ''

    def test_generate_confusion_matrix(self, chart_generator):
        """Test generating confusion matrix."""
        confusion_matrix = [[50, 10], [5, 35]]
        labels = ['Class 0', 'Class 1']

        result = chart_generator.generate_confusion_matrix_chart(
            confusion_matrix, labels=labels
        )

        assert result.startswith('data:image/png;base64,')

    def test_generate_missing_values_chart(self, chart_generator):
        """Test generating missing values chart."""
        missing_data = [
            {'column': 'col1', 'ratio': 0.15},
            {'column': 'col2', 'ratio': 0.08},
            {'column': 'col3', 'ratio': 0.02},
        ]

        result = chart_generator.generate_missing_values_chart(missing_data)

        assert result.startswith('data:image/png;base64,')

    def test_generate_missing_values_chart_empty(self, chart_generator):
        """Test missing values chart with no missing data."""
        missing_data = [
            {'column': 'col1', 'ratio': 0.0},
            {'column': 'col2', 'ratio': 0.0},
        ]

        result = chart_generator.generate_missing_values_chart(missing_data)

        assert result == ''


class TestPDFGeneratorService:
    """Tests for PDFGeneratorService."""

    @pytest.fixture
    def pdf_generator(self):
        return PDFGeneratorService()

    @pytest.fixture
    def mock_report(self):
        """Create a mock report for testing."""
        report = MagicMock()
        report.id = 'test-report-id'
        report.title = 'Test Report'
        report.report_type = 'full'
        report.ai_summary = 'This is a test summary.'
        report.updated_at = '2024-01-01 12:00:00'
        report.content = {
            'dataset': {
                'name': 'Test Dataset',
                'row_count': 1000,
                'column_count': 10,
            },
            'eda': {
                'insights': [
                    {'message': 'Test insight 1', 'severity': 'info'},
                    {'message': 'Test insight 2', 'severity': 'warning'},
                ],
                'missing_values': [
                    {'column': 'col1', 'count': 50, 'ratio': 0.05},
                ],
            },
            'model': {
                'display_name': 'Random Forest',
                'task_type': 'classification',
                'metrics': {
                    'accuracy': 0.95,
                    'f1': 0.93,
                    'confusion_matrix': [[45, 5], [3, 47]],
                },
                'feature_importance': [
                    {'name': 'feature1', 'importance': 0.3},
                    {'name': 'feature2', 'importance': 0.2},
                ],
            },
        }
        return report

    def test_generate_pdf_returns_bytes(self, pdf_generator, mock_report):
        """Test that generate_pdf returns PDF bytes."""
        pdf_bytes = pdf_generator.generate_pdf(mock_report)

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0
        # PDF files start with %PDF
        assert pdf_bytes[:4] == b'%PDF'

    def test_generate_charts_creates_charts(self, pdf_generator, mock_report):
        """Test that _generate_charts creates chart images."""
        charts = pdf_generator._generate_charts(mock_report)

        # Should have confusion matrix chart
        assert 'confusion_matrix' in charts
        assert charts['confusion_matrix'].startswith('data:image/png;base64,')

        # Should have feature importance chart
        assert 'feature_importance' in charts

    def test_generate_pdf_empty_content(self, pdf_generator):
        """Test PDF generation with empty content."""
        report = MagicMock()
        report.id = 'test-report-id'
        report.title = 'Empty Report'
        report.report_type = 'full'
        report.ai_summary = None
        report.updated_at = '2024-01-01 12:00:00'
        report.content = {}

        pdf_bytes = pdf_generator.generate_pdf(report)

        assert isinstance(pdf_bytes, bytes)
        assert pdf_bytes[:4] == b'%PDF'
