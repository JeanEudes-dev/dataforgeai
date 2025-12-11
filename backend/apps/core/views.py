from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

from apps.datasets.models import Dataset
from apps.ml.models import TrainedModel
from apps.reports.models import Report


class DashboardStatsView(APIView):
    """
    API view to retrieve dashboard statistics.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get dashboard statistics",
        description="Returns counts of datasets, models, and reports for the current user.",
        responses={
            200: inline_serializer(
                name='DashboardStats',
                fields={
                    'datasets_count': serializers.IntegerField(),
                    'models_count': serializers.IntegerField(),
                    'reports_count': serializers.IntegerField(),
                }
            )
        }
    )
    def get(self, request):
        user = request.user
        
        datasets_count = Dataset.objects.filter(owner=user).count()
        models_count = TrainedModel.objects.filter(training_job__owner=user).count()
        reports_count = Report.objects.filter(owner=user).count()
        
        return Response({
            'datasets_count': datasets_count,
            'models_count': models_count,
            'reports_count': reports_count,
        })
