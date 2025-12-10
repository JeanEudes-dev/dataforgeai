"""
PDF Report Generator Service.

Generates PDF reports using WeasyPrint.
"""

import io
import logging
from typing import Any

from django.template.loader import render_to_string
from weasyprint import HTML, CSS

from apps.reports.models import Report
from .chart_generator import ChartGeneratorService

logger = logging.getLogger(__name__)


class PDFGeneratorService:
    """
    Service for generating PDF reports.

    Uses HTML templates and WeasyPrint for PDF rendering.
    """

    # Base CSS for reports
    BASE_CSS = """
        @page {
            size: A4;
            margin: 2cm;
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 9pt;
                color: #666;
            }
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
        }
        h1 {
            font-size: 22pt;
            color: #2c3e50;
            margin-bottom: 20px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            font-size: 16pt;
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        h3 {
            font-size: 13pt;
            color: #7f8c8d;
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-size: 10pt;
        }
        th {
            background-color: #3498db;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .metric-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin: 20px 0;
        }
        .metric-box {
            padding: 15px;
            background: #ecf0f1;
            border-radius: 5px;
            min-width: 120px;
        }
        .metric-value {
            font-size: 18pt;
            font-weight: bold;
            color: #2c3e50;
        }
        .metric-label {
            font-size: 9pt;
            color: #7f8c8d;
            text-transform: uppercase;
        }
        .insight {
            padding: 12px 15px;
            margin: 10px 0;
            background: #e8f6f3;
            border-left: 4px solid #1abc9c;
            font-size: 10pt;
        }
        .insight-warning {
            background: #fef9e7;
            border-left-color: #f39c12;
        }
        .insight-error {
            background: #fdedec;
            border-left-color: #e74c3c;
        }
        .chart {
            margin: 20px 0;
            text-align: center;
        }
        .chart img {
            max-width: 100%;
            height: auto;
        }
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            font-style: italic;
        }
        .header-meta {
            color: #666;
            font-size: 10pt;
            margin-bottom: 30px;
        }
        .footer {
            text-align: center;
            color: #999;
            font-size: 9pt;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    """

    def __init__(self):
        self.chart_generator = ChartGeneratorService()

    def generate_pdf(self, report: Report) -> bytes:
        """
        Generate PDF from report.

        Args:
            report: Report instance with content populated

        Returns:
            PDF file as bytes
        """
        try:
            # Generate charts for the report
            charts = self._generate_charts(report)

            # Render HTML template
            html_content = self._render_html(report, charts)

            # Generate PDF
            html = HTML(string=html_content)
            css = CSS(string=self.BASE_CSS)

            pdf_buffer = io.BytesIO()
            html.write_pdf(pdf_buffer, stylesheets=[css])
            pdf_buffer.seek(0)

            return pdf_buffer.read()

        except Exception as e:
            logger.error(f'PDF generation failed for report {report.id}: {e}')
            raise

    def _generate_charts(self, report: Report) -> dict[str, Any]:
        """Generate all charts for the report."""
        charts = {}
        content = report.content or {}

        # EDA charts
        eda = content.get('eda', {})
        if eda:
            # Data quality gauge
            if eda.get('data_quality_score'):
                charts['data_quality'] = self.chart_generator.generate_data_quality_chart(
                    eda['data_quality_score']
                )

            # Correlation heatmap - prefer correlation_matrix if available
            if eda.get('correlation_matrix'):
                charts['correlation_heatmap'] = self.chart_generator.generate_correlation_heatmap(
                    eda['correlation_matrix']
                )
            elif eda.get('correlations'):
                corr_matrix = {}
                for item in eda.get('correlations', []):
                    col1, col2 = item.get('column1'), item.get('column2')
                    corr = item.get('correlation', 0)
                    if col1 not in corr_matrix:
                        corr_matrix[col1] = {}
                    corr_matrix[col1][col2] = corr
                    if col2 not in corr_matrix:
                        corr_matrix[col2] = {}
                    corr_matrix[col2][col1] = corr

                if corr_matrix:
                    charts['correlation_heatmap'] = self.chart_generator.generate_correlation_heatmap(
                        corr_matrix
                    )

            # Missing values chart
            if eda.get('missing_values'):
                charts['missing_values'] = self.chart_generator.generate_missing_values_chart(
                    eda['missing_values']
                )

        # Model charts
        model = content.get('model', {})
        if model:
            # Feature importance
            if model.get('feature_importance'):
                # Convert list format to dict
                fi = model['feature_importance']
                if isinstance(fi, list):
                    fi_dict = {item['name']: item['importance'] for item in fi}
                else:
                    fi_dict = fi
                charts['feature_importance'] = self.chart_generator.generate_feature_importance_chart(
                    fi_dict
                )

            # ROC curve (for classification)
            metrics = model.get('metrics', {})
            if metrics.get('roc_curve'):
                roc_data = metrics['roc_curve']
                roc_data['roc_auc'] = metrics.get('roc_auc')
                charts['roc_curve'] = self.chart_generator.generate_roc_curve(roc_data)

            # Confusion matrix
            if metrics.get('confusion_matrix'):
                charts['confusion_matrix'] = self.chart_generator.generate_confusion_matrix_chart(
                    metrics['confusion_matrix'],
                    labels=metrics.get('confusion_matrix_labels')
                )

            # Cross-validation scores
            if metrics.get('cv_scores'):
                charts['cv_scores'] = self.chart_generator.generate_cv_scores_chart(
                    metrics['cv_scores']
                )

        # Model comparison chart
        model_comparison = report.model_comparison or []
        if len(model_comparison) >= 2:
            charts['model_comparison'] = self.chart_generator.generate_model_comparison_chart(
                model_comparison
            )

        # Distribution charts
        distributions = eda.get('distributions', [])
        if distributions:
            charts['distribution_charts'] = self.chart_generator.generate_distribution_charts(
                distributions,
                max_charts=6
            )

        return charts

    def _render_html(self, report: Report, charts: dict) -> str:
        """Render the report to HTML."""
        content = report.content or {}
        model_comparison = report.model_comparison or []

        # Extract distribution charts separately
        distribution_charts = charts.pop('distribution_charts', [])

        # Determine comparison metrics for table header
        comparison_metrics = []
        if model_comparison:
            all_metrics = set()
            for model in model_comparison:
                metrics = model.get('metrics', {})
                for key in metrics.keys():
                    if key not in ['confusion_matrix', 'roc_curve', 'confusion_matrix_labels', 'cv_scores']:
                        all_metrics.add(key)
            comparison_metrics = list(all_metrics)[:5]

        # Prepare context
        context = {
            'report': report,
            'title': report.title,
            'content': content,
            'ai_summary': report.ai_summary,
            'dataset': content.get('dataset', {}),
            'eda': content.get('eda', {}),
            'model': content.get('model', {}),
            'charts': charts,
            'distribution_charts': distribution_charts,
            'model_comparison': model_comparison,
            'comparison_metrics': comparison_metrics,
            'report_metadata': report.report_metadata or {},
            'generated_at': report.updated_at,
        }

        # Determine template based on report type
        template_name = f'reports/pdf/{report.report_type}_report.html'

        try:
            return render_to_string(template_name, context)
        except Exception as e:
            logger.warning(f'Template {template_name} not found, using generic: {e}')
            return render_to_string('reports/pdf/generic_report.html', context)
