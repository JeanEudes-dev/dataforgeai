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
                self.model = genai.GenerativeModel('gemini-flash-latest')
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
            # Add a 30-second timeout to prevent hanging
            response = self.model.generate_content(
                prompt,
                request_options={"timeout": 30}
            )
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
            response = self.model.generate_content(
                prompt,
                request_options={"timeout": 30}
            )
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
            response = self.model.generate_content(
                prompt,
                request_options={"timeout": 30}
            )
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
            response = self.model.generate_content(
                prompt,
                request_options={"timeout": 30}
            )
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
        """Build prompt for EDA insights generation with optimized data."""
        # Extract and summarize key information compactly
        parts = []

        # Global Metrics
        global_metrics = eda_data.get('global_metrics', {})
        if global_metrics:
            parts.append(f"Dataset: {global_metrics.get('total_rows')} rows, {global_metrics.get('total_columns')} columns.")
            parts.append(f"Quality Score: {global_metrics.get('quality_score', 0)}/100.")
            if global_metrics.get('duplicate_rows', 0) > 0:
                parts.append(f"Duplicates: {global_metrics.get('duplicate_rows')} rows.")

        # Target Analysis
        target_analysis = eda_data.get('target_analysis', {})
        if target_analysis:
            parts.append(f"Target Column: {target_analysis.get('target_column')}")
            parts.append(f"Inferred Task: {target_analysis.get('task_type')}")
            warnings = target_analysis.get('warnings', [])
            if warnings:
                parts.append(f"Target Warnings: {'; '.join(warnings)}")

        # Column summary (only column names and types, not full stats)
        summary_stats = eda_data.get('summary_stats', {})
        if summary_stats:
            cols = list(summary_stats.keys())[:20]
            parts.append(f"Columns analyzed: {', '.join(cols)}")

        # Missing values summary (only columns with missing)
        missing = eda_data.get('missing_analysis', {})
        missing_cols = [(k, v.get('ratio', 0)) for k, v in missing.items() if v.get('ratio', 0) > 0]
        if missing_cols:
            missing_cols.sort(key=lambda x: x[1], reverse=True)
            missing_str = ', '.join([f"{k}:{v:.0%}" for k, v in missing_cols[:5]])
            parts.append(f"Missing values: {missing_str}")

        # Top correlations only
        top_corr = eda_data.get('top_correlations', [])[:5]
        if top_corr:
            corr_str = ', '.join([f"{c['column1']}-{c['column2']}:{c['correlation']:.2f}" for c in top_corr])
            parts.append(f"Top correlations: {corr_str}")

        # Outliers summary
        outliers = eda_data.get('outlier_analysis', {})
        outlier_cols = [(k, v.get('ratio', 0)) for k, v in outliers.items() if v.get('ratio', 0) > 0.01]
        if outlier_cols:
            outlier_str = ', '.join([f"{k}:{v:.1%}" for k, v in outlier_cols[:5]])
            parts.append(f"Columns with outliers: {outlier_str}")

        # Existing rule-based insights (just messages)
        insights = eda_data.get('insights', [])
        if insights:
            insight_msgs = [i.get('message', '')[:80] for i in insights[:5]]
            parts.append(f"Detected issues: {'; '.join(insight_msgs)}")

        context = '\n'.join(parts)

        prompt = f"""Analyze this EDA summary and provide brief insights:

{context}

Provide 3-4 bullet points covering:
- Key data quality issues
- Important patterns or correlations
- Recommendations for next steps

Be concise (max 150 words total)."""

        return prompt

    def _build_model_prompt(self, model_data: dict) -> str:
        """Build prompt for model explanation with optimized data."""
        # Compact metrics
        metrics = model_data.get('metrics', {})
        metrics_str = ', '.join([f"{k}={v:.3f}" for k, v in list(metrics.items())[:5]])

        # Top 5 features only
        features = model_data.get('feature_importance', {})
        top_features = list(features.items())[:5]
        features_str = ', '.join([f"{k}:{v:.2f}" for k, v in top_features]) if top_features else "N/A"

        prompt = f"""Explain this ML model briefly:

Model: {model_data.get('display_name', 'Unknown')} ({model_data.get('algorithm_type', '?')})
Task: {model_data.get('task_type', 'Unknown')}
Metrics: {metrics_str}
Top features: {features_str}

In 3-4 sentences, explain:
- How well the model performs
- What the key metrics mean
- Which features matter most

Keep it simple for non-technical users (max 100 words)."""

        return prompt

    def _build_report_prompt(self, report_data: dict) -> str:
        """Build prompt for report summary generation with optimized data."""
        # Compact dataset info
        ds = report_data.get('dataset_info', {})
        ds_str = f"{ds.get('name', '?')}, {ds.get('rows', '?')} rows, {ds.get('columns', '?')} cols"

        # Key EDA points
        eda = report_data.get('eda_highlights', {})
        eda_parts = []
        if eda.get('missing_ratio'):
            eda_parts.append(f"Missing: {eda['missing_ratio']:.0%}")
        if eda.get('top_correlation'):
            eda_parts.append(f"Top corr: {eda['top_correlation']:.2f}")
        eda_str = ', '.join(eda_parts) if eda_parts else "N/A"

        # Model summary
        model = report_data.get('model_performance', {})
        model_str = f"{model.get('algorithm', '?')}, score={model.get('score', 0):.2f}" if model else "N/A"

        prompt = f"""Write a brief executive summary:

Report: {report_data.get('title', 'Analysis Report')}
Dataset: {ds_str}
EDA: {eda_str}
Model: {model_str}

Write 2-3 short paragraphs (max 120 words) covering key findings and recommendations."""

        return prompt

    def _build_qa_prompt(self, question: str, context: dict) -> str:
        """Build prompt for Q&A with optimized context."""
        # Extract only essential information to reduce token usage
        summary = self._summarize_context(context)

        prompt = f"""Answer this question about a data analysis project.

{summary}

Question: {question}

Instructions:
- Answer based only on the provided context
- If you cannot answer from the context, say so clearly
- Keep the answer concise (2-3 sentences max)
- Use simple language"""

        return prompt

    def _summarize_context(self, context: dict) -> str:
        """Create a compact but rich summary of context for the AI."""
        parts = []

        # Dataset info
        if 'dataset' in context:
            ds = context['dataset']
            parts.append(f"Dataset: {ds.get('name', 'Unknown')}, {ds.get('row_count', '?')} rows, {ds.get('column_count', '?')} columns")

            # Include column names from schema if available
            schema = ds.get('schema', {})
            if schema and isinstance(schema, dict):
                col_names = list(schema.keys())[:15]
                if col_names:
                    parts.append(f"Columns: {', '.join(col_names)}")

        # EDA summary - now much richer
        if 'eda' in context:
            eda = context['eda']

            # Include AI-generated insights if available (these are pre-summarized)
            if eda.get('ai_insights'):
                parts.append(f"\nAI Analysis Summary:\n{eda['ai_insights'][:500]}")

            # Column statistics summaries
            if eda.get('column_summaries'):
                summaries = eda['column_summaries'][:10]
                parts.append(f"\nColumn Statistics:\n" + '\n'.join(f"- {s}" for s in summaries))

            # Rule-based insights
            if eda.get('insights'):
                insights = [i.get('message', '')[:100] for i in eda['insights'][:5]]
                parts.append(f"\nKey Findings:\n" + '\n'.join(f"- {i}" for i in insights))

            # Top correlations
            if eda.get('top_correlations'):
                corrs = eda['top_correlations'][:5]
                corr_strs = [f"{c['column1']} & {c['column2']}: {c['correlation']:.2f} ({c.get('strength', 'moderate')})" for c in corrs]
                parts.append(f"\nTop Correlations:\n" + '\n'.join(f"- {s}" for s in corr_strs))

            # Missing values
            if eda.get('missing_summary'):
                missing = eda['missing_summary'][:5]
                if missing:
                    missing_strs = [f"{m['column']}: {m['ratio']:.1f}% missing" for m in missing]
                    parts.append(f"\nMissing Values:\n" + '\n'.join(f"- {s}" for s in missing_strs))

            # Outliers
            if eda.get('outlier_summary'):
                outliers = eda['outlier_summary'][:5]
                if outliers:
                    outlier_strs = [f"{o['column']}: {o['ratio']:.1f}% outliers" for o in outliers]
                    parts.append(f"\nOutliers Detected:\n" + '\n'.join(f"- {s}" for s in outlier_strs))

            # Data quality score
            if eda.get('data_quality_score'):
                score = eda['data_quality_score']
                quality = "excellent" if score >= 80 else "good" if score >= 60 else "needs improvement"
                parts.append(f"\nData Quality Score: {score}/100 ({quality})")

        # Model summary
        if 'model' in context:
            m = context['model']
            model_name = m.get('name', m.get('display_name', m.get('algorithm', 'Unknown')))
            parts.append(f"\nModel: {model_name}")
            parts.append(f"Task Type: {m.get('task_type', 'Unknown')}")

            metrics = m.get('metrics', {})
            if metrics:
                # Format metrics nicely
                metric_lines = []
                for k, v in list(metrics.items())[:8]:
                    if k not in ['confusion_matrix', 'roc_curve', 'confusion_matrix_labels', 'cv_scores']:
                        if isinstance(v, float):
                            if k in ['accuracy', 'f1', 'f1_weighted', 'precision', 'recall', 'r2', 'roc_auc']:
                                metric_lines.append(f"- {k}: {v*100:.1f}%")
                            else:
                                metric_lines.append(f"- {k}: {v:.4f}")
                if metric_lines:
                    parts.append(f"\nModel Performance:\n" + '\n'.join(metric_lines))

            # Feature importance
            fi = m.get('feature_importance', {})
            if fi:
                if isinstance(fi, dict):
                    top_features = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:5]
                    fi_strs = [f"{name}: {imp:.3f}" for name, imp in top_features]
                elif isinstance(fi, list):
                    fi_strs = [f"{f.get('name', '?')}: {f.get('importance', 0):.3f}" for f in fi[:5]]
                else:
                    fi_strs = []
                if fi_strs:
                    parts.append(f"\nTop Important Features:\n" + '\n'.join(f"- {s}" for s in fi_strs))

        return '\n'.join(parts) if parts else "No context available."

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
