"""
SHAP Explainer Service.

Computes SHAP values for model explainability.
"""

import logging
from typing import Any

import numpy as np
import pandas as pd
import shap

from apps.core.exceptions import TrainingError

logger = logging.getLogger(__name__)


class SHAPExplainerService:
    """
    Service for computing SHAP explanations.

    Selects appropriate explainer based on model type:
    - TreeExplainer: Random Forest, Gradient Boosting
    - LinearExplainer: Logistic/Linear Regression
    - KernelExplainer: SVM and other models (fallback, slower)
    """

    # Maximum samples for SHAP computation (for performance)
    MAX_BACKGROUND_SAMPLES = 100
    MAX_EXPLAIN_SAMPLES = 200

    # Model types that support specific explainers
    TREE_MODELS = ['random_forest', 'gradient_boosting']
    LINEAR_MODELS = ['logistic_regression', 'linear_regression']

    def __init__(self, pipeline, algorithm_type: str, feature_columns: list):
        """
        Initialize the explainer.

        Args:
            pipeline: Trained sklearn pipeline with preprocessor and model
            algorithm_type: Type of algorithm (e.g., 'random_forest', 'svm')
            feature_columns: List of original feature column names
        """
        self.pipeline = pipeline
        self.algorithm_type = algorithm_type
        self.feature_columns = feature_columns
        self.preprocessor = pipeline.named_steps['preprocessor']
        self.model = pipeline.named_steps['model']

    def compute_shap_values(
        self,
        X_data: pd.DataFrame,
    ) -> dict[str, Any]:
        """
        Compute SHAP values for the model.

        Args:
            X_data: Data to use for background and explanation

        Returns:
            Dictionary with SHAP summary data
        """
        try:
            # Sample if too large
            if len(X_data) > self.MAX_BACKGROUND_SAMPLES:
                X_background = X_data.sample(
                    n=self.MAX_BACKGROUND_SAMPLES,
                    random_state=42
                )
            else:
                X_background = X_data

            if len(X_data) > self.MAX_EXPLAIN_SAMPLES:
                X_explain = X_data.sample(
                    n=self.MAX_EXPLAIN_SAMPLES,
                    random_state=42
                )
            else:
                X_explain = X_data

            # Transform data through preprocessor
            X_background_transformed = self.preprocessor.transform(X_background)
            X_explain_transformed = self.preprocessor.transform(X_explain)

            # Get feature names after preprocessing
            try:
                feature_names = self.preprocessor.get_feature_names_out().tolist()
            except Exception:
                feature_names = [f'feature_{i}' for i in range(X_background_transformed.shape[1])]

            # Select explainer based on model type
            shap_values = self._compute_with_appropriate_explainer(
                X_background_transformed,
                X_explain_transformed
            )

            # Process SHAP values into summary
            return self._process_shap_values(
                shap_values,
                feature_names,
            )

        except Exception as e:
            logger.warning(f'SHAP computation failed: {e}')
            # Return empty dict on failure - SHAP is optional
            return {}

    def _compute_with_appropriate_explainer(
        self,
        X_background: np.ndarray,
        X_explain: np.ndarray
    ) -> np.ndarray:
        """Select and use the appropriate SHAP explainer."""

        if self.algorithm_type in self.TREE_MODELS:
            logger.info(f'Using TreeExplainer for {self.algorithm_type}')
            explainer = shap.TreeExplainer(self.model)
            explanation = explainer(X_explain)
            # Get the SHAP values from the Explanation object
            shap_values = explanation.values

        elif self.algorithm_type in self.LINEAR_MODELS:
            logger.info(f'Using LinearExplainer for {self.algorithm_type}')
            explainer = shap.LinearExplainer(
                self.model,
                X_background
            )
            shap_values = explainer.shap_values(X_explain)

        else:
            # Fallback to KernelExplainer (works for any model but slower)
            logger.info(f'Using KernelExplainer for {self.algorithm_type} (slower)')

            # Use smaller samples for KernelExplainer (very slow)
            if len(X_background) > 50:
                X_background = X_background[:50]
            if len(X_explain) > 50:
                X_explain = X_explain[:50]

            def model_predict(X):
                return self.model.predict(X)

            explainer = shap.KernelExplainer(model_predict, X_background)
            shap_values = explainer.shap_values(X_explain, nsamples=100)

        return shap_values

    def _process_shap_values(
        self,
        shap_values: np.ndarray | list,
        feature_names: list,
    ) -> dict[str, Any]:
        """Process SHAP values into summary statistics."""

        # Convert to numpy array if list
        if isinstance(shap_values, list):
            shap_values = np.array(shap_values)

        # Handle 3D arrays (multi-class: samples x features x classes)
        if len(shap_values.shape) == 3:
            # Average absolute values across classes
            shap_values = np.abs(shap_values).mean(axis=2)

        # Ensure 2D array (samples x features)
        if len(shap_values.shape) == 1:
            shap_values = shap_values.reshape(1, -1)

        num_samples = shap_values.shape[0]

        # Compute mean absolute SHAP value per feature
        mean_abs_shap = np.abs(shap_values).mean(axis=0)

        # Flatten if needed (in case of nested arrays)
        if hasattr(mean_abs_shap, 'flatten'):
            mean_abs_shap = mean_abs_shap.flatten()

        # Create feature importance from SHAP
        shap_importance = {}
        for i, name in enumerate(feature_names):
            if i < len(mean_abs_shap):
                val = mean_abs_shap[i]
                # Handle numpy scalars
                if hasattr(val, 'item'):
                    val = val.item()
                shap_importance[name] = float(val)

        # Sort by importance (descending)
        shap_importance = dict(
            sorted(shap_importance.items(), key=lambda x: x[1], reverse=True)
        )

        # Top 20 features for visualization
        top_features = list(shap_importance.items())[:20]

        return {
            'shap_importance': shap_importance,
            'top_features': [
                {'feature': f, 'importance': v}
                for f, v in top_features
            ],
            'num_samples_explained': num_samples,
            'num_features': len(feature_names),
            'algorithm_type': self.algorithm_type,
        }
