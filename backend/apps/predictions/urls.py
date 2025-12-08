"""
URL configuration for the predictions app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BatchPredictView,
    ModelPredictionsView,
    PredictionJobViewSet,
    PredictView,
)

app_name = 'predictions'

router = DefaultRouter()
router.register('jobs', PredictionJobViewSet, basename='prediction-job')

urlpatterns = [
    # Single prediction (JSON input)
    path('predict/', PredictView.as_view(), name='predict'),

    # Batch prediction (file upload)
    path('batch/', BatchPredictView.as_view(), name='batch-predict'),

    # Predictions for a specific model
    path('model/<uuid:model_id>/', ModelPredictionsView.as_view(), name='model-predictions'),

    # Router URLs
    path('', include(router.urls)),
]
