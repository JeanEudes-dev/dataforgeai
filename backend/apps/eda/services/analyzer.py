"""
EDA Analyzer Service.

Performs automated exploratory data analysis on datasets.
"""

import logging
import time
from typing import Any

import numpy as np
import pandas as pd
from django.conf import settings

from apps.core.exceptions import EDAError
from apps.datasets.models import Dataset
from apps.eda.models import EDAResult

logger = logging.getLogger(__name__)


class EDAAnalyzerService:
    """
    Service for performing automated EDA on datasets.

    Computes:
    - Summary statistics
    - Distributions (histograms)
    - Correlation matrix
    - Missing value analysis
    - Outlier detection
    """

    # Number of bins for histograms
    HISTOGRAM_BINS = 20

    # Maximum number of categories to show in distribution
    MAX_CATEGORIES = 20

    # Correlation threshold for "strong" correlations
    CORRELATION_THRESHOLD = 0.7

    def __init__(self, dataset: Dataset):
        self.dataset = dataset
        self.df: pd.DataFrame | None = None
        self.eda_result: EDAResult | None = None

    def analyze(
        self,
        eda_result: EDAResult = None,
        force_refresh: bool = False
    ) -> EDAResult:
        """
        Perform complete EDA on the dataset.

        Args:
            eda_result: Optional existing EDAResult to update
            force_refresh: If True, bypass cache

        Returns:
            EDAResult with all computed statistics
        """
        start_time = time.time()

        # Compute file hash for caching
        if not self.dataset.file_hash:
            self.dataset.file_hash = self.dataset.compute_file_hash()
            self.dataset.save(update_fields=['file_hash'])

        cache_key = self.dataset.file_hash

        # Check for cached result if not forcing refresh
        if not force_refresh and cache_key:
            cached_result = self._get_cached_result(cache_key)
            if cached_result:
                logger.info(
                    f'Returning cached EDA result {cached_result.id} '
                    f'for dataset {self.dataset.id}'
                )
                return cached_result

        # Use provided EDA result or create new one
        if eda_result:
            self.eda_result = eda_result
            self.eda_result.status = EDAResult.Status.RUNNING
            self.eda_result.save(update_fields=['status'])
        else:
            self.eda_result = EDAResult.objects.create(
                dataset=self.dataset,
                status=EDAResult.Status.RUNNING
            )

        try:
            # Load the dataset
            self.df = self._load_dataset()

            # Compute all analyses
            self.eda_result.summary_stats = self._compute_summary_stats()
            self.eda_result.distributions = self._compute_distributions()
            self.eda_result.correlation_matrix = self._compute_correlations()
            self.eda_result.top_correlations = self._get_top_correlations()
            self.eda_result.missing_analysis = self._analyze_missing_values()
            self.eda_result.outlier_analysis = self._detect_outliers()

            # Generate insights
            from .insights import EDAInsightsService
            insights_service = EDAInsightsService(self.eda_result, self.df)
            self.eda_result.insights = insights_service.generate_insights()

            # Update metadata
            self.eda_result.computation_time = time.time() - start_time
            self.eda_result.status = EDAResult.Status.COMPLETED
            self.eda_result.cache_key = cache_key
            self.eda_result.save()

            logger.info(
                f'EDA completed for dataset {self.dataset.id} in '
                f'{self.eda_result.computation_time:.2f}s'
            )

            return self.eda_result

        except Exception as e:
            logger.error(f'EDA failed for dataset {self.dataset.id}: {str(e)}')
            self.eda_result.status = EDAResult.Status.ERROR
            self.eda_result.error_message = str(e)
            self.eda_result.save()
            raise EDAError(
                detail=f'EDA computation failed: {str(e)}',
                meta={'dataset_id': str(self.dataset.id)}
            )

    def _load_dataset(self) -> pd.DataFrame:
        """Load dataset, sampling if necessary."""
        file_path = self.dataset.file.path
        file_type = self.dataset.file_type.lower()

        if file_type == 'csv':
            df = pd.read_csv(file_path, low_memory=False)
        elif file_type in ['xlsx', 'xls']:
            df = pd.read_excel(file_path)
        else:
            raise EDAError(f'Unsupported file type: {file_type}')

        # Sample if too large
        max_rows = getattr(settings, 'MAX_ROWS_FULL_EDA', 50000)
        sample_size = getattr(settings, 'EDA_SAMPLE_SIZE', 10000)

        if len(df) > max_rows:
            df = df.sample(n=sample_size, random_state=42)
            self.eda_result.sampled = True
            self.eda_result.sample_size = sample_size
            logger.info(f'Sampled dataset to {sample_size} rows')

        return df

    def _compute_summary_stats(self) -> dict[str, dict]:
        """Compute summary statistics for each column."""
        stats = {}

        for col in self.df.columns:
            col_data = self.df[col]
            col_stats = {
                'count': int(col_data.count()),
                'null_count': int(col_data.isnull().sum()),
                'null_ratio': float(col_data.isnull().mean()),
                'unique_count': int(col_data.nunique()),
            }

            # Add numeric statistics if applicable
            if pd.api.types.is_numeric_dtype(col_data):
                numeric_stats = col_data.describe()
                col_stats.update({
                    'mean': self._safe_float(numeric_stats.get('mean')),
                    'std': self._safe_float(numeric_stats.get('std')),
                    'min': self._safe_float(numeric_stats.get('min')),
                    'max': self._safe_float(numeric_stats.get('max')),
                    '25%': self._safe_float(numeric_stats.get('25%')),
                    '50%': self._safe_float(numeric_stats.get('50%')),
                    '75%': self._safe_float(numeric_stats.get('75%')),
                    'skewness': self._safe_float(col_data.skew()),
                    'kurtosis': self._safe_float(col_data.kurtosis()),
                })
            else:
                # Categorical statistics
                mode_result = col_data.mode()
                col_stats['mode'] = str(mode_result.iloc[0]) if len(mode_result) > 0 else None

            stats[col] = col_stats

        return stats

    def _compute_distributions(self) -> dict[str, dict]:
        """Compute distribution data for each column."""
        distributions = {}

        for col in self.df.columns:
            col_data = self.df[col].dropna()

            if len(col_data) == 0:
                continue

            if pd.api.types.is_numeric_dtype(col_data):
                # Numeric: create histogram
                try:
                    counts, bin_edges = np.histogram(col_data, bins=self.HISTOGRAM_BINS)
                    distributions[col] = {
                        'type': 'numeric',
                        'bins': [float(b) for b in bin_edges],
                        'counts': [int(c) for c in counts],
                    }
                except Exception as e:
                    logger.warning(f'Failed to compute histogram for {col}: {e}')

            else:
                # Categorical: value counts
                value_counts = col_data.value_counts().head(self.MAX_CATEGORIES)
                distributions[col] = {
                    'type': 'categorical',
                    'labels': [str(label) for label in value_counts.index.tolist()],
                    'counts': [int(c) for c in value_counts.values.tolist()],
                    'other_count': int(len(col_data) - value_counts.sum()),
                }

        return distributions

    def _compute_correlations(self) -> dict[str, dict]:
        """Compute correlation matrix for numeric columns."""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()

        if len(numeric_cols) < 2:
            return {}

        try:
            corr_matrix = self.df[numeric_cols].corr()

            # Convert to nested dict, handling NaN values
            correlations = {}
            for col1 in corr_matrix.columns:
                correlations[col1] = {}
                for col2 in corr_matrix.columns:
                    val = corr_matrix.loc[col1, col2]
                    correlations[col1][col2] = self._safe_float(val)

            return correlations

        except Exception as e:
            logger.warning(f'Failed to compute correlations: {e}')
            return {}

    def _get_top_correlations(self) -> list[dict]:
        """Get list of top correlations (excluding self-correlations)."""
        corr_matrix = self.eda_result.correlation_matrix

        if not corr_matrix:
            return []

        correlations = []
        seen_pairs = set()

        for col1, col_corrs in corr_matrix.items():
            for col2, corr_val in col_corrs.items():
                if col1 == col2:
                    continue

                # Avoid duplicates (A-B and B-A)
                pair = tuple(sorted([col1, col2]))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)

                if corr_val is not None:
                    abs_corr = abs(corr_val)
                    if abs_corr >= 0.3:  # Only include meaningful correlations
                        strength = 'strong' if abs_corr >= 0.7 else 'moderate' if abs_corr >= 0.5 else 'weak'
                        correlations.append({
                            'column1': col1,
                            'column2': col2,
                            'correlation': round(corr_val, 4),
                            'strength': strength,
                        })

        # Sort by absolute correlation value
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)

        return correlations[:10]  # Top 10

    def _analyze_missing_values(self) -> dict[str, dict]:
        """Analyze missing values in the dataset."""
        missing = {}

        for col in self.df.columns:
            null_count = int(self.df[col].isnull().sum())
            total = len(self.df)

            if null_count > 0:
                missing[col] = {
                    'count': null_count,
                    'ratio': round(null_count / total, 4),
                    'percentage': round(100 * null_count / total, 2),
                }

        return missing

    def _detect_outliers(self) -> dict[str, dict]:
        """Detect outliers using IQR method for numeric columns."""
        outliers = {}

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            col_data = self.df[col].dropna()

            if len(col_data) == 0:
                continue

            Q1 = col_data.quantile(0.25)
            Q3 = col_data.quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            outlier_mask = (col_data < lower_bound) | (col_data > upper_bound)
            outlier_count = int(outlier_mask.sum())

            if outlier_count > 0:
                outliers[col] = {
                    'method': 'IQR',
                    'count': outlier_count,
                    'ratio': round(outlier_count / len(col_data), 4),
                    'lower_bound': self._safe_float(lower_bound),
                    'upper_bound': self._safe_float(upper_bound),
                }

        return outliers

    def _safe_float(self, value: Any) -> float | None:
        """Convert value to float, handling NaN and infinity."""
        if value is None:
            return None
        try:
            val = float(value)
            if np.isnan(val) or np.isinf(val):
                return None
            return round(val, 6)
        except (ValueError, TypeError):
            return None

    def _get_cached_result(self, cache_key: str) -> EDAResult | None:
        """
        Look for a cached EDA result with the given cache key.

        Args:
            cache_key: SHA256 hash of the dataset file

        Returns:
            Cached EDAResult if found and valid, None otherwise
        """
        try:
            # Look for completed EDA result with same cache key
            cached = EDAResult.objects.filter(
                cache_key=cache_key,
                status=EDAResult.Status.COMPLETED
            ).order_by('-created_at').first()

            return cached

        except Exception as e:
            logger.warning(f'Cache lookup failed: {e}')
            return None
