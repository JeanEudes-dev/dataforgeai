"""
URL configuration for the ML app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DatasetModelsView,
    TrainedModelViewSet,
    TrainingJobViewSet,
    TriggerTrainingView,
)

app_name = 'ml'

router = DefaultRouter()
router.register('jobs', TrainingJobViewSet, basename='training-job')
router.register('models', TrainedModelViewSet, basename='trained-model')

urlpatterns = [
    # Trigger training
    path('train/', TriggerTrainingView.as_view(), name='train'),

    # Models for a specific dataset
    path('dataset/<uuid:dataset_id>/models/', DatasetModelsView.as_view(), name='dataset-models'),

    # Router URLs
    path('', include(router.urls)),
]
