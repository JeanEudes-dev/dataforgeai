"""
Model Trainer Service.

Handles the complete ML training pipeline including
preprocessing, model training, evaluation, and selection.
"""

import logging
import os
import tempfile
import time
from datetime import datetime
from typing import Any

import joblib
import numpy as np
import pandas as pd
from django.conf import settings
from django.core.files import File
from django.utils import timezone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import SVC, SVR

from apps.core.exceptions import TrainingError
from apps.datasets.models import Dataset
from apps.ml.models import TrainedModel, TrainingJob

from .evaluator import ModelEvaluatorService
from .explainer import SHAPExplainerService

logger = logging.getLogger(__name__)


class ModelTrainerService:
    """
    Service for training ML models.

    Orchestrates the complete training pipeline:
    1. Load and prepare data
    2. Detect task type
    3. Create preprocessing pipeline
    4. Train candidate models
    5. Evaluate and select best model
    6. Persist models
    """

    # Candidate models by task type
    CLASSIFICATION_MODELS = {
        'logistic_regression': {
            'class': LogisticRegression,
            'display_name': 'Logistic Regression',
            'params': {'max_iter': 1000, 'random_state': 42},
        },
        'random_forest': {
            'class': RandomForestClassifier,
            'display_name': 'Random Forest',
            'params': {'n_estimators': 100, 'max_depth': 10, 'random_state': 42},
        },
        'gradient_boosting': {
            'class': GradientBoostingClassifier,
            'display_name': 'Gradient Boosting',
            'params': {'n_estimators': 100, 'max_depth': 5, 'random_state': 42},
        },
        'svm': {
            'class': SVC,
            'display_name': 'Support Vector Machine',
            'params': {
                'kernel': 'rbf',
                'probability': True,  # Required for predict_proba
                'random_state': 42,
                'max_iter': 5000,
            },
        },
    }

    REGRESSION_MODELS = {
        'linear_regression': {
            'class': LinearRegression,
            'display_name': 'Linear Regression',
            'params': {},
        },
        'random_forest': {
            'class': RandomForestRegressor,
            'display_name': 'Random Forest',
            'params': {'n_estimators': 100, 'max_depth': 10, 'random_state': 42},
        },
        'gradient_boosting': {
            'class': GradientBoostingRegressor,
            'display_name': 'Gradient Boosting',
            'params': {'n_estimators': 100, 'max_depth': 5, 'random_state': 42},
        },
        'svm': {
            'class': SVR,
            'display_name': 'Support Vector Machine',
            'params': {
                'kernel': 'rbf',
                'max_iter': 5000,
            },
        },
    }

    def __init__(self, training_job: TrainingJob):
        self.job = training_job
        self.dataset = training_job.dataset
        self.df: pd.DataFrame | None = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.preprocessor = None
        self.evaluator = ModelEvaluatorService()

    def train(self) -> TrainingJob:
        """
        Execute the complete training pipeline.

        Returns:
            Updated TrainingJob with results
        """
        try:
            self._update_status(TrainingJob.Status.RUNNING, 'Loading data')
            self.job.started_at = timezone.now()
            self.job.save()

            # Load and prepare data
            self.df = self._load_dataset()
            self._prepare_features()

            # Split data
            self._update_status(TrainingJob.Status.RUNNING, 'Splitting data', 10)
            self._split_data()

            # Create preprocessor
            self._update_status(TrainingJob.Status.RUNNING, 'Creating preprocessor', 20)
            self._create_preprocessor()

            # Train models
            self._update_status(TrainingJob.Status.RUNNING, 'Training models', 30)
            trained_models = self._train_all_models()

            # Select best model
            self._update_status(TrainingJob.Status.RUNNING, 'Selecting best model', 90)
            best_model = self._select_best_model(trained_models)

            # Complete
            self._update_status(TrainingJob.Status.COMPLETED, 'Complete', 100)
            self.job.best_model = best_model
            self.job.completed_at = timezone.now()
            self.job.save()

            logger.info(f'Training completed for job {self.job.id}')
            return self.job

        except Exception as e:
            logger.error(f'Training failed for job {self.job.id}: {str(e)}')
            self.job.status = TrainingJob.Status.ERROR
            self.job.error_message = str(e)
            self.job.completed_at = timezone.now()
            self.job.save()
            raise TrainingError(
                detail=f'Training failed: {str(e)}',
                meta={'job_id': str(self.job.id)}
            )

    def _update_status(self, status: str, step: str, progress: float = None) -> None:
        """Update job status."""
        self.job.status = status
        self.job.current_step = step
        if progress is not None:
            self.job.progress = progress
        self.job.save()

    def _load_dataset(self) -> pd.DataFrame:
        """Load the dataset from file."""
        file_path = self.dataset.file.path
        file_type = self.dataset.file_type.lower()

        if file_type == 'csv':
            df = pd.read_csv(file_path, low_memory=False)
        elif file_type in ['xlsx', 'xls']:
            df = pd.read_excel(file_path)
        else:
            raise TrainingError(f'Unsupported file type: {file_type}')

        return df

    def _prepare_features(self) -> None:
        """Prepare feature and target columns."""
        target_col = self.job.target_column

        if target_col not in self.df.columns:
            raise TrainingError(f'Target column "{target_col}" not found in dataset')

        # Get feature columns
        if self.job.feature_columns:
            feature_cols = self.job.feature_columns
            # Validate all feature columns exist
            missing = set(feature_cols) - set(self.df.columns)
            if missing:
                raise TrainingError(f'Feature columns not found: {missing}')
        else:
            # Use all columns except target
            feature_cols = [c for c in self.df.columns if c != target_col]
            self.job.feature_columns = feature_cols
            self.job.save()

        # Detect task type if not set
        if not self.job.task_type:
            self.job.task_type = self._detect_task_type(self.df[target_col])
            self.job.task_type_auto_detected = True
            self.job.save()

    def _detect_task_type(self, target_series: pd.Series) -> str:
        """Detect whether this is classification or regression."""
        # Check dtype
        if target_series.dtype in ['object', 'category', 'bool']:
            return TrainingJob.TaskType.CLASSIFICATION

        n_unique = target_series.nunique()

        # Binary columns (0/1, -1/1, etc.) are always classification
        if n_unique == 2:
            return TrainingJob.TaskType.CLASSIFICATION

        # Check unique ratio for numeric columns
        # Low cardinality numeric columns are likely categorical
        unique_ratio = n_unique / len(target_series)
        if unique_ratio <= 0.05 and n_unique <= 20:
            return TrainingJob.TaskType.CLASSIFICATION

        return TrainingJob.TaskType.REGRESSION

    def _split_data(self) -> None:
        """Split data into train and test sets."""
        target_col = self.job.target_column
        feature_cols = self.job.feature_columns

        X = self.df[feature_cols]
        y = self.df[target_col]

        # Drop rows with missing target
        mask = ~y.isna()
        X = X[mask]
        y = y[mask]

        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

    def _create_preprocessor(self) -> None:
        """Create the preprocessing pipeline."""
        feature_cols = self.job.feature_columns
        X = self.X_train

        # Identify column types
        numeric_cols = X.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()

        transformers = []

        if numeric_cols:
            numeric_transformer = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])
            transformers.append(('num', numeric_transformer, numeric_cols))

        if categorical_cols:
            categorical_transformer = Pipeline([
                ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
                ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            transformers.append(('cat', categorical_transformer, categorical_cols))

        self.preprocessor = ColumnTransformer(
            transformers=transformers,
            remainder='drop'
        )

        # Fit the preprocessor
        self.preprocessor.fit(self.X_train)

    def _train_all_models(self) -> list[TrainedModel]:
        """Train all candidate models."""
        if self.job.task_type == TrainingJob.TaskType.CLASSIFICATION:
            models_config = self.CLASSIFICATION_MODELS
        else:
            models_config = self.REGRESSION_MODELS

        trained_models = []
        total_models = len(models_config)

        for i, (name, config) in enumerate(models_config.items()):
            progress = 30 + (60 * (i + 1) / total_models)
            self._update_status(
                TrainingJob.Status.RUNNING,
                f'Training {config["display_name"]}',
                progress
            )

            try:
                trained_model = self._train_single_model(name, config)
                trained_models.append(trained_model)
            except Exception as e:
                logger.warning(f'Failed to train {name}: {str(e)}')
                continue

        if not trained_models:
            raise TrainingError('All models failed to train')

        return trained_models

    def _train_single_model(self, name: str, config: dict) -> TrainedModel:
        """Train a single model and save it."""
        # Create the full pipeline
        model_class = config['class']
        model_params = config['params']
        model = model_class(**model_params)

        pipeline = Pipeline([
            ('preprocessor', self.preprocessor),
            ('model', model)
        ])

        # Train
        pipeline.fit(self.X_train, self.y_train)

        # Evaluate
        y_pred = pipeline.predict(self.X_test)
        metrics = self.evaluator.evaluate(
            self.y_test,
            y_pred,
            self.job.task_type,
            pipeline=pipeline if hasattr(pipeline.named_steps['model'], 'predict_proba') else None,
            X_test=self.X_test
        )

        # Cross-validation with adaptive folds for small datasets
        X_full = pd.concat([self.X_train, self.X_test])
        y_full = pd.concat([self.y_train, self.y_test])

        # Determine number of CV folds based on data size
        if self.job.task_type == TrainingJob.TaskType.CLASSIFICATION:
            # For classification, ensure each class has enough samples per fold
            min_class_count = y_full.value_counts().min()
            n_folds = min(5, max(2, min_class_count))
        else:
            # For regression, base on total sample count
            n_folds = min(5, max(2, len(y_full) // 5))

        # Run cross-validation with fallback for edge cases
        try:
            cv_scores = cross_val_score(
                pipeline,
                X_full,
                y_full,
                cv=n_folds,
                scoring='f1_weighted' if self.job.task_type == TrainingJob.TaskType.CLASSIFICATION else 'neg_root_mean_squared_error'
            )
        except ValueError as e:
            # Fallback: use simple KFold if stratified fails (e.g., too many classes)
            from sklearn.model_selection import KFold
            logger.warning(f'Stratified CV failed, using KFold: {e}')
            kfold = KFold(n_splits=min(5, max(2, len(y_full) // 5)), shuffle=True, random_state=42)
            cv_scores = cross_val_score(
                pipeline,
                X_full,
                y_full,
                cv=kfold,
                scoring='f1_weighted' if self.job.task_type == TrainingJob.TaskType.CLASSIFICATION else 'neg_root_mean_squared_error'
            )

        # Get feature importance if available
        feature_importance = self._get_feature_importance(pipeline)

        # Compute SHAP values (non-blocking on failure)
        shap_data = {}
        try:
            shap_service = SHAPExplainerService(
                pipeline=pipeline,
                algorithm_type=name,
                feature_columns=self.job.feature_columns
            )
            # Use combined train/test data for SHAP background
            X_combined = pd.concat([self.X_train, self.X_test])
            shap_data = shap_service.compute_shap_values(X_combined)
            if shap_data:
                logger.info(f'SHAP values computed successfully for {name}')
        except Exception as e:
            logger.warning(f'SHAP computation failed for {name}: {e}')
            # Continue without SHAP - it's optional

        # Build input schema
        input_schema = {}
        for col in self.job.feature_columns:
            col_data = self.df[col]
            input_schema[col] = {
                'dtype': 'numeric' if pd.api.types.is_numeric_dtype(col_data) else 'categorical',
                'nullable': bool(col_data.isnull().any()),
            }

        # Save model to file
        model_file = self._save_model(pipeline, name)

        # Create TrainedModel record
        algorithm_type = self._get_algorithm_type(name)

        trained_model = TrainedModel.objects.create(
            training_job=self.job,
            dataset=self.dataset,
            owner=self.job.owner,
            name=name,
            display_name=config['display_name'],
            algorithm_type=algorithm_type,
            task_type=self.job.task_type,
            feature_columns=self.job.feature_columns,
            target_column=self.job.target_column,
            input_schema=input_schema,
            preprocessing_params={
                'numeric_cols': self.preprocessor.transformers_[0][2] if self.preprocessor.transformers_ else [],
                'categorical_cols': self.preprocessor.transformers_[1][2] if len(self.preprocessor.transformers_) > 1 else [],
            },
            metrics=metrics,
            feature_importance=feature_importance,
            cross_val_scores=[float(s) for s in cv_scores],
            hyperparameters=model_params,
            shap_values=shap_data,
        )

        # Attach the model file
        with open(model_file, 'rb') as f:
            trained_model.model_file.save(f'{name}.joblib', File(f))
        trained_model.model_size = os.path.getsize(model_file)
        trained_model.save()

        # Clean up temp file
        os.remove(model_file)

        return trained_model

    def _get_algorithm_type(self, name: str) -> str:
        """Map model name to algorithm type."""
        mapping = {
            'logistic_regression': TrainedModel.AlgorithmType.LOGISTIC_REGRESSION,
            'linear_regression': TrainedModel.AlgorithmType.LINEAR_REGRESSION,
            'random_forest': TrainedModel.AlgorithmType.RANDOM_FOREST,
            'gradient_boosting': TrainedModel.AlgorithmType.GRADIENT_BOOSTING,
            'svm': TrainedModel.AlgorithmType.SVM,
        }
        return mapping.get(name, name)

    def _get_feature_importance(self, pipeline) -> dict:
        """Extract feature importance from the model."""
        try:
            model = pipeline.named_steps['model']

            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_

                # Get feature names after preprocessing
                preprocessor = pipeline.named_steps['preprocessor']
                feature_names = preprocessor.get_feature_names_out()

                # Create importance dict
                importance_dict = {}
                for name, importance in zip(feature_names, importances):
                    importance_dict[name] = float(importance)

                # Sort by importance
                importance_dict = dict(
                    sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
                )

                return importance_dict

            elif hasattr(model, 'coef_'):
                coefs = np.abs(model.coef_)
                if len(coefs.shape) > 1:
                    coefs = coefs.mean(axis=0)

                preprocessor = pipeline.named_steps['preprocessor']
                feature_names = preprocessor.get_feature_names_out()

                importance_dict = {}
                for name, coef in zip(feature_names, coefs):
                    importance_dict[name] = float(coef)

                importance_dict = dict(
                    sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
                )

                return importance_dict

        except Exception as e:
            logger.warning(f'Failed to extract feature importance: {e}')

        return {}

    def _save_model(self, pipeline, name: str) -> str:
        """Save the trained pipeline to a temp file."""
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.joblib',
            prefix=f'model_{name}_'
        )
        temp_path = temp_file.name
        temp_file.close()

        model_data = {
            'pipeline': pipeline,
            'feature_columns': self.job.feature_columns,
            'target_column': self.job.target_column,
            'task_type': self.job.task_type,
            'training_date': datetime.utcnow().isoformat(),
        }

        joblib.dump(model_data, temp_path)
        return temp_path

    def _select_best_model(self, trained_models: list[TrainedModel]) -> TrainedModel:
        """Select the best model based on metrics."""
        if not trained_models:
            raise TrainingError('No trained models to select from')

        if self.job.task_type == TrainingJob.TaskType.CLASSIFICATION:
            # Select by F1 score (higher is better)
            best = max(trained_models, key=lambda m: m.metrics.get('f1_weighted', 0))
        else:
            # Select by RMSE (lower is better)
            best = min(trained_models, key=lambda m: m.metrics.get('rmse', float('inf')))

        # Mark as best
        best.is_best = True
        best.save()

        return best
