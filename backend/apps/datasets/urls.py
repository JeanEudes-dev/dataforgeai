"""
URL configuration for the datasets app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DatasetViewSet

app_name = 'datasets'

router = DefaultRouter()
router.register('', DatasetViewSet, basename='dataset')

urlpatterns = [
    path('', include(router.urls)),
]
