"""
URL configuration for the EDA app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DatasetEDAListView,
    EDAResultViewSet,
    LatestEDAView,
    TriggerEDAView,
)

app_name = 'eda'

router = DefaultRouter()
router.register('results', EDAResultViewSet, basename='eda-result')

urlpatterns = [
    # Trigger EDA
    path('', TriggerEDAView.as_view(), name='trigger'),

    # EDA results for a specific dataset
    path('dataset/<uuid:dataset_id>/', DatasetEDAListView.as_view(), name='dataset-list'),
    path('dataset/<uuid:dataset_id>/latest/', LatestEDAView.as_view(), name='dataset-latest'),

    # EDA result CRUD via router
    path('', include(router.urls)),
]
