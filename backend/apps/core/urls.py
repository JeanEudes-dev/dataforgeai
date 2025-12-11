from django.urls import path
from apps.core.views import DashboardStatsView

app_name = 'core'

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
