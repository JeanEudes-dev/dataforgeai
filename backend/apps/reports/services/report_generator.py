"""
Report Generator Service.

Handles generation of analysis reports.
"""

import logging
from typing import Any

from django.utils import timezone

from apps.assistant.services import GeminiService
from apps.datasets.models import Dataset
from apps.eda.models import EDAResult
from apps.ml.models import TrainedModel
from apps.reports.models import Report

logger = logging.getLogger(__name__)


class ReportGeneratorService:
    """
    Service for generating analysis reports.

    Creates comprehensive reports combining:
    - Dataset information
    - EDA results and insights
    - Model performance and explanations
    - AI-generated summaries
    """

    def __init__(self):
        self.gemini = GeminiService()

    def generate_report(self, report: Report) -> Report:
        """
        Generate a complete report.

        Args:
            report: Report instance with dataset, eda_result, trained_model set

        Returns:
            Updated Report with generated content
        """
        try:
            report.status = Report.Status.GENERATING
            report.save()

            content = {}

            # Generate dataset section
            content['dataset'] = self._generate_dataset_section(report.dataset)

            # Generate EDA section if available
            if report.eda_result:
                content['eda'] = self._generate_eda_section(report.eda_result)

            # Generate model section if available
            if report.trained_model:
                content['model'] = self._generate_model_section(report.trained_model)

            # Store content
            report.content = content

            # Generate AI summary
            if report.report_type == Report.ReportType.FULL:
                report.ai_summary = self._generate_summary(report)
            elif report.report_type == Report.ReportType.EDA:
                report.ai_summary = self._generate_eda_summary(report)
            elif report.report_type == Report.ReportType.MODEL:
                report.ai_summary = self._generate_model_summary(report)

            report.status = Report.Status.COMPLETED
            report.save()

            logger.info(f'Report {report.id} generated successfully')
            return report

        except Exception as e:
            logger.error(f'Report generation failed for {report.id}: {e}')
            report.status = Report.Status.ERROR
            report.error_message = str(e)
            report.save()
            raise

    def _generate_dataset_section(self, dataset: Dataset) -> dict:
        """Generate dataset information section."""
        return {
            'name': dataset.name,
            'description': dataset.description,
            'file_type': dataset.file_type,
            'file_size': dataset.file_size,
            'file_size_display': self._format_file_size(dataset.file_size),
            'row_count': dataset.row_count,
            'column_count': dataset.column_count,
            'created_at': dataset.created_at.isoformat(),
            'schema': dataset.schema,
            'columns': self._get_columns_summary(dataset),
        }

    def _get_columns_summary(self, dataset: Dataset) -> list:
        """Get summary of dataset columns."""
        columns = []
        for col in dataset.columns.all()[:20]:  # Limit to 20 columns
            columns.append({
                'name': col.name,
                'dtype': col.dtype,
                'null_ratio': col.null_ratio,
                'unique_count': col.unique_count,
            })
        return columns

    def _generate_eda_section(self, eda_result: EDAResult) -> dict:
        """Generate EDA results section."""
        return {
            'summary_stats': self._summarize_stats(eda_result.summary_stats),
            'missing_values': self._summarize_missing(eda_result.missing_analysis),
            'correlations': self._summarize_correlations(eda_result.correlation_matrix),
            'outliers': self._summarize_outliers(eda_result.outlier_analysis),
            'insights': eda_result.insights,
            'sampled': eda_result.sampled,
            'sample_size': eda_result.sample_size,
            'computation_time': eda_result.computation_time,
        }

    def _summarize_stats(self, summary_stats: dict) -> dict:
        """Create summary of key statistics."""
        summary = {
            'numeric_columns': [],
            'categorical_columns': [],
        }

        for col, stats in summary_stats.items():
            if 'mean' in stats:
                summary['numeric_columns'].append({
                    'name': col,
                    'mean': stats.get('mean'),
                    'std': stats.get('std'),
                    'min': stats.get('min'),
                    'max': stats.get('max'),
                })
            else:
                summary['categorical_columns'].append({
                    'name': col,
                    'unique': stats.get('unique'),
                    'top': stats.get('top'),
                })

        return summary

    def _summarize_missing(self, missing_analysis: dict) -> list:
        """Summarize columns with missing values."""
        missing = []
        for col, data in missing_analysis.items():
            if data.get('ratio', 0) > 0:
                missing.append({
                    'column': col,
                    'count': data.get('count', 0),
                    'ratio': data.get('ratio', 0),
                })

        # Sort by ratio descending
        missing.sort(key=lambda x: x['ratio'], reverse=True)
        return missing[:10]  # Top 10

    def _summarize_correlations(self, correlation_matrix: dict) -> list:
        """Extract strongest correlations."""
        correlations = []
        seen = set()

        for col1, cols in correlation_matrix.items():
            for col2, value in cols.items():
                if col1 != col2 and (col2, col1) not in seen:
                    seen.add((col1, col2))
                    if abs(value) > 0.5:  # Only strong correlations
                        correlations.append({
                            'column1': col1,
                            'column2': col2,
                            'correlation': value,
                        })

        # Sort by absolute correlation descending
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
        return correlations[:10]  # Top 10

    def _summarize_outliers(self, outlier_analysis: dict) -> list:
        """Summarize outlier information."""
        outliers = []
        for col, data in outlier_analysis.items():
            if data.get('count', 0) > 0:
                outliers.append({
                    'column': col,
                    'count': data.get('count', 0),
                    'method': data.get('method', 'IQR'),
                })

        # Sort by count descending
        outliers.sort(key=lambda x: x['count'], reverse=True)
        return outliers[:10]

    def _generate_model_section(self, model: TrainedModel) -> dict:
        """Generate model performance section."""
        return {
            'name': model.name,
            'display_name': model.display_name,
            'algorithm_type': model.algorithm_type,
            'task_type': model.task_type,
            'metrics': model.metrics,
            'primary_metric': model.primary_metric,
            'feature_importance': self._top_features(model.feature_importance),
            'hyperparameters': model.hyperparameters,
            'cross_val_scores': model.cross_val_scores,
            'is_best': model.is_best,
            'model_size': model.model_size,
            'model_size_display': self._format_file_size(model.model_size or 0),
        }

    def _top_features(self, feature_importance: dict) -> list:
        """Get top N important features."""
        if not feature_importance:
            return []

        features = [
            {'name': k, 'importance': v}
            for k, v in feature_importance.items()
        ]
        features.sort(key=lambda x: x['importance'], reverse=True)
        return features[:10]

    def _generate_summary(self, report: Report) -> str:
        """Generate full report AI summary."""
        report_data = {
            'title': report.title,
            'report_type': report.report_type,
            'dataset_info': report.content.get('dataset', {}),
            'eda_highlights': report.content.get('eda', {}),
            'model_performance': report.content.get('model', {}),
        }

        return self.gemini.generate_report_summary(report_data)

    def _generate_eda_summary(self, report: Report) -> str:
        """Generate EDA-focused summary."""
        if report.eda_result:
            return self.gemini.generate_eda_insights({
                'summary_stats': report.eda_result.summary_stats,
                'missing_analysis': report.eda_result.missing_analysis,
                'correlation_matrix': report.eda_result.correlation_matrix,
                'outlier_analysis': report.eda_result.outlier_analysis,
                'insights': report.eda_result.insights,
            })
        return "No EDA results available for summary."

    def _generate_model_summary(self, report: Report) -> str:
        """Generate model-focused summary."""
        if report.trained_model:
            return self.gemini.explain_model({
                'display_name': report.trained_model.display_name,
                'algorithm_type': report.trained_model.algorithm_type,
                'task_type': report.trained_model.task_type,
                'metrics': report.trained_model.metrics,
                'feature_importance': report.trained_model.feature_importance,
                'hyperparameters': report.trained_model.hyperparameters,
            })
        return "No model available for summary."

    def _format_file_size(self, size_bytes: int) -> str:
        """Format file size for display."""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
