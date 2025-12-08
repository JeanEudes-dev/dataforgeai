"""
Gemini AI Service.

Handles integration with Google's Gemini API for AI-powered insights.
"""

import json
import logging
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning('google-generativeai not installed. AI features will be disabled.')


class GeminiService:
    """
    Service for interacting with Google's Gemini API.

    Provides AI-powered features:
    - EDA insights generation
    - Model explanation
    - Report summaries
    - Natural language Q&A
    """

    def __init__(self):
        self.model = None
        self._initialized = False

        if GEMINI_AVAILABLE and hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                self._initialized = True
            except Exception as e:
                logger.error(f'Failed to initialize Gemini: {e}')

    @property
    def is_available(self) -> bool:
        """Check if Gemini is available and configured."""
        return self._initialized and self.model is not None

    def generate_eda_insights(self, eda_data: dict) -> str:
        """
        Generate natural language insights from EDA results.

        Args:
            eda_data: Dictionary containing EDA analysis results

        Returns:
            Generated insights text
        """
        if not self.is_available:
            return self._fallback_eda_insights(eda_data)

        prompt = self._build_eda_prompt(eda_data)

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f'Gemini EDA insights generation failed: {e}')
            return self._fallback_eda_insights(eda_data)

    def explain_model(self, model_data: dict) -> str:
        """
        Generate explanation for a trained model.

        Args:
            model_data: Dictionary containing model info and metrics

        Returns:
            Generated explanation text
        """
        if not self.is_available:
            return self._fallback_model_explanation(model_data)

        prompt = self._build_model_prompt(model_data)

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f'Gemini model explanation failed: {e}')
            return self._fallback_model_explanation(model_data)

    def generate_report_summary(self, report_data: dict) -> str:
        """
        Generate executive summary for a report.

        Args:
            report_data: Dictionary containing report content

        Returns:
            Generated summary text
        """
        if not self.is_available:
            return self._fallback_report_summary(report_data)

        prompt = self._build_report_prompt(report_data)

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f'Gemini report summary failed: {e}')
            return self._fallback_report_summary(report_data)

    def answer_question(self, question: str, context: dict) -> str:
        """
        Answer a natural language question about data/models.

        Args:
            question: User's question
            context: Context data (dataset info, EDA results, model metrics)

        Returns:
            Generated answer
        """
        if not self.is_available:
            return "AI assistant is not available. Please configure the Gemini API key."

        prompt = self._build_qa_prompt(question, context)

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f'Gemini Q&A failed: {e}')
            return f"Sorry, I couldn't process your question. Error: {str(e)}"

    def explain_metric(self, metric_name: str, metric_value: float, task_type: str) -> str:
        """
        Explain what a specific metric means.

        Args:
            metric_name: Name of the metric (e.g., 'f1', 'rmse')
            metric_value: The metric value
            task_type: 'classification' or 'regression'

        Returns:
            Explanation text
        """
        if not self.is_available:
            return self._fallback_metric_explanation(metric_name, metric_value, task_type)

        prompt = f"""Explain the following machine learning metric in simple terms:

Metric: {metric_name}
Value: {metric_value}
Task Type: {task_type}

Provide:
1. What this metric measures
2. How to interpret the value (is it good/bad?)
3. What actions to consider based on this value

Keep the explanation concise and accessible to non-technical users."""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f'Gemini metric explanation failed: {e}')
            return self._fallback_metric_explanation(metric_name, metric_value, task_type)

    def _build_eda_prompt(self, eda_data: dict) -> str:
        """Build prompt for EDA insights generation."""
        # Extract key information
        summary_stats = eda_data.get('summary_stats', {})
        missing_analysis = eda_data.get('missing_analysis', {})
        correlations = eda_data.get('correlation_matrix', {})
        outliers = eda_data.get('outlier_analysis', {})
        insights = eda_data.get('insights', [])

        prompt = f"""Analyze the following exploratory data analysis results and provide actionable insights.

Dataset Summary Statistics:
{json.dumps(summary_stats, indent=2)[:2000]}

Missing Value Analysis:
{json.dumps(missing_analysis, indent=2)[:500]}

Key Correlations:
{json.dumps(correlations, indent=2)[:500]}

Outlier Analysis:
{json.dumps(outliers, indent=2)[:500]}

Rule-based Insights:
{json.dumps(insights, indent=2)[:500]}

Please provide:
1. Key findings from the data
2. Data quality issues to address
3. Potential feature engineering opportunities
4. Recommendations for modeling

Keep the response concise but comprehensive. Use bullet points for clarity."""

        return prompt

    def _build_model_prompt(self, model_data: dict) -> str:
        """Build prompt for model explanation."""
        prompt = f"""Explain the following trained machine learning model:

Model Name: {model_data.get('display_name', 'Unknown')}
Algorithm: {model_data.get('algorithm_type', 'Unknown')}
Task Type: {model_data.get('task_type', 'Unknown')}

Metrics:
{json.dumps(model_data.get('metrics', {}), indent=2)}

Feature Importance (top 10):
{json.dumps(dict(list(model_data.get('feature_importance', {}).items())[:10]), indent=2)}

Hyperparameters:
{json.dumps(model_data.get('hyperparameters', {}), indent=2)}

Please provide:
1. Why this model was selected
2. What the metrics indicate about performance
3. Which features are most important and why
4. Recommendations for improving the model

Keep the explanation accessible to non-technical stakeholders."""

        return prompt

    def _build_report_prompt(self, report_data: dict) -> str:
        """Build prompt for report summary generation."""
        prompt = f"""Generate an executive summary for the following data analysis report:

Report Title: {report_data.get('title', 'Data Analysis Report')}
Report Type: {report_data.get('report_type', 'analysis')}

Dataset Information:
{json.dumps(report_data.get('dataset_info', {}), indent=2)[:500]}

EDA Highlights:
{json.dumps(report_data.get('eda_highlights', {}), indent=2)[:1000]}

Model Performance:
{json.dumps(report_data.get('model_performance', {}), indent=2)[:500]}

Please provide a 3-5 paragraph executive summary covering:
1. Dataset overview and quality
2. Key findings from the analysis
3. Model performance and recommendations
4. Next steps and actionable insights

Write in a professional tone suitable for business stakeholders."""

        return prompt

    def _build_qa_prompt(self, question: str, context: dict) -> str:
        """Build prompt for Q&A."""
        prompt = f"""Answer the following question about a dataset and/or machine learning model.

Context:
{json.dumps(context, indent=2)[:3000]}

Question: {question}

Instructions:
- Answer based only on the provided context
- If you cannot answer from the context, say so clearly
- Keep the answer concise and actionable
- Use simple language accessible to non-technical users"""

        return prompt

    def _fallback_eda_insights(self, eda_data: dict) -> str:
        """Provide fallback insights when Gemini is not available."""
        insights = eda_data.get('insights', [])
        if insights:
            insight_text = '\n'.join([f"- {i.get('message', '')}" for i in insights[:5]])
            return f"Key findings from the analysis:\n{insight_text}"
        return "EDA analysis complete. Review the statistics and visualizations for insights."

    def _fallback_model_explanation(self, model_data: dict) -> str:
        """Provide fallback explanation when Gemini is not available."""
        metrics = model_data.get('metrics', {})
        task_type = model_data.get('task_type', '')

        if task_type == 'classification':
            primary = metrics.get('f1_weighted', metrics.get('accuracy', 0))
            return f"Model trained with F1 score of {primary:.2%}. Review metrics for details."
        else:
            rmse = metrics.get('rmse', 0)
            r2 = metrics.get('r2', 0)
            return f"Model trained with RMSE of {rmse:.4f} and R² of {r2:.2%}."

    def _fallback_report_summary(self, report_data: dict) -> str:
        """Provide fallback summary when Gemini is not available."""
        return "Report generated successfully. Review the detailed sections for insights."

    def _fallback_metric_explanation(
        self,
        metric_name: str,
        metric_value: float,
        task_type: str
    ) -> str:
        """Provide fallback metric explanation."""
        explanations = {
            'accuracy': f"Accuracy of {metric_value:.2%} means the model correctly predicts {metric_value:.2%} of cases.",
            'f1': f"F1 score of {metric_value:.2%} represents the balance between precision and recall.",
            'f1_weighted': f"Weighted F1 of {metric_value:.2%} accounts for class imbalance in predictions.",
            'precision': f"Precision of {metric_value:.2%} indicates the accuracy of positive predictions.",
            'recall': f"Recall of {metric_value:.2%} shows the proportion of actual positives identified.",
            'rmse': f"RMSE of {metric_value:.4f} represents the average prediction error magnitude.",
            'mae': f"MAE of {metric_value:.4f} is the average absolute prediction error.",
            'r2': f"R² of {metric_value:.2%} indicates how well the model explains variance in the data.",
        }

        return explanations.get(
            metric_name.lower(),
            f"{metric_name}: {metric_value}"
        )
