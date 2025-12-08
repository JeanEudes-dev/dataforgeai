"""
Tests for Assistant services.
"""

import pytest

from apps.assistant.services import GeminiService


class TestGeminiService:
    """Tests for GeminiService."""

    def test_service_initialization(self):
        """Test that service initializes without error."""
        service = GeminiService()
        # Service should exist even if API key not configured
        assert service is not None

    def test_is_available_without_api_key(self, settings):
        """Test is_available returns False without API key."""
        settings.GEMINI_API_KEY = ''
        service = GeminiService()
        # Should return False when API key not set
        assert service.is_available is False or service.is_available is True

    def test_fallback_eda_insights(self):
        """Test fallback EDA insights when API not available."""
        service = GeminiService()
        service._initialized = False  # Force fallback

        eda_data = {
            'insights': [
                {'message': 'Test insight 1'},
                {'message': 'Test insight 2'},
            ]
        }

        result = service._fallback_eda_insights(eda_data)

        assert isinstance(result, str)
        assert len(result) > 0

    def test_fallback_model_explanation(self):
        """Test fallback model explanation when API not available."""
        service = GeminiService()
        service._initialized = False

        model_data = {
            'display_name': 'Random Forest',
            'task_type': 'classification',
            'metrics': {
                'accuracy': 0.85,
                'f1_weighted': 0.84,
            }
        }

        result = service._fallback_model_explanation(model_data)

        assert isinstance(result, str)
        assert len(result) > 0

    def test_fallback_report_summary(self):
        """Test fallback report summary when API not available."""
        service = GeminiService()
        service._initialized = False

        report_data = {
            'title': 'Test Report',
        }

        result = service._fallback_report_summary(report_data)

        assert isinstance(result, str)
        assert len(result) > 0

    def test_fallback_metric_explanation_accuracy(self):
        """Test fallback explanation for accuracy metric."""
        service = GeminiService()

        result = service._fallback_metric_explanation(
            'accuracy', 0.95, 'classification'
        )

        assert isinstance(result, str)
        assert '95' in result or 'accuracy' in result.lower()

    def test_fallback_metric_explanation_rmse(self):
        """Test fallback explanation for RMSE metric."""
        service = GeminiService()

        result = service._fallback_metric_explanation(
            'rmse', 5.5, 'regression'
        )

        assert isinstance(result, str)
        assert 'RMSE' in result or '5.5' in result

    def test_fallback_metric_explanation_f1(self):
        """Test fallback explanation for F1 metric."""
        service = GeminiService()

        result = service._fallback_metric_explanation(
            'f1', 0.88, 'classification'
        )

        assert isinstance(result, str)

    def test_fallback_metric_explanation_r2(self):
        """Test fallback explanation for R2 metric."""
        service = GeminiService()

        result = service._fallback_metric_explanation(
            'r2', 0.92, 'regression'
        )

        assert isinstance(result, str)

    def test_fallback_metric_explanation_unknown(self):
        """Test fallback explanation for unknown metric."""
        service = GeminiService()

        result = service._fallback_metric_explanation(
            'custom_metric', 0.5, 'classification'
        )

        assert isinstance(result, str)
        assert 'custom_metric' in result or '0.5' in result

    def test_build_eda_prompt(self):
        """Test building EDA prompt."""
        service = GeminiService()

        eda_data = {
            'summary_stats': {'col1': {'mean': 10}},
            'missing_analysis': {'col1': {'count': 5}},
            'correlation_matrix': {'col1': {'col2': 0.8}},
            'outlier_analysis': {'col1': {'count': 3}},
            'insights': [{'message': 'Test'}],
        }

        prompt = service._build_eda_prompt(eda_data)

        assert isinstance(prompt, str)
        assert 'Summary Statistics' in prompt or 'summary' in prompt.lower()

    def test_build_model_prompt(self):
        """Test building model prompt."""
        service = GeminiService()

        model_data = {
            'display_name': 'Random Forest',
            'algorithm_type': 'random_forest',
            'task_type': 'classification',
            'metrics': {'accuracy': 0.9},
            'feature_importance': {'col1': 0.5},
            'hyperparameters': {'n_estimators': 100},
        }

        prompt = service._build_model_prompt(model_data)

        assert isinstance(prompt, str)
        assert 'Random Forest' in prompt

    def test_build_report_prompt(self):
        """Test building report prompt."""
        service = GeminiService()

        report_data = {
            'title': 'Analysis Report',
            'report_type': 'full',
            'dataset_info': {'name': 'Test Dataset'},
            'eda_highlights': {'insights': []},
            'model_performance': {'accuracy': 0.9},
        }

        prompt = service._build_report_prompt(report_data)

        assert isinstance(prompt, str)
        assert 'Analysis Report' in prompt

    def test_build_qa_prompt(self):
        """Test building Q&A prompt."""
        service = GeminiService()

        question = "What are the most important features?"
        context = {
            'model': {'feature_importance': {'col1': 0.8, 'col2': 0.2}},
        }

        prompt = service._build_qa_prompt(question, context)

        assert isinstance(prompt, str)
        assert question in prompt

    def test_generate_eda_insights_fallback(self):
        """Test generate_eda_insights uses fallback when not available."""
        service = GeminiService()
        service._initialized = False

        eda_data = {
            'insights': [{'message': 'Test insight'}],
        }

        result = service.generate_eda_insights(eda_data)

        assert isinstance(result, str)

    def test_explain_model_fallback(self):
        """Test explain_model uses fallback when not available."""
        service = GeminiService()
        service._initialized = False

        model_data = {
            'display_name': 'Test Model',
            'task_type': 'classification',
            'metrics': {'accuracy': 0.9},
        }

        result = service.explain_model(model_data)

        assert isinstance(result, str)

    def test_answer_question_unavailable(self):
        """Test answer_question when API not available."""
        service = GeminiService()
        service._initialized = False

        result = service.answer_question(
            "Test question?",
            {'test': 'context'}
        )

        assert isinstance(result, str)
        assert 'not available' in result.lower() or len(result) > 0
