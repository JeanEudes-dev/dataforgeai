"""
Prediction Service.

Handles loading trained models and running predictions.
"""

import csv
import io
import logging
import tempfile
from typing import Any

import joblib
import pandas as pd
from django.core.files import File
from django.utils import timezone

from apps.core.exceptions import PredictionError, ValidationError
from apps.ml.models import TrainedModel
from apps.predictions.models import PredictionJob

logger = logging.getLogger(__name__)


class PredictionService:
    """
    Service for running predictions using trained models.

    Handles:
    - Model loading and caching
    - Input validation against model schema
    - Single and batch predictions
    - Output formatting
    """

    def __init__(self, trained_model: TrainedModel):
        self.model = trained_model
        self.pipeline = None
        self.model_data = None

    def load_model(self) -> None:
        """Load the trained model from file."""
        if not self.model.model_file:
            raise PredictionError(
                detail='Model file not found.',
                meta={'model_id': str(self.model.id)}
            )

        try:
            self.model_data = joblib.load(self.model.model_file.path)
            self.pipeline = self.model_data['pipeline']
        except Exception as e:
            logger.error(f'Failed to load model {self.model.id}: {str(e)}')
            raise PredictionError(
                detail='Failed to load model.',
                meta={'error': str(e)}
            )

    def validate_input(self, data: list[dict]) -> pd.DataFrame:
        """
        Validate input data against model's input schema.

        Args:
            data: List of dictionaries with input features

        Returns:
            Validated DataFrame

        Raises:
            ValidationError: If input doesn't match schema
        """
        if not data:
            raise ValidationError(
                detail='Input data cannot be empty.',
                code='EMPTY_INPUT'
            )

        # Convert to DataFrame
        try:
            df = pd.DataFrame(data)
        except Exception as e:
            raise ValidationError(
                detail='Invalid input data format.',
                meta={'error': str(e)}
            )

        # Get expected columns
        feature_columns = self.model.feature_columns
        input_schema = self.model.input_schema

        # Check for missing required columns
        missing_cols = set(feature_columns) - set(df.columns)
        if missing_cols:
            raise ValidationError(
                detail=f'Missing required columns: {", ".join(missing_cols)}',
                code='MISSING_COLUMNS',
                meta={'missing': list(missing_cols)}
            )

        # Select only the required columns in the correct order
        df = df[feature_columns]

        # Validate data types (basic check)
        for col in feature_columns:
            if col in input_schema:
                expected_dtype = input_schema[col].get('dtype')
                if expected_dtype == 'numeric':
                    # Try to convert to numeric
                    try:
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                    except Exception:
                        pass

        return df

    def predict(self, data: list[dict]) -> list[Any]:
        """
        Run predictions on input data.

        Args:
            data: List of dictionaries with input features

        Returns:
            List of predictions
        """
        if self.pipeline is None:
            self.load_model()

        # Validate input
        df = self.validate_input(data)

        # Run predictions
        try:
            predictions = self.pipeline.predict(df)
            return predictions.tolist()
        except Exception as e:
            logger.error(f'Prediction failed: {str(e)}')
            raise PredictionError(
                detail='Prediction failed.',
                meta={'error': str(e)}
            )

    def predict_with_probabilities(self, data: list[dict]) -> dict:
        """
        Run predictions with class probabilities (for classification).

        Args:
            data: List of dictionaries with input features

        Returns:
            Dictionary with predictions and probabilities
        """
        if self.pipeline is None:
            self.load_model()

        # Validate input
        df = self.validate_input(data)

        # Run predictions
        try:
            predictions = self.pipeline.predict(df)
            result = {
                'predictions': predictions.tolist(),
                'probabilities': None
            }

            # Get probabilities if available
            model = self.pipeline.named_steps.get('model')
            if hasattr(model, 'predict_proba'):
                probabilities = self.pipeline.predict_proba(df)
                # Get class labels
                classes = model.classes_.tolist()
                result['probabilities'] = [
                    {str(cls): float(prob) for cls, prob in zip(classes, row)}
                    for row in probabilities
                ]

            return result

        except Exception as e:
            logger.error(f'Prediction failed: {str(e)}')
            raise PredictionError(
                detail='Prediction failed.',
                meta={'error': str(e)}
            )

    def run_prediction_job(self, job: PredictionJob) -> PredictionJob:
        """
        Execute a prediction job.

        Args:
            job: PredictionJob instance

        Returns:
            Updated PredictionJob with results
        """
        try:
            job.status = PredictionJob.Status.RUNNING
            job.save()

            # Load model
            self.load_model()

            # Get input data
            if job.input_type == PredictionJob.InputType.JSON:
                input_data = job.input_data
            else:
                # Load from file
                input_data = self._load_input_file(job)

            job.input_row_count = len(input_data)
            job.save()

            # Run predictions
            predictions = self.predict(input_data)
            job.predictions = predictions

            # For batch jobs, also save to file
            if job.input_type == PredictionJob.InputType.FILE:
                output_file = self._save_output_file(input_data, predictions, job)
                job.output_file = output_file

            job.status = PredictionJob.Status.COMPLETED
            job.completed_at = timezone.now()
            job.save()

            logger.info(
                f'Prediction job {job.id} completed. '
                f'Processed {len(predictions)} rows.'
            )

            return job

        except Exception as e:
            logger.error(f'Prediction job {job.id} failed: {str(e)}')
            job.status = PredictionJob.Status.ERROR
            job.error_message = str(e)
            job.completed_at = timezone.now()
            job.save()
            raise

    def _load_input_file(self, job: PredictionJob) -> list[dict]:
        """Load input data from uploaded file."""
        if not job.input_file:
            raise PredictionError(detail='Input file not found.')

        file_path = job.input_file.path
        file_name = job.input_file.name.lower()

        try:
            if file_name.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                raise PredictionError(
                    detail='Unsupported file type. Use CSV or Excel.',
                    code='UNSUPPORTED_FILE_TYPE'
                )

            return df.to_dict(orient='records')

        except Exception as e:
            raise PredictionError(
                detail=f'Failed to read input file: {str(e)}',
                meta={'error': str(e)}
            )

    def _save_output_file(
        self,
        input_data: list[dict],
        predictions: list,
        job: PredictionJob
    ) -> str:
        """Save predictions to a CSV file."""
        try:
            # Create DataFrame with input and predictions
            df = pd.DataFrame(input_data)
            df['prediction'] = predictions

            # Write to temp file
            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix='.csv',
                prefix=f'predictions_{job.id}_'
            )
            df.to_csv(temp_file.name, index=False)
            temp_file.close()

            # Save to model
            with open(temp_file.name, 'rb') as f:
                job.output_file.save(f'predictions_{job.id}.csv', File(f))

            return job.output_file.name

        except Exception as e:
            logger.error(f'Failed to save output file: {str(e)}')
            raise
