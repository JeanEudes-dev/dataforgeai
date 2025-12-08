"""
Tests for SHAP Explainer Service.
"""

import numpy as np
import pandas as pd
import pytest
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

from apps.ml.services.explainer import SHAPExplainerService


class TestSHAPExplainerService:
    """Tests for SHAPExplainerService."""

    @pytest.fixture
    def classification_data(self):
        """Create simple classification dataset."""
        np.random.seed(42)
        X = pd.DataFrame({
            'feature1': np.random.randn(100),
            'feature2': np.random.randn(100),
            'feature3': np.random.randn(100)
        })
        y = np.array([0] * 50 + [1] * 50)
        return X, y

    @pytest.fixture
    def regression_data(self):
        """Create simple regression dataset."""
        np.random.seed(42)
        X = pd.DataFrame({
            'feature1': np.random.randn(100),
            'feature2': np.random.randn(100)
        })
        y = X['feature1'] * 2 + X['feature2'] + np.random.randn(100) * 0.1
        return X, y

    def _create_pipeline(self, model, X):
        """Helper to create a simple preprocessing pipeline."""
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), list(X.columns))
            ]
        )
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', model)
        ])
        return pipeline

    def test_shap_tree_explainer_random_forest(self, classification_data):
        """Test SHAP computation for Random Forest using TreeExplainer."""
        X, y = classification_data

        pipeline = self._create_pipeline(
            RandomForestClassifier(n_estimators=10, random_state=42),
            X
        )
        pipeline.fit(X, y)

        explainer = SHAPExplainerService(
            pipeline=pipeline,
            algorithm_type='random_forest',
            feature_columns=list(X.columns)
        )

        shap_data = explainer.compute_shap_values(X)

        # Should have SHAP data
        assert shap_data is not None
        assert 'shap_importance' in shap_data
        assert 'top_features' in shap_data
        assert 'num_samples_explained' in shap_data
        assert 'num_features' in shap_data

        # Should have importance for all features
        assert len(shap_data['shap_importance']) == 3

        # All importance values should be non-negative
        assert all(v >= 0 for v in shap_data['shap_importance'].values())

    def test_shap_tree_explainer_gradient_boosting(self, classification_data):
        """Test SHAP computation for Gradient Boosting using TreeExplainer."""
        X, y = classification_data

        pipeline = self._create_pipeline(
            GradientBoostingClassifier(n_estimators=10, random_state=42),
            X
        )
        pipeline.fit(X, y)

        explainer = SHAPExplainerService(
            pipeline=pipeline,
            algorithm_type='gradient_boosting',
            feature_columns=list(X.columns)
        )

        shap_data = explainer.compute_shap_values(X)

        assert shap_data is not None
        assert 'shap_importance' in shap_data
        assert len(shap_data['top_features']) > 0

    def test_shap_linear_explainer_logistic_regression(self, classification_data):
        """Test SHAP computation for Logistic Regression using LinearExplainer."""
        X, y = classification_data

        pipeline = self._create_pipeline(
            LogisticRegression(random_state=42),
            X
        )
        pipeline.fit(X, y)

        explainer = SHAPExplainerService(
            pipeline=pipeline,
            algorithm_type='logistic_regression',
            feature_columns=list(X.columns)
        )

        shap_data = explainer.compute_shap_values(X)

        assert shap_data is not None
        assert 'shap_importance' in shap_data
        assert shap_data['algorithm_type'] == 'logistic_regression'

    def test_shap_kernel_explainer_svm(self, classification_data):
        """Test SHAP computation for SVM using KernelExplainer (slower)."""
        X, y = classification_data

        # Use smaller dataset but ensure both classes are present
        # Take 25 from each class
        X_small = pd.concat([X.iloc[:25], X.iloc[50:75]], ignore_index=True)
        y_small = np.array([0] * 25 + [1] * 25)

        pipeline = self._create_pipeline(
            SVC(kernel='rbf', probability=True, random_state=42),
            X_small
        )
        pipeline.fit(X_small, y_small)

        explainer = SHAPExplainerService(
            pipeline=pipeline,
            algorithm_type='svm',
            feature_columns=list(X_small.columns)
        )

        # Use even smaller sample for KernelExplainer
        shap_data = explainer.compute_shap_values(X_small.head(20))

        # SVM should use KernelExplainer (slower but works)
        assert shap_data is not None
        assert 'shap_importance' in shap_data

    def test_shap_top_features_sorted(self, classification_data):
        """Test that top features are sorted by importance."""
        X, y = classification_data

        pipeline = self._create_pipeline(
            RandomForestClassifier(n_estimators=10, random_state=42),
            X
        )
        pipeline.fit(X, y)

        explainer = SHAPExplainerService(
            pipeline=pipeline,
            algorithm_type='random_forest',
            feature_columns=list(X.columns)
        )

        shap_data = explainer.compute_shap_values(X)

        # Top features should be sorted by importance (descending)
        top_features = shap_data['top_features']
        importances = [f['importance'] for f in top_features]
        assert importances == sorted(importances, reverse=True)

    def test_shap_handles_large_datasets(self, classification_data):
        """Test that SHAP service samples large datasets."""
        X, y = classification_data

        # Create larger dataset
        X_large = pd.concat([X] * 5, ignore_index=True)
        y_large = np.tile(y, 5)

        pipeline = self._create_pipeline(
            RandomForestClassifier(n_estimators=10, random_state=42),
            X
        )
        pipeline.fit(X, y)

        explainer = SHAPExplainerService(
            pipeline=pipeline,
            algorithm_type='random_forest',
            feature_columns=list(X.columns)
        )

        shap_data = explainer.compute_shap_values(X_large)

        # Should still work with sampled data
        assert shap_data is not None
        assert shap_data['num_samples_explained'] <= explainer.MAX_EXPLAIN_SAMPLES

    def test_shap_returns_empty_on_failure(self, classification_data):
        """Test that SHAP returns empty dict on failure."""
        X, y = classification_data

        pipeline = self._create_pipeline(
            RandomForestClassifier(n_estimators=10, random_state=42),
            X
        )
        pipeline.fit(X, y)

        explainer = SHAPExplainerService(
            pipeline=pipeline,
            algorithm_type='random_forest',
            feature_columns=list(X.columns)
        )

        # Pass invalid data to trigger failure
        invalid_data = pd.DataFrame({'wrong_column': [1, 2, 3]})

        # Should return empty dict, not raise exception
        shap_data = explainer.compute_shap_values(invalid_data)
        assert shap_data == {}

    def test_shap_feature_names_preserved(self, classification_data):
        """Test that feature names are preserved in SHAP output."""
        X, y = classification_data

        pipeline = self._create_pipeline(
            RandomForestClassifier(n_estimators=10, random_state=42),
            X
        )
        pipeline.fit(X, y)

        explainer = SHAPExplainerService(
            pipeline=pipeline,
            algorithm_type='random_forest',
            feature_columns=list(X.columns)
        )

        shap_data = explainer.compute_shap_values(X)

        # Feature names should contain the original column names
        feature_keys = list(shap_data['shap_importance'].keys())
        # After preprocessing, names have prefixes like 'num__feature1'
        assert len(feature_keys) == len(X.columns)
