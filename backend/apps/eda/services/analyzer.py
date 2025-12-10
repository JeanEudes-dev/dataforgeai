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
from scipy import stats

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

            # Enhanced analysis: cross-type associations
            self.eda_result.associations = self._compute_associations()

            # Enhanced analysis: datetime columns
            self.eda_result.datetime_analysis = self._analyze_datetime_columns()

            # Enhanced analysis: text columns
            self.eda_result.text_analysis = self._analyze_text_columns()

            # Compute data quality score
            self.eda_result.data_quality_score = self._compute_data_quality_score()

            # Generate rule-based insights
            from .insights import EDAInsightsService
            insights_service = EDAInsightsService(self.eda_result, self.df)
            self.eda_result.insights = insights_service.generate_insights()

            # Generate AI insights using Gemini
            self._generate_ai_insights()

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
                # Enhanced categorical statistics
                col_stats.update(self._compute_categorical_stats(col_data))

            stats[col] = col_stats

        return stats

    def _compute_categorical_stats(self, col_data: pd.Series) -> dict:
        """
        Compute enhanced statistics for categorical columns.

        Returns:
            Dictionary with categorical statistics including entropy,
            dominance, cardinality ratio, etc.
        """
        value_counts = col_data.value_counts()
        total_non_null = col_data.count()

        # Mode and frequency
        mode_result = col_data.mode()
        mode_value = str(mode_result.iloc[0]) if len(mode_result) > 0 else None
        mode_frequency = int(value_counts.iloc[0]) if len(value_counts) > 0 else 0
        mode_ratio = mode_frequency / total_non_null if total_non_null > 0 else 0

        # Entropy (measure of randomness/diversity)
        if total_non_null > 0 and len(value_counts) > 0:
            probabilities = value_counts / total_non_null
            entropy = float(-np.sum(probabilities * np.log2(probabilities + 1e-10)))
            max_entropy = np.log2(col_data.nunique()) if col_data.nunique() > 1 else 1
            normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
        else:
            entropy = 0
            normalized_entropy = 0

        # Cardinality metrics
        cardinality_ratio = col_data.nunique() / len(col_data) if len(col_data) > 0 else 0

        # Top categories (useful for understanding distribution)
        top_categories = []
        for label, count in value_counts.head(5).items():
            top_categories.append({
                'value': str(label),
                'count': int(count),
                'percentage': round(100 * count / total_non_null, 2) if total_non_null > 0 else 0
            })

        return {
            'mode': mode_value,
            'mode_frequency': mode_frequency,
            'mode_ratio': round(mode_ratio, 4),
            'entropy': round(entropy, 4),
            'normalized_entropy': round(normalized_entropy, 4),
            'cardinality_ratio': round(cardinality_ratio, 4),
            'dominance': round(mode_ratio, 4),
            'is_binary': bool(col_data.nunique() == 2),
            'top_categories': top_categories,
        }

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

    def _compute_associations(self) -> dict:
        """
        Compute associations between all column types.

        Returns:
            Dictionary with categorical-categorical, categorical-numeric,
            and numeric-numeric associations.
        """
        associations = {
            'categorical_categorical': {},
            'categorical_numeric': {},
        }

        # Get all non-numeric columns (object, category, string, etc.)
        # This ensures we capture all text-based columns including ordinal
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = [col for col in self.df.columns if col not in numeric_cols]

        # Limit to first 20 categorical columns for performance
        categorical_cols = categorical_cols[:20]

        logger.debug(f"Computing associations - categorical: {categorical_cols}, numeric: {numeric_cols}")

        # Categorical-Categorical: Cramers V
        for i, col1 in enumerate(categorical_cols):
            for col2 in categorical_cols[i+1:]:
                try:
                    cramers_v = self._cramers_v(self.df[col1], self.df[col2])
                    if cramers_v is not None and cramers_v >= 0.1:
                        associations['categorical_categorical'][f"{col1}|{col2}"] = {
                            'cramers_v': round(cramers_v, 4),
                            'strength': 'strong' if cramers_v >= 0.5 else 'moderate' if cramers_v >= 0.3 else 'weak'
                        }
                except Exception as e:
                    logger.debug(f"Failed to compute Cramer's V for {col1}, {col2}: {e}")

        # Categorical-Numeric: Point-biserial or ANOVA F
        for cat_col in categorical_cols:
            for num_col in numeric_cols:
                try:
                    association = self._categorical_numeric_association(
                        self.df[cat_col], self.df[num_col]
                    )
                    if association is not None:
                        associations['categorical_numeric'][f"{cat_col}|{num_col}"] = association
                except Exception as e:
                    logger.debug(f"Failed to compute association for {cat_col}, {num_col}: {e}")

        return associations

    def _cramers_v(self, x: pd.Series, y: pd.Series) -> float | None:
        """
        Compute Cramer's V statistic for two categorical variables.

        Cramer's V measures the association between two categorical variables,
        ranging from 0 (no association) to 1 (perfect association).
        """
        try:
            # Remove rows with missing values in either column
            mask = x.notna() & y.notna()
            x_clean = x[mask]
            y_clean = y[mask]

            if len(x_clean) < 10:  # Need sufficient data
                return None

            contingency = pd.crosstab(x_clean, y_clean)

            if contingency.shape[0] < 2 or contingency.shape[1] < 2:
                return None

            chi2, _, _, _ = stats.chi2_contingency(contingency)
            n = contingency.sum().sum()
            min_dim = min(contingency.shape) - 1

            if min_dim <= 0 or n <= 0:
                return None

            cramers_v = np.sqrt(chi2 / (n * min_dim))
            return float(cramers_v)

        except Exception:
            return None

    def _categorical_numeric_association(
        self, cat_series: pd.Series, num_series: pd.Series
    ) -> dict | None:
        """
        Compute association between categorical and numeric variable.

        For binary categorical: uses point-biserial correlation
        For multi-category: uses ANOVA F-statistic with eta-squared effect size
        """
        try:
            # Remove nulls
            mask = cat_series.notna() & num_series.notna()
            cat_clean = cat_series[mask]
            num_clean = num_series[mask]

            if len(cat_clean) < 10:  # Need sufficient data
                return None

            n_categories = cat_clean.nunique()

            if n_categories < 2:
                return None

            if n_categories == 2:
                # Point-biserial correlation for binary categorical
                cat_encoded = pd.factorize(cat_clean)[0]
                corr, p_value = stats.pointbiserialr(cat_encoded, num_clean)

                if abs(corr) < 0.1:  # Skip weak associations
                    return None

                return {
                    'method': 'point_biserial',
                    'correlation': round(float(corr), 4),
                    'p_value': round(float(p_value), 6),
                    'significant': bool(p_value < 0.05),
                    'strength': 'strong' if abs(corr) >= 0.5 else 'moderate' if abs(corr) >= 0.3 else 'weak'
                }

            elif 2 < n_categories <= 20:
                # ANOVA F-statistic for multi-category
                groups = [num_clean[cat_clean == cat].values for cat in cat_clean.unique()]
                groups = [g for g in groups if len(g) >= 2]

                if len(groups) < 2:
                    return None

                f_stat, p_value = stats.f_oneway(*groups)

                # Compute eta-squared (effect size)
                grand_mean = num_clean.mean()
                ss_between = sum(len(g) * (g.mean() - grand_mean)**2 for g in groups)
                ss_total = sum((num_clean - grand_mean)**2)
                eta_squared = ss_between / ss_total if ss_total > 0 else 0

                if eta_squared < 0.01:  # Skip negligible effects
                    return None

                return {
                    'method': 'anova',
                    'f_statistic': round(float(f_stat), 4),
                    'p_value': round(float(p_value), 6),
                    'eta_squared': round(float(eta_squared), 4),
                    'significant': bool(p_value < 0.05),
                    'strength': 'strong' if eta_squared >= 0.14 else 'moderate' if eta_squared >= 0.06 else 'weak'
                }

        except Exception:
            pass

        return None

    def _analyze_datetime_columns(self) -> dict:
        """
        Analyze datetime columns for temporal patterns.

        Returns:
            Dictionary with datetime analysis per column.
        """
        datetime_analysis = {}

        # Get explicit datetime columns
        datetime_cols = self.df.select_dtypes(include=['datetime64']).columns.tolist()

        # Also check object columns that might be dates
        for col in self.df.select_dtypes(include=['object']).columns:
            try:
                sample = self.df[col].dropna().head(100)
                if len(sample) > 0:
                    pd.to_datetime(sample, errors='raise')
                    datetime_cols.append(col)
            except Exception:
                pass

        for col in datetime_cols:
            try:
                dt_series = pd.to_datetime(self.df[col], errors='coerce')
                valid = dt_series.dropna()

                if len(valid) == 0:
                    continue

                # Basic date range info
                analysis = {
                    'min_date': str(valid.min()),
                    'max_date': str(valid.max()),
                    'date_range_days': int((valid.max() - valid.min()).days),
                }

                # Weekday distribution (0=Monday, 6=Sunday)
                weekday_counts = valid.dt.dayofweek.value_counts().sort_index()
                analysis['weekday_distribution'] = {
                    int(k): int(v) for k, v in weekday_counts.items()
                }

                # Month distribution
                month_counts = valid.dt.month.value_counts().sort_index()
                analysis['month_distribution'] = {
                    int(k): int(v) for k, v in month_counts.items()
                }

                # Check if time component is present
                has_time = bool(valid.dt.hour.any()) or bool(valid.dt.minute.any())
                analysis['has_time_component'] = has_time

                if has_time:
                    hour_counts = valid.dt.hour.value_counts().sort_index()
                    analysis['hour_distribution'] = {
                        int(k): int(v) for k, v in hour_counts.items()
                    }

                datetime_analysis[col] = analysis

            except Exception as e:
                logger.debug(f"Failed to analyze datetime column {col}: {e}")

        return datetime_analysis

    def _analyze_text_columns(self) -> dict:
        """
        Analyze text columns (high cardinality strings) for patterns.

        Returns:
            Dictionary with text analysis per column.
        """
        text_analysis = {}

        for col in self.df.columns:
            col_data = self.df[col]

            if col_data.dtype != object:
                continue

            # Check if it's a text column (high cardinality)
            unique_ratio = col_data.nunique() / len(col_data) if len(col_data) > 0 else 0

            # Only analyze columns that look like text (high cardinality or long values)
            if unique_ratio >= 0.5 or col_data.nunique() > 100:
                text_series = col_data.dropna().astype(str)

                if len(text_series) == 0:
                    continue

                lengths = text_series.str.len()
                word_counts = text_series.str.split().str.len()

                text_analysis[col] = {
                    'avg_length': round(float(lengths.mean()), 2),
                    'max_length': int(lengths.max()),
                    'min_length': int(lengths.min()),
                    'avg_word_count': round(float(word_counts.mean()), 2),
                    'max_word_count': int(word_counts.max()),
                    'contains_numbers': bool(text_series.str.contains(r'\d', regex=True).any()),
                    'contains_special_chars': bool(text_series.str.contains(r'[!@#$%^&*(),.?":{}|<>]', regex=True).any()),
                    'unique_ratio': round(float(unique_ratio), 4),
                }

        return text_analysis

    def _compute_data_quality_score(self) -> float:
        """
        Compute an overall data quality score (0-100).

        Considers missing values, constant columns, outliers, and data type consistency.
        """
        score = 100.0
        total_cols = len(self.df.columns)

        if total_cols == 0:
            return 0.0

        # Deduct for missing values (up to 30 points)
        missing_analysis = self.eda_result.missing_analysis
        if missing_analysis:
            avg_missing = np.mean([v['ratio'] for v in missing_analysis.values()])
            cols_with_missing = len(missing_analysis)
            missing_penalty = min(30, (avg_missing * 50) + (cols_with_missing / total_cols * 10))
            score -= missing_penalty

        # Deduct for constant columns (2 points each, up to 10)
        summary_stats = self.eda_result.summary_stats
        constant_cols = sum(1 for s in summary_stats.values() if s.get('unique_count') == 1)
        score -= min(10, constant_cols * 2)

        # Deduct for very high cardinality categorical columns (3 points each, up to 15)
        high_cardinality = sum(
            1 for s in summary_stats.values()
            if s.get('cardinality_ratio', 0) > 0.8 and s.get('mode') is not None
        )
        score -= min(15, high_cardinality * 3)

        # Deduct for columns with many outliers (up to 10 points)
        outlier_analysis = self.eda_result.outlier_analysis
        if outlier_analysis:
            high_outlier_cols = sum(1 for o in outlier_analysis.values() if o.get('ratio', 0) > 0.1)
            score -= min(10, high_outlier_cols * 2)

        return max(0.0, min(100.0, round(score, 1)))

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

    def _generate_ai_insights(self) -> None:
        """Generate AI-powered insights using Gemini."""
        try:
            from apps.assistant.services import GeminiService

            gemini = GeminiService()
            if not gemini.is_available:
                logger.info('Gemini not available, skipping AI insights')
                return

            eda_data = {
                'summary_stats': self.eda_result.summary_stats,
                'missing_analysis': self.eda_result.missing_analysis,
                'correlation_matrix': self.eda_result.correlation_matrix,
                'outlier_analysis': self.eda_result.outlier_analysis,
                'insights': self.eda_result.insights,
            }

            ai_insights = gemini.generate_eda_insights(eda_data)
            self.eda_result.ai_insights = ai_insights
            logger.info(f'Generated AI insights for dataset {self.dataset.id}')

        except Exception as e:
            logger.warning(f'Failed to generate AI insights: {e}')
            # Don't fail the whole EDA if AI insights fail
            self.eda_result.ai_insights = ''

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
