"""
URL configuration for the reports app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DatasetReportsView,
    GenerateReportView,
    ReportViewSet,
    SharedReportView,
)

app_name = 'reports'

router = DefaultRouter()
router.register('', ReportViewSet, basename='report')

urlpatterns = [
    # Generate a new report
    path('generate/', GenerateReportView.as_view(), name='generate'),

    # Reports for a specific dataset
    path('dataset/<uuid:dataset_id>/', DatasetReportsView.as_view(), name='dataset-reports'),

    # Publicly shared reports (no authentication required)
    path('shared/<str:share_token>/', SharedReportView.as_view(), name='shared-report'),

    # Router URLs
    path('', include(router.urls)),
]
