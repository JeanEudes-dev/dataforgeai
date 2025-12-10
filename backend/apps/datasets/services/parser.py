"""
Dataset parsing service.

Handles parsing of CSV and XLSX files, schema inference,
and extraction of column metadata.
"""

import logging
import re
from typing import Any

import numpy as np
import pandas as pd

from apps.core.exceptions import FileParsingError
from apps.datasets.models import Dataset, DatasetColumn

logger = logging.getLogger(__name__)


class DatasetParserService:
    """
    Service for parsing uploaded dataset files.

    Responsibilities:
    - Parse CSV/XLSX files into pandas DataFrames
    - Infer column data types
    - Extract column statistics and metadata
    - Create DatasetColumn records
    """

    # Maximum rows to read for initial parsing (for very large files)
    MAX_PREVIEW_ROWS = 10000

    # Sample size for value sampling
    SAMPLE_SIZE = 5

    # Common string representations of null/missing values
    STRING_NULL_PATTERNS = {
        'n/a', 'na', 'null', 'none', '-', '', 'nan', 'missing',
        'unknown', 'undefined', 'nil', '#n/a', '#na', 'not available',
        '.', '?', 'n.a.', 'n.a', '--', '---'
    }

    # Common ordinal patterns (lowercase keys mapped to ordered values)
    ORDINAL_PATTERNS = {
        # Education levels
        'education': ['high school', 'associate', 'bachelor', 'master', 'phd', 'doctorate'],
        'degree': ['high school', 'associate', 'bachelor', 'master', 'phd', 'doctorate'],
        # Satisfaction/Quality scales
        'satisfaction': ['very poor', 'poor', 'fair', 'good', 'very good', 'excellent'],
        'quality': ['very poor', 'poor', 'fair', 'good', 'very good', 'excellent'],
        'rating': ['very poor', 'poor', 'fair', 'good', 'very good', 'excellent'],
        # Size categories
        'size': ['xs', 'extra small', 'small', 'medium', 'large', 'xl', 'extra large', 'xxl'],
        'company_size': ['small', 'medium', 'large', 'enterprise'],
        # Priority/Importance
        'priority': ['low', 'medium', 'high', 'critical', 'urgent'],
        'importance': ['low', 'medium', 'high', 'very high'],
        # Frequency
        'frequency': ['never', 'rarely', 'sometimes', 'often', 'always'],
        # Agreement scales
        'agreement': ['strongly disagree', 'disagree', 'neutral', 'agree', 'strongly agree'],
        # Experience levels
        'experience': ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'],
        'level': ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'],
        # Income brackets
        'income': ['low', 'lower middle', 'middle', 'upper middle', 'high'],
    }

    def __init__(self, dataset: Dataset):
        self.dataset = dataset
        self.df: pd.DataFrame | None = None

    def parse(self) -> pd.DataFrame:
        """
        Parse the dataset file and extract metadata.

        Returns:
            The parsed DataFrame

        Raises:
            FileParsingError: If parsing fails
        """
        try:
            # Read the file
            self.df = self._read_file()

            # Update dataset statistics
            self._update_dataset_stats()

            # Create column metadata
            self._create_column_metadata()

            # Update dataset status
            self.dataset.status = Dataset.Status.READY
            self.dataset.save()

            logger.info(
                f'Successfully parsed dataset {self.dataset.id}: '
                f'{self.dataset.row_count} rows, {self.dataset.column_count} columns'
            )

            return self.df

        except Exception as e:
            logger.error(f'Failed to parse dataset {self.dataset.id}: {str(e)}')
            self.dataset.status = Dataset.Status.ERROR
            self.dataset.error_message = str(e)
            self.dataset.save()
            raise FileParsingError(
                detail=f'Failed to parse file: {str(e)}',
                meta={'filename': self.dataset.original_filename}
            )

    def _read_file(self) -> pd.DataFrame:
        """Read the dataset file into a DataFrame."""
        file_path = self.dataset.file.path
        file_type = self.dataset.file_type.lower()

        try:
            if file_type == 'csv':
                # Try different encodings
                for encoding in ['utf-8', 'latin-1', 'cp1252']:
                    try:
                        df = pd.read_csv(
                            file_path,
                            encoding=encoding,
                            low_memory=False
                        )
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    raise FileParsingError(
                        detail='Could not decode CSV file. Please ensure it uses UTF-8 encoding.'
                    )

            elif file_type in ['xlsx', 'xls']:
                df = pd.read_excel(file_path, engine='openpyxl')

            else:
                raise FileParsingError(
                    detail=f'Unsupported file type: {file_type}'
                )

            # Clean column names
            df.columns = self._clean_column_names(df.columns)

            return df

        except FileParsingError:
            raise
        except Exception as e:
            raise FileParsingError(
                detail=f'Error reading file: {str(e)}'
            )

    def _clean_column_names(self, columns: pd.Index) -> list[str]:
        """Clean and normalize column names."""
        cleaned = []
        seen = set()

        for i, col in enumerate(columns):
            # Convert to string
            name = str(col).strip()

            # Replace problematic characters
            name = re.sub(r'[^\w\s-]', '_', name)
            name = re.sub(r'\s+', '_', name)

            # Handle empty names
            if not name or name == '_':
                name = f'column_{i}'

            # Handle duplicates
            original_name = name
            counter = 1
            while name.lower() in seen:
                name = f'{original_name}_{counter}'
                counter += 1

            seen.add(name.lower())
            cleaned.append(name)

        return cleaned

    def _update_dataset_stats(self) -> None:
        """Update dataset with row/column counts and schema."""
        self.dataset.row_count = len(self.df)
        self.dataset.column_count = len(self.df.columns)

        # Build schema summary
        schema = {}
        for col in self.df.columns:
            col_data = self.df[col]
            schema[col] = {
                'dtype': self._infer_dtype(col_data, column_name=col),
                'nullable': bool(col_data.isnull().any()),
                'unique_count': int(col_data.nunique()),
                'null_ratio': float(col_data.isnull().mean()),
            }

        self.dataset.schema = schema
        self.dataset.save()

    def _create_column_metadata(self) -> None:
        """Create DatasetColumn records for each column."""
        # Delete existing columns
        self.dataset.columns.all().delete()

        columns_to_create = []

        for position, col_name in enumerate(self.df.columns):
            col_data = self.df[col_name]
            dtype = self._infer_dtype(col_data, column_name=col_name)

            column = DatasetColumn(
                dataset=self.dataset,
                name=col_name,
                original_name=col_name,
                position=position,
                dtype=dtype,
                pandas_dtype=str(col_data.dtype),
                nullable=bool(col_data.isnull().any()),
                null_count=int(col_data.isnull().sum()),
                null_ratio=float(col_data.isnull().mean()),
                unique_count=int(col_data.nunique()),
                sample_values=self._get_sample_values(col_data),
            )

            # Add numeric statistics if applicable
            if dtype == DatasetColumn.DataType.NUMERIC:
                numeric_data = pd.to_numeric(col_data, errors='coerce')
                column.min_value = float(numeric_data.min()) if not pd.isna(numeric_data.min()) else None
                column.max_value = float(numeric_data.max()) if not pd.isna(numeric_data.max()) else None
                column.mean_value = float(numeric_data.mean()) if not pd.isna(numeric_data.mean()) else None

            columns_to_create.append(column)

        DatasetColumn.objects.bulk_create(columns_to_create)

    def _convert_string_nulls(self, series: pd.Series) -> pd.Series:
        """
        Convert common string representations of null values to actual NaN.

        Args:
            series: The pandas Series to process

        Returns:
            Series with string nulls converted to pd.NA
        """
        if series.dtype != object:
            return series

        # Create a copy to avoid modifying the original
        result = series.copy()

        # Convert string null patterns to NaN
        mask = result.astype(str).str.lower().str.strip().isin(self.STRING_NULL_PATTERNS)
        result = result.where(~mask, pd.NA)

        return result

    def _is_ordinal_column(self, series: pd.Series, column_name: str) -> bool:
        """
        Check if a column appears to be ordinal based on name patterns and values.

        Args:
            series: The pandas Series to check
            column_name: The name of the column

        Returns:
            True if the column appears to be ordinal
        """
        if series.dtype != object:
            return False

        col_name_lower = column_name.lower().replace('_', ' ').replace('-', ' ')

        # Check if column name matches any ordinal pattern
        for pattern_key, ordered_values in self.ORDINAL_PATTERNS.items():
            if pattern_key in col_name_lower:
                # Check if values match the pattern
                unique_values = set(series.dropna().astype(str).str.lower().str.strip())
                ordered_set = set(ordered_values)

                # If at least 50% of unique values match the ordinal pattern
                matches = unique_values & ordered_set
                if len(matches) >= len(unique_values) * 0.5 and len(unique_values) <= 10:
                    return True

        return False

    def _infer_dtype(self, series: pd.Series, column_name: str = '') -> str:
        """Infer the semantic data type of a column."""
        pandas_dtype = series.dtype

        # First, convert string nulls for better analysis
        clean_series = self._convert_string_nulls(series)

        # Check for boolean
        if pandas_dtype == bool or clean_series.dropna().isin([True, False, 0, 1]).all():
            unique_vals = clean_series.dropna().unique()
            if len(unique_vals) <= 2 and set(unique_vals).issubset({True, False, 0, 1, 'True', 'False', 'true', 'false'}):
                return DatasetColumn.DataType.BOOLEAN

        # Check for numeric
        if pd.api.types.is_numeric_dtype(pandas_dtype):
            return DatasetColumn.DataType.NUMERIC

        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(pandas_dtype):
            return DatasetColumn.DataType.DATETIME

        # Try to parse as datetime
        if clean_series.dtype == object:
            try:
                sample = clean_series.dropna().head(100)
                if len(sample) > 0:
                    pd.to_datetime(sample, errors='raise')
                    return DatasetColumn.DataType.DATETIME
            except (ValueError, TypeError):
                pass

        # Check for ordinal (must be before categorical check)
        if clean_series.dtype == object and column_name:
            if self._is_ordinal_column(clean_series, column_name):
                return DatasetColumn.DataType.ORDINAL

        # Check for categorical (low cardinality)
        if clean_series.dtype == object:
            unique_ratio = clean_series.nunique() / len(clean_series) if len(clean_series) > 0 else 0
            if unique_ratio < 0.5 and clean_series.nunique() <= 100:
                return DatasetColumn.DataType.CATEGORICAL

        # Default to text
        return DatasetColumn.DataType.TEXT

    def _get_sample_values(self, series: pd.Series) -> list[Any]:
        """Get sample non-null values from a column."""
        non_null = series.dropna().head(self.SAMPLE_SIZE)

        samples = []
        for val in non_null:
            # Convert numpy types to Python types for JSON serialization
            if isinstance(val, (np.integer, np.floating)):
                samples.append(float(val) if isinstance(val, np.floating) else int(val))
            elif isinstance(val, np.bool_):
                samples.append(bool(val))
            elif pd.isna(val):
                continue
            else:
                samples.append(str(val))

        return samples

    def get_preview(self, num_rows: int = 10) -> dict:
        """
        Get a preview of the dataset.

        Returns:
            Dictionary with columns and rows for preview
        """
        if self.df is None:
            self.df = self._read_file()

        preview_df = self.df.head(num_rows)

        # Convert to serializable format
        rows = []
        for _, row in preview_df.iterrows():
            row_data = {}
            for col in preview_df.columns:
                val = row[col]
                if pd.isna(val):
                    row_data[col] = None
                elif isinstance(val, (np.integer, np.floating)):
                    row_data[col] = float(val) if isinstance(val, np.floating) else int(val)
                elif isinstance(val, np.bool_):
                    row_data[col] = bool(val)
                else:
                    row_data[col] = str(val)
            rows.append(row_data)

        return {
            'columns': list(preview_df.columns),
            'rows': rows,
            'total_rows': len(self.df),
        }
