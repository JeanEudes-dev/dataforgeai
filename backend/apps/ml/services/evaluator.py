"""
Model Evaluator Service.

Handles model evaluation and metrics computation.
"""

import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

from apps.ml.models import TrainingJob

logger = logging.getLogger(__name__)


class ModelEvaluatorService:
    """
    Service for evaluating ML models.

    Computes appropriate metrics based on task type.
    """

    def evaluate(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        task_type: str,
        pipeline=None,
        X_test: pd.DataFrame = None
    ) -> dict[str, Any]:
        """
        Evaluate model predictions.

        Args:
            y_true: True target values
            y_pred: Predicted values
            task_type: 'classification' or 'regression'
            pipeline: Trained pipeline (for probability predictions)
            X_test: Test features (required for ROC curve computation)

        Returns:
            Dictionary of metrics
        """
        if task_type == TrainingJob.TaskType.CLASSIFICATION:
            return self._evaluate_classification(y_true, y_pred, pipeline, X_test)
        else:
            return self._evaluate_regression(y_true, y_pred)

    def _evaluate_classification(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        pipeline=None,
        X_test: pd.DataFrame = None
    ) -> dict[str, Any]:
        """Compute classification metrics."""
        metrics = {}

        try:
            # Basic metrics
            metrics['accuracy'] = float(accuracy_score(y_true, y_pred))

            # Determine averaging strategy based on number of classes
            unique_classes = np.unique(y_true)
            is_binary = len(unique_classes) == 2

            if is_binary:
                average = 'binary'
                pos_label = unique_classes[1]  # Assume second class is positive
            else:
                average = 'weighted'
                pos_label = None

            # Precision, Recall, F1
            metrics['precision'] = float(precision_score(
                y_true, y_pred, average=average, pos_label=pos_label, zero_division=0
            ))
            metrics['recall'] = float(recall_score(
                y_true, y_pred, average=average, pos_label=pos_label, zero_division=0
            ))
            metrics['f1'] = float(f1_score(
                y_true, y_pred, average=average, pos_label=pos_label, zero_division=0
            ))

            # Weighted F1 for multi-class
            metrics['f1_weighted'] = float(f1_score(
                y_true, y_pred, average='weighted', zero_division=0
            ))

            # Confusion matrix with labels
            cm = confusion_matrix(y_true, y_pred)
            metrics['confusion_matrix'] = cm.tolist()
            metrics['confusion_matrix_labels'] = [str(c) for c in unique_classes]

            # ROC-AUC and ROC curve for binary classification
            if is_binary and pipeline is not None and X_test is not None:
                try:
                    model = pipeline.named_steps.get('model')
                    if hasattr(model, 'predict_proba'):
                        # Get probability predictions using X_test
                        y_proba = pipeline.predict_proba(X_test)
                        if y_proba.shape[1] == 2:
                            # Get probabilities for positive class
                            y_proba_positive = y_proba[:, 1]

                            # Compute ROC-AUC score
                            metrics['roc_auc'] = float(roc_auc_score(y_true, y_proba_positive))

                            # Compute full ROC curve data for visualization
                            fpr, tpr, thresholds = roc_curve(y_true, y_proba_positive)

                            # Limit data points if too many (for frontend performance)
                            max_points = 200
                            if len(fpr) > max_points:
                                # Sample evenly spaced indices
                                indices = np.linspace(0, len(fpr) - 1, max_points, dtype=int)
                                fpr = fpr[indices]
                                tpr = tpr[indices]
                                thresholds = thresholds[indices]

                            # Filter out infinite thresholds and convert to list
                            metrics['roc_curve'] = {
                                'fpr': [float(x) for x in fpr],
                                'tpr': [float(x) for x in tpr],
                                'thresholds': [
                                    float(x) if not np.isinf(x) else None
                                    for x in thresholds
                                ]
                            }
                except Exception as e:
                    logger.warning(f'Failed to compute ROC-AUC: {e}')

        except Exception as e:
            logger.error(f'Error computing classification metrics: {e}')
            metrics['error'] = str(e)

        return metrics

    def _evaluate_regression(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> dict[str, Any]:
        """Compute regression metrics."""
        metrics = {}

        try:
            # MSE and RMSE
            mse = mean_squared_error(y_true, y_pred)
            metrics['mse'] = float(mse)
            metrics['rmse'] = float(np.sqrt(mse))

            # MAE
            metrics['mae'] = float(mean_absolute_error(y_true, y_pred))

            # R-squared
            metrics['r2'] = float(r2_score(y_true, y_pred))

            # Mean Absolute Percentage Error (if no zeros)
            if not np.any(y_true == 0):
                mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
                metrics['mape'] = float(mape)

        except Exception as e:
            logger.error(f'Error computing regression metrics: {e}')
            metrics['error'] = str(e)

        return metrics

    def compare_models(
        self,
        models: list[dict],
        task_type: str
    ) -> list[dict]:
        """
        Compare multiple models and rank them.

        Args:
            models: List of model dicts with 'name' and 'metrics'
            task_type: 'classification' or 'regression'

        Returns:
            Sorted list of models with rankings
        """
        if task_type == TrainingJob.TaskType.CLASSIFICATION:
            # Sort by F1 (descending)
            key_metric = 'f1_weighted'
            reverse = True
        else:
            # Sort by RMSE (ascending)
            key_metric = 'rmse'
            reverse = False

        sorted_models = sorted(
            models,
            key=lambda m: m['metrics'].get(key_metric, float('inf') if not reverse else 0),
            reverse=reverse
        )

        # Add rankings
        for i, model in enumerate(sorted_models):
            model['rank'] = i + 1
            model['is_best'] = (i == 0)

        return sorted_models
