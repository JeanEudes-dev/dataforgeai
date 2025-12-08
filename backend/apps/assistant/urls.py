"""
URL configuration for the assistant app.
"""

from django.urls import path

from .views import (
    AskQuestionView,
    AssistantStatusView,
    ExplainMetricView,
)

app_name = 'assistant'

urlpatterns = [
    # Ask a question
    path('ask/', AskQuestionView.as_view(), name='ask'),

    # Explain a metric
    path('explain/', ExplainMetricView.as_view(), name='explain'),

    # Check assistant status
    path('status/', AssistantStatusView.as_view(), name='status'),
]
