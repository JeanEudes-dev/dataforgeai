"""
EDA Insights Service.

Generates rule-based insights from EDA results.
"""

import logging
from typing import Any

import pandas as pd

from apps.eda.models import EDAResult

logger = logging.getLogger(__name__)


class EDAInsightsService:
    """
    Service for generating insights from EDA results.

    Produces rule-based insights such as:
    - High missing value warnings
    - Strong correlation alerts
    - Outlier warnings
    - Potential ID column detection
    - Data quality observations
    """

    # Thresholds for insights
    HIGH_MISSING_THRESHOLD = 0.05  # 5%
    VERY_HIGH_MISSING_THRESHOLD = 0.20  # 20%
    STRONG_CORRELATION_THRESHOLD = 0.7
    HIGH_OUTLIER_THRESHOLD = 0.05  # 5%
    ID_COLUMN_UNIQUE_THRESHOLD = 0.95  # 95%

    class Severity:
        INFO = 'info'
        WARNING = 'warning'
        ERROR = 'error'

    class InsightType:
        MISSING_VALUES = 'missing_values'
        CORRELATION = 'correlation'
        OUTLIERS = 'outliers'
        DATA_QUALITY = 'data_quality'
        DISTRIBUTION = 'distribution'
        GENERAL = 'general'

    def __init__(self, eda_result: EDAResult, df: pd.DataFrame):
        self.eda_result = eda_result
        self.df = df
        self.insights: list[dict] = []

    def generate_insights(self) -> list[dict]:
        """Generate all insights."""
        self._check_missing_values()
        self._check_correlations()
        self._check_outliers()
        self._check_potential_id_columns()
        self._check_constant_columns()
        self._check_data_types()
        self._generate_summary_insights()

        # Sort by severity
        severity_order = {
            self.Severity.ERROR: 0,
            self.Severity.WARNING: 1,
            self.Severity.INFO: 2,
        }
        self.insights.sort(key=lambda x: severity_order.get(x['severity'], 3))

        return self.insights

    def _add_insight(
        self,
        insight_type: str,
        message: str,
        severity: str,
        column: str | None = None,
        value: Any = None
    ) -> None:
        """Add an insight to the list."""
        self.insights.append({
            'type': insight_type,
            'message': message,
            'severity': severity,
            'column': column,
            'value': value,
        })

    def _check_missing_values(self) -> None:
        """Check for columns with high missing values."""
        missing_analysis = self.eda_result.missing_analysis

        for col, info in missing_analysis.items():
            ratio = info['ratio']
            percentage = info['percentage']

            if ratio >= self.VERY_HIGH_MISSING_THRESHOLD:
                self._add_insight(
                    self.InsightType.MISSING_VALUES,
                    f"Column '{col}' has {percentage:.1f}% missing values. "
                    f"Consider dropping or imputing.",
                    self.Severity.WARNING,
                    column=col,
                    value=ratio
                )
            elif ratio >= self.HIGH_MISSING_THRESHOLD:
                self._add_insight(
                    self.InsightType.MISSING_VALUES,
                    f"Column '{col}' has {percentage:.1f}% missing values.",
                    self.Severity.INFO,
                    column=col,
                    value=ratio
                )

    def _check_correlations(self) -> None:
        """Check for strong correlations."""
        top_correlations = self.eda_result.top_correlations

        for corr_info in top_correlations:
            if abs(corr_info['correlation']) >= self.STRONG_CORRELATION_THRESHOLD:
                col1 = corr_info['column1']
                col2 = corr_info['column2']
                corr_val = corr_info['correlation']

                direction = 'positively' if corr_val > 0 else 'negatively'

                self._add_insight(
                    self.InsightType.CORRELATION,
                    f"'{col1}' and '{col2}' are strongly {direction} correlated "
                    f"(r = {corr_val:.2f}). Consider if both are needed.",
                    self.Severity.INFO,
                    column=f"{col1}, {col2}",
                    value=corr_val
                )

    def _check_outliers(self) -> None:
        """Check for columns with high outlier counts."""
        outlier_analysis = self.eda_result.outlier_analysis

        for col, info in outlier_analysis.items():
            ratio = info['ratio']

            if ratio >= self.HIGH_OUTLIER_THRESHOLD:
                percentage = ratio * 100
                self._add_insight(
                    self.InsightType.OUTLIERS,
                    f"Column '{col}' has {percentage:.1f}% outliers "
                    f"({info['count']} values outside IQR bounds).",
                    self.Severity.WARNING,
                    column=col,
                    value=ratio
                )

    def _check_potential_id_columns(self) -> None:
        """Detect columns that might be ID columns."""
        summary_stats = self.eda_result.summary_stats

        for col, stats in summary_stats.items():
            unique_count = stats.get('unique_count', 0)
            count = stats.get('count', 0)

            if count > 0:
                unique_ratio = unique_count / count

                if unique_ratio >= self.ID_COLUMN_UNIQUE_THRESHOLD:
                    self._add_insight(
                        self.InsightType.DATA_QUALITY,
                        f"Column '{col}' appears to be an ID column "
                        f"({unique_ratio*100:.0f}% unique values). "
                        f"Consider excluding from ML features.",
                        self.Severity.INFO,
                        column=col,
                        value=unique_ratio
                    )

    def _check_constant_columns(self) -> None:
        """Detect columns with only one unique value."""
        summary_stats = self.eda_result.summary_stats

        for col, stats in summary_stats.items():
            unique_count = stats.get('unique_count', 0)

            if unique_count == 1:
                self._add_insight(
                    self.InsightType.DATA_QUALITY,
                    f"Column '{col}' has only one unique value. "
                    f"Consider removing as it provides no information.",
                    self.Severity.WARNING,
                    column=col,
                    value=1
                )

    def _check_data_types(self) -> None:
        """Check for potential data type issues."""
        for col in self.df.columns:
            col_data = self.df[col]

            # Check for numeric columns stored as strings
            if col_data.dtype == 'object':
                # Try to convert to numeric
                numeric = pd.to_numeric(col_data, errors='coerce')
                non_null_count = col_data.count()

                if non_null_count > 0:
                    numeric_ratio = numeric.count() / non_null_count

                    if numeric_ratio >= 0.9:
                        self._add_insight(
                            self.InsightType.DATA_QUALITY,
                            f"Column '{col}' appears to contain numeric values "
                            f"stored as text. Consider converting to numeric.",
                            self.Severity.INFO,
                            column=col,
                            value=numeric_ratio
                        )

    def _generate_summary_insights(self) -> None:
        """Generate high-level summary insights."""
        # Dataset size summary
        row_count = len(self.df)
        col_count = len(self.df.columns)

        self._add_insight(
            self.InsightType.GENERAL,
            f"Dataset contains {row_count:,} rows and {col_count} columns.",
            self.Severity.INFO,
            value={'rows': row_count, 'columns': col_count}
        )

        # Missing values summary
        total_missing = self.df.isnull().sum().sum()
        total_cells = row_count * col_count
        if total_cells > 0:
            missing_ratio = total_missing / total_cells
            if missing_ratio > 0:
                self._add_insight(
                    self.InsightType.GENERAL,
                    f"Overall {missing_ratio*100:.1f}% of values are missing.",
                    self.Severity.INFO if missing_ratio < 0.1 else self.Severity.WARNING,
                    value=missing_ratio
                )

        # Numeric vs categorical breakdown
        numeric_cols = len(self.df.select_dtypes(include=['number']).columns)
        categorical_cols = col_count - numeric_cols

        if numeric_cols > 0 or categorical_cols > 0:
            self._add_insight(
                self.InsightType.GENERAL,
                f"Found {numeric_cols} numeric and {categorical_cols} "
                f"categorical columns.",
                self.Severity.INFO,
                value={'numeric': numeric_cols, 'categorical': categorical_cols}
            )

        # Sample warning if applicable
        if self.eda_result.sampled:
            self._add_insight(
                self.InsightType.GENERAL,
                f"Analysis performed on a sample of {self.eda_result.sample_size:,} rows "
                f"(original dataset is larger). Results are approximate.",
                self.Severity.INFO,
                value=self.eda_result.sample_size
            )
