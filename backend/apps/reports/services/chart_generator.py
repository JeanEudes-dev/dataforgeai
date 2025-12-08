"""
Chart Generator Service.

Generates matplotlib charts for PDF reports.
"""

import base64
import io
import logging
from typing import Any

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server
import matplotlib.pyplot as plt
import numpy as np

logger = logging.getLogger(__name__)


class ChartGeneratorService:
    """
    Service for generating charts for PDF reports.

    Creates matplotlib charts and returns them as base64-encoded PNG images.
    """

    # Chart style settings
    FIGURE_DPI = 100
    FIGURE_SIZE = (8, 5)
    COLOR_PRIMARY = '#3498db'
    COLOR_SECONDARY = '#e74c3c'
    COLOR_ACCENT = '#2ecc71'
    FONT_SIZE = 10

    def __init__(self):
        # Set consistent style
        plt.style.use('seaborn-v0_8-whitegrid')
        plt.rcParams['font.size'] = self.FONT_SIZE

    def _fig_to_base64(self, fig: plt.Figure) -> str:
        """Convert matplotlib figure to base64 string."""
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=self.FIGURE_DPI, bbox_inches='tight')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        return f'data:image/png;base64,{img_base64}'

    def generate_distribution_chart(
        self,
        data: dict,
        title: str = 'Distribution'
    ) -> str:
        """
        Generate a histogram distribution chart.

        Args:
            data: Dict with 'bins' and 'counts' for numeric,
                  or 'labels' and 'counts' for categorical
            title: Chart title

        Returns:
            Base64-encoded PNG image
        """
        try:
            fig, ax = plt.subplots(figsize=self.FIGURE_SIZE)

            if 'bins' in data:
                # Numeric distribution (histogram)
                bins = data['bins']
                counts = data['counts']
                ax.bar(bins[:-1], counts, width=np.diff(bins),
                       color=self.COLOR_PRIMARY, alpha=0.7, edgecolor='white')
                ax.set_xlabel('Value')
            else:
                # Categorical distribution (bar chart)
                labels = data.get('labels', [])[:15]  # Limit to 15
                counts = data.get('counts', [])[:15]
                ax.barh(labels, counts, color=self.COLOR_PRIMARY, alpha=0.7)
                ax.invert_yaxis()  # Top to bottom
                ax.set_xlabel('Count')

            ax.set_title(title, fontsize=12, fontweight='bold')
            ax.set_ylabel('Frequency')

            return self._fig_to_base64(fig)

        except Exception as e:
            logger.error(f'Failed to generate distribution chart: {e}')
            return ''

    def generate_correlation_heatmap(
        self,
        correlation_matrix: dict,
        title: str = 'Correlation Matrix'
    ) -> str:
        """
        Generate a correlation heatmap.

        Args:
            correlation_matrix: Dict of {col: {col: corr_value}}
            title: Chart title

        Returns:
            Base64-encoded PNG image
        """
        try:
            # Convert dict to numpy array
            columns = list(correlation_matrix.keys())
            n = len(columns)

            if n == 0:
                return ''

            matrix = np.zeros((n, n))
            for i, col1 in enumerate(columns):
                for j, col2 in enumerate(columns):
                    matrix[i, j] = correlation_matrix.get(col1, {}).get(col2, 0)

            # Limit size for readability
            max_cols = 12
            if n > max_cols:
                columns = columns[:max_cols]
                matrix = matrix[:max_cols, :max_cols]
                n = max_cols

            fig, ax = plt.subplots(figsize=(max(8, n * 0.8), max(6, n * 0.6)))

            im = ax.imshow(matrix, cmap='RdBu_r', aspect='auto', vmin=-1, vmax=1)
            fig.colorbar(im, ax=ax, label='Correlation')

            ax.set_xticks(range(n))
            ax.set_yticks(range(n))
            ax.set_xticklabels(columns, rotation=45, ha='right', fontsize=8)
            ax.set_yticklabels(columns, fontsize=8)
            ax.set_title(title, fontsize=12, fontweight='bold')

            # Add correlation values as text
            if n <= 10:
                for i in range(n):
                    for j in range(n):
                        text_color = 'white' if abs(matrix[i, j]) > 0.5 else 'black'
                        ax.text(j, i, f'{matrix[i, j]:.2f}', ha='center', va='center',
                                color=text_color, fontsize=7)

            plt.tight_layout()
            return self._fig_to_base64(fig)

        except Exception as e:
            logger.error(f'Failed to generate correlation heatmap: {e}')
            return ''

    def generate_feature_importance_chart(
        self,
        feature_importance: dict,
        title: str = 'Feature Importance',
        top_n: int = 15
    ) -> str:
        """
        Generate a horizontal bar chart for feature importance.

        Args:
            feature_importance: Dict of {feature: importance}
            title: Chart title
            top_n: Number of top features to show

        Returns:
            Base64-encoded PNG image
        """
        try:
            if not feature_importance:
                return ''

            # Sort and take top N
            sorted_features = sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:top_n]

            features = [f[0] for f in sorted_features]
            importances = [f[1] for f in sorted_features]

            fig, ax = plt.subplots(figsize=self.FIGURE_SIZE)

            # Horizontal bar chart
            y_pos = np.arange(len(features))
            ax.barh(y_pos, importances, color=self.COLOR_PRIMARY, alpha=0.8)
            ax.set_yticks(y_pos)
            ax.set_yticklabels(features, fontsize=8)
            ax.invert_yaxis()  # Largest on top
            ax.set_xlabel('Importance')
            ax.set_title(title, fontsize=12, fontweight='bold')

            plt.tight_layout()
            return self._fig_to_base64(fig)

        except Exception as e:
            logger.error(f'Failed to generate feature importance chart: {e}')
            return ''

    def generate_roc_curve(
        self,
        roc_data: dict,
        title: str = 'ROC Curve'
    ) -> str:
        """
        Generate an ROC curve chart.

        Args:
            roc_data: Dict with 'fpr', 'tpr', and optionally 'roc_auc'
            title: Chart title

        Returns:
            Base64-encoded PNG image
        """
        try:
            fpr = roc_data.get('fpr', [])
            tpr = roc_data.get('tpr', [])
            auc = roc_data.get('roc_auc')

            if not fpr or not tpr:
                return ''

            fig, ax = plt.subplots(figsize=self.FIGURE_SIZE)

            # ROC curve
            label = f'ROC curve (AUC = {auc:.3f})' if auc else 'ROC curve'
            ax.plot(fpr, tpr, color=self.COLOR_PRIMARY, lw=2, label=label)

            # Diagonal line (random classifier)
            ax.plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--',
                    label='Random classifier')

            ax.set_xlim([0.0, 1.0])
            ax.set_ylim([0.0, 1.05])
            ax.set_xlabel('False Positive Rate')
            ax.set_ylabel('True Positive Rate')
            ax.set_title(title, fontsize=12, fontweight='bold')
            ax.legend(loc='lower right')

            plt.tight_layout()
            return self._fig_to_base64(fig)

        except Exception as e:
            logger.error(f'Failed to generate ROC curve: {e}')
            return ''

    def generate_confusion_matrix_chart(
        self,
        confusion_matrix: list,
        labels: list = None,
        title: str = 'Confusion Matrix'
    ) -> str:
        """
        Generate a confusion matrix heatmap.

        Args:
            confusion_matrix: 2D list of values
            labels: List of class labels
            title: Chart title

        Returns:
            Base64-encoded PNG image
        """
        try:
            matrix = np.array(confusion_matrix)
            n = matrix.shape[0]

            if labels is None:
                labels = [str(i) for i in range(n)]

            fig, ax = plt.subplots(figsize=(max(6, n), max(5, n * 0.8)))

            im = ax.imshow(matrix, cmap='Blues')
            fig.colorbar(im, ax=ax, label='Count')

            ax.set_xticks(range(n))
            ax.set_yticks(range(n))
            ax.set_xticklabels(labels)
            ax.set_yticklabels(labels)
            ax.set_xlabel('Predicted')
            ax.set_ylabel('Actual')
            ax.set_title(title, fontsize=12, fontweight='bold')

            # Add values as text
            for i in range(n):
                for j in range(n):
                    text_color = 'white' if matrix[i, j] > matrix.max() / 2 else 'black'
                    ax.text(j, i, str(int(matrix[i, j])), ha='center', va='center',
                            color=text_color, fontsize=10)

            plt.tight_layout()
            return self._fig_to_base64(fig)

        except Exception as e:
            logger.error(f'Failed to generate confusion matrix chart: {e}')
            return ''

    def generate_missing_values_chart(
        self,
        missing_data: list,
        title: str = 'Missing Values by Column'
    ) -> str:
        """
        Generate a bar chart showing missing values per column.

        Args:
            missing_data: List of dicts with 'column', 'ratio' keys
            title: Chart title

        Returns:
            Base64-encoded PNG image
        """
        try:
            if not missing_data:
                return ''

            # Filter to columns with missing values and limit
            missing_data = [d for d in missing_data if d.get('ratio', 0) > 0][:15]

            if not missing_data:
                return ''

            columns = [d['column'] for d in missing_data]
            ratios = [d['ratio'] * 100 for d in missing_data]  # Convert to percentage

            fig, ax = plt.subplots(figsize=self.FIGURE_SIZE)

            ax.barh(columns, ratios, color=self.COLOR_SECONDARY, alpha=0.7)
            ax.invert_yaxis()
            ax.set_xlabel('Missing (%)')
            ax.set_title(title, fontsize=12, fontweight='bold')
            ax.set_xlim([0, 100])

            plt.tight_layout()
            return self._fig_to_base64(fig)

        except Exception as e:
            logger.error(f'Failed to generate missing values chart: {e}')
            return ''
