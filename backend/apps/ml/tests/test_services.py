"""
Tests for ML services.
"""

import numpy as np
import pandas as pd
import pytest

from apps.ml.models import TrainingJob
from apps.ml.services import ModelEvaluatorService


class TestModelEvaluatorService:
    """Tests for ModelEvaluatorService."""

    def test_evaluate_classification(self):
        """Test evaluating classification predictions."""
        y_true = np.array([0, 1, 0, 1, 0, 1, 0, 1])
        y_pred = np.array([0, 1, 0, 0, 0, 1, 1, 1])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.CLASSIFICATION
        )

        assert 'accuracy' in metrics
        assert 'precision' in metrics
        assert 'recall' in metrics
        assert 'f1' in metrics
        assert 'confusion_matrix' in metrics

        # Check values are reasonable
        assert 0 <= metrics['accuracy'] <= 1
        assert 0 <= metrics['precision'] <= 1
        assert 0 <= metrics['recall'] <= 1

    def test_evaluate_regression(self):
        """Test evaluating regression predictions."""
        y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        y_pred = np.array([1.1, 2.2, 2.9, 4.1, 5.2])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.REGRESSION
        )

        assert 'mse' in metrics
        assert 'rmse' in metrics
        assert 'mae' in metrics
        assert 'r2' in metrics

        # Check RMSE is positive
        assert metrics['rmse'] >= 0
        # Check R2 is reasonable
        assert metrics['r2'] <= 1

    def test_evaluate_multiclass_classification(self):
        """Test evaluating multiclass classification."""
        y_true = np.array([0, 1, 2, 0, 1, 2, 0, 1, 2])
        y_pred = np.array([0, 1, 2, 0, 2, 2, 1, 1, 2])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.CLASSIFICATION
        )

        assert 'accuracy' in metrics
        assert 'f1_weighted' in metrics

    def test_compare_models_classification(self):
        """Test comparing classification models."""
        models = [
            {
                'name': 'model1',
                'metrics': {'f1_weighted': 0.85, 'accuracy': 0.87}
            },
            {
                'name': 'model2',
                'metrics': {'f1_weighted': 0.90, 'accuracy': 0.91}
            },
            {
                'name': 'model3',
                'metrics': {'f1_weighted': 0.82, 'accuracy': 0.84}
            },
        ]

        evaluator = ModelEvaluatorService()
        ranked = evaluator.compare_models(
            models,
            TrainingJob.TaskType.CLASSIFICATION
        )

        # Best model should be model2 (highest f1)
        assert ranked[0]['name'] == 'model2'
        assert ranked[0]['is_best'] is True
        assert ranked[0]['rank'] == 1

    def test_compare_models_regression(self):
        """Test comparing regression models."""
        models = [
            {
                'name': 'model1',
                'metrics': {'rmse': 5.5, 'r2': 0.85}
            },
            {
                'name': 'model2',
                'metrics': {'rmse': 3.2, 'r2': 0.92}
            },
            {
                'name': 'model3',
                'metrics': {'rmse': 7.1, 'r2': 0.78}
            },
        ]

        evaluator = ModelEvaluatorService()
        ranked = evaluator.compare_models(
            models,
            TrainingJob.TaskType.REGRESSION
        )

        # Best model should be model2 (lowest rmse)
        assert ranked[0]['name'] == 'model2'
        assert ranked[0]['is_best'] is True
        assert ranked[0]['rank'] == 1

    def test_classification_perfect_predictions(self):
        """Test classification with perfect predictions."""
        y_true = np.array([0, 1, 0, 1, 0, 1])
        y_pred = np.array([0, 1, 0, 1, 0, 1])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.CLASSIFICATION
        )

        assert metrics['accuracy'] == 1.0
        assert metrics['f1'] == 1.0

    def test_regression_perfect_predictions(self):
        """Test regression with perfect predictions."""
        y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        y_pred = np.array([1.0, 2.0, 3.0, 4.0, 5.0])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.REGRESSION
        )

        assert metrics['mse'] == 0.0
        assert metrics['rmse'] == 0.0
        assert metrics['mae'] == 0.0
        assert metrics['r2'] == 1.0

    def test_classification_confusion_matrix_shape(self):
        """Test confusion matrix shape for binary classification."""
        y_true = np.array([0, 1, 0, 1, 0, 1])
        y_pred = np.array([0, 1, 0, 0, 1, 1])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.CLASSIFICATION
        )

        cm = metrics['confusion_matrix']
        assert len(cm) == 2  # 2x2 matrix for binary
        assert len(cm[0]) == 2

    def test_regression_mape_with_zeros(self):
        """Test regression MAPE not computed when zeros in y_true."""
        y_true = np.array([0.0, 1.0, 2.0, 3.0])
        y_pred = np.array([0.1, 1.1, 2.1, 3.1])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.REGRESSION
        )

        # MAPE should not be computed (would cause division by zero)
        assert 'mape' not in metrics or metrics.get('mape') is None

    def test_confusion_matrix_has_labels(self):
        """Test confusion matrix includes class labels."""
        y_true = np.array([0, 1, 0, 1, 0, 1])
        y_pred = np.array([0, 1, 0, 0, 1, 1])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.CLASSIFICATION
        )

        # Confusion matrix labels should be present
        assert 'confusion_matrix_labels' in metrics
        assert len(metrics['confusion_matrix_labels']) == 2
        assert metrics['confusion_matrix_labels'] == ['0', '1']

    def test_multiclass_confusion_matrix_has_labels(self):
        """Test confusion matrix labels for multiclass."""
        y_true = np.array([0, 1, 2, 0, 1, 2])
        y_pred = np.array([0, 1, 2, 1, 1, 2])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.CLASSIFICATION
        )

        # Should have 3 labels for 3 classes
        assert 'confusion_matrix_labels' in metrics
        assert len(metrics['confusion_matrix_labels']) == 3
        assert metrics['confusion_matrix_labels'] == ['0', '1', '2']

    def test_roc_curve_data_with_pipeline(self):
        """Test ROC curve data is generated when pipeline with predict_proba is provided."""
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler

        # Create a simple dataset
        np.random.seed(42)
        X_train = pd.DataFrame({
            'feature1': np.random.randn(100),
            'feature2': np.random.randn(100)
        })
        y_train = np.array([0] * 50 + [1] * 50)

        X_test = pd.DataFrame({
            'feature1': np.random.randn(20),
            'feature2': np.random.randn(20)
        })
        y_test = np.array([0] * 10 + [1] * 10)

        # Create and fit pipeline
        pipeline = Pipeline([
            ('preprocessor', StandardScaler()),
            ('model', LogisticRegression())
        ])
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_test,
            y_pred,
            TrainingJob.TaskType.CLASSIFICATION,
            pipeline=pipeline,
            X_test=X_test
        )

        # ROC curve data should be present
        assert 'roc_auc' in metrics
        assert 'roc_curve' in metrics
        assert 'fpr' in metrics['roc_curve']
        assert 'tpr' in metrics['roc_curve']
        assert 'thresholds' in metrics['roc_curve']

        # Check that ROC curve data is valid
        assert len(metrics['roc_curve']['fpr']) == len(metrics['roc_curve']['tpr'])
        assert all(0 <= x <= 1 for x in metrics['roc_curve']['fpr'])
        assert all(0 <= x <= 1 for x in metrics['roc_curve']['tpr'])

        # ROC AUC should be between 0 and 1
        assert 0 <= metrics['roc_auc'] <= 1

    def test_roc_curve_not_computed_for_multiclass(self):
        """Test ROC curve is not computed for multiclass classification."""
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler

        # Create a multiclass dataset
        np.random.seed(42)
        X_train = pd.DataFrame({
            'feature1': np.random.randn(150),
            'feature2': np.random.randn(150)
        })
        y_train = np.array([0] * 50 + [1] * 50 + [2] * 50)

        X_test = pd.DataFrame({
            'feature1': np.random.randn(30),
            'feature2': np.random.randn(30)
        })
        y_test = np.array([0] * 10 + [1] * 10 + [2] * 10)

        # Create and fit pipeline
        pipeline = Pipeline([
            ('preprocessor', StandardScaler()),
            ('model', LogisticRegression(max_iter=1000))
        ])
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_test,
            y_pred,
            TrainingJob.TaskType.CLASSIFICATION,
            pipeline=pipeline,
            X_test=X_test
        )

        # ROC curve should not be present for multiclass
        assert 'roc_curve' not in metrics

    def test_roc_curve_without_pipeline(self):
        """Test ROC curve is not computed when no pipeline is provided."""
        y_true = np.array([0, 1, 0, 1, 0, 1])
        y_pred = np.array([0, 1, 0, 0, 1, 1])

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_true, y_pred,
            TrainingJob.TaskType.CLASSIFICATION
        )

        # ROC curve should not be present without pipeline
        assert 'roc_curve' not in metrics


class TestSVMSupport:
    """Tests for SVM model support."""

    def test_svc_training_and_evaluation(self):
        """Test SVC classifier trains and evaluates successfully."""
        from sklearn.svm import SVC
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler

        # Create a simple binary classification dataset
        np.random.seed(42)
        X_train = pd.DataFrame({
            'feature1': np.random.randn(100),
            'feature2': np.random.randn(100)
        })
        y_train = np.array([0] * 50 + [1] * 50)

        X_test = pd.DataFrame({
            'feature1': np.random.randn(20),
            'feature2': np.random.randn(20)
        })
        y_test = np.array([0] * 10 + [1] * 10)

        # Create SVC pipeline with probability=True
        pipeline = Pipeline([
            ('preprocessor', StandardScaler()),
            ('model', SVC(kernel='rbf', probability=True, max_iter=5000, random_state=42))
        ])
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_test,
            y_pred,
            TrainingJob.TaskType.CLASSIFICATION,
            pipeline=pipeline,
            X_test=X_test
        )

        # Should have classification metrics
        assert 'accuracy' in metrics
        assert 'f1_weighted' in metrics
        assert 'confusion_matrix' in metrics

        # SVC with probability=True should have ROC curve
        assert 'roc_auc' in metrics
        assert 'roc_curve' in metrics

    def test_svr_training_and_evaluation(self):
        """Test SVR regressor trains and evaluates successfully."""
        from sklearn.svm import SVR
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler

        # Create a simple regression dataset
        np.random.seed(42)
        X_train = pd.DataFrame({
            'feature1': np.random.randn(100),
            'feature2': np.random.randn(100)
        })
        y_train = X_train['feature1'] * 2 + X_train['feature2'] + np.random.randn(100) * 0.1

        X_test = pd.DataFrame({
            'feature1': np.random.randn(20),
            'feature2': np.random.randn(20)
        })
        y_test = X_test['feature1'] * 2 + X_test['feature2'] + np.random.randn(20) * 0.1

        # Create SVR pipeline
        pipeline = Pipeline([
            ('preprocessor', StandardScaler()),
            ('model', SVR(kernel='rbf', max_iter=5000))
        ])
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)

        evaluator = ModelEvaluatorService()
        metrics = evaluator.evaluate(
            y_test,
            y_pred,
            TrainingJob.TaskType.REGRESSION
        )

        # Should have regression metrics
        assert 'mse' in metrics
        assert 'rmse' in metrics
        assert 'mae' in metrics
        assert 'r2' in metrics

        # SVR should perform reasonably on this simple dataset
        assert metrics['r2'] > 0.5

    def test_svm_feature_importance_linear_kernel(self):
        """Test feature importance extraction for linear kernel SVM."""
        from sklearn.svm import SVC
        from sklearn.pipeline import Pipeline
        from sklearn.compose import ColumnTransformer
        from sklearn.preprocessing import StandardScaler

        # Create a simple dataset
        np.random.seed(42)
        X_train = pd.DataFrame({
            'feature1': np.random.randn(100),
            'feature2': np.random.randn(100)
        })
        y_train = np.array([0] * 50 + [1] * 50)

        # Create preprocessing pipeline
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), ['feature1', 'feature2'])
            ]
        )

        # Create SVC pipeline with linear kernel (has coef_)
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', SVC(kernel='linear', probability=True, random_state=42))
        ])
        pipeline.fit(X_train, y_train)

        # Extract feature importance using the same logic as trainer
        model = pipeline.named_steps['model']
        assert hasattr(model, 'coef_'), "Linear kernel SVM should have coef_"

        coefs = np.abs(model.coef_)
        if len(coefs.shape) > 1:
            coefs = coefs.mean(axis=0)

        feature_names = preprocessor.get_feature_names_out()
        importance_dict = {name: float(coef) for name, coef in zip(feature_names, coefs)}

        assert len(importance_dict) == 2
        assert all(v >= 0 for v in importance_dict.values())

    def test_svm_no_feature_importance_rbf_kernel(self):
        """Test that RBF kernel SVM has no direct feature importance."""
        from sklearn.svm import SVC

        # Create a simple dataset
        np.random.seed(42)
        X_train = np.random.randn(100, 2)
        y_train = np.array([0] * 50 + [1] * 50)

        # Train SVC with RBF kernel
        model = SVC(kernel='rbf', probability=True, random_state=42)
        model.fit(X_train, y_train)

        # RBF kernel SVM should not have feature_importances_ or coef_
        assert not hasattr(model, 'feature_importances_')
        assert not hasattr(model, 'coef_')
