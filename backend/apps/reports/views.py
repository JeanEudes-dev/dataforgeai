"""
Views for the Reports app.
"""

import logging

from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.core.exceptions import DatasetNotFoundError, ReportNotFoundError
from apps.datasets.models import Dataset
from apps.eda.models import EDAResult
from apps.ml.models import TrainedModel

from .models import Report
from .serializers import (
    ReportCreateSerializer,
    ReportDetailSerializer,
    ReportListSerializer,
    SharedReportSerializer,
)
from .services import ReportGeneratorService
from .services.pdf_generator import PDFGeneratorService

logger = logging.getLogger(__name__)


class ReportViewSet(ReadOnlyModelViewSet):
    """
    ViewSet for reports.

    Provides read operations for reports:
    - list: GET /api/v1/reports/
    - retrieve: GET /api/v1/reports/{id}/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return reports owned by the current user."""
        return Report.objects.filter(
            owner=self.request.user
        ).select_related('dataset', 'trained_model')

    def get_serializer_class(self):
        if self.action == 'list':
            return ReportListSerializer
        return ReportDetailSerializer

    def destroy(self, request, *args, **kwargs):
        """Delete a report."""
        try:
            report = self.get_object()
            report_id = str(report.id)
            report.delete()

            logger.info(f'Report {report_id} deleted by user {request.user.email}')

            return Response(
                {'detail': 'Report deleted successfully.'},
                status=status.HTTP_200_OK
            )
        except Report.DoesNotExist:
            raise ReportNotFoundError()

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """
        Export report in specified format.

        GET /api/v1/reports/{id}/export/?format=pdf
        """
        report = self.get_object()
        export_format = request.query_params.get('format', 'pdf').lower()

        # Only PDF format is currently supported
        if export_format != 'pdf':
            return Response(
                {
                    'detail': f'Unsupported export format: {export_format}',
                    'code': 'UNSUPPORTED_FORMAT',
                    'meta': {'supported_formats': ['pdf']}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check report is ready
        if report.status != Report.Status.COMPLETED:
            return Response(
                {
                    'detail': 'Report is not ready for export.',
                    'code': 'REPORT_NOT_READY',
                    'meta': {'status': report.status}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            generator = PDFGeneratorService()
            pdf_content = generator.generate_pdf(report)

            # Create HTTP response with PDF
            response = HttpResponse(
                pdf_content,
                content_type='application/pdf'
            )

            # Generate safe filename
            safe_title = ''.join(
                c if c.isalnum() or c in ' -_' else '_'
                for c in report.title
            ).strip().replace(' ', '_')
            filename = f'{safe_title}.pdf'

            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            logger.info(
                f'Report {report.id} exported as PDF by user {request.user.email}'
            )

            return response

        except Exception as e:
            logger.error(f'PDF export failed for report {report.id}: {e}')
            return Response(
                {
                    'detail': 'Failed to generate PDF.',
                    'code': 'PDF_GENERATION_ERROR',
                    'meta': {'error': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """
        Toggle sharing for a report.

        POST /api/v1/reports/{id}/share/
        Body: { "enable": true/false }

        Returns share token and URL when enabled.
        """
        report = self.get_object()
        enable = request.data.get('enable', True)

        if enable:
            # Generate share token if not exists
            report.generate_share_token()
            report.is_public = True
            report.save()

            logger.info(f'Report {report.id} shared by user {request.user.email}')

            return Response({
                'share_token': report.share_token,
                'share_url': report.share_url,
                'is_public': True,
                'detail': 'Report is now publicly accessible via the share link.',
            })
        else:
            # Disable sharing (keep token for potential re-enable)
            report.is_public = False
            report.save()

            logger.info(f'Report {report.id} unshared by user {request.user.email}')

            return Response({
                'share_token': None,
                'share_url': None,
                'is_public': False,
                'detail': 'Report is no longer publicly accessible.',
            })


class SharedReportView(APIView):
    """
    Public view for shared reports.

    GET /api/v1/reports/shared/{share_token}/

    No authentication required - uses share token for access.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, share_token):
        """Retrieve a publicly shared report."""
        try:
            report = Report.objects.select_related(
                'dataset'
            ).get(
                share_token=share_token,
                is_public=True,
                status=Report.Status.COMPLETED
            )

            serializer = SharedReportSerializer(report)

            logger.info(f'Shared report {report.id} accessed via token')

            return Response(serializer.data)

        except Report.DoesNotExist:
            return Response(
                {
                    'detail': 'Report not found or not publicly shared.',
                    'code': 'REPORT_NOT_FOUND',
                },
                status=status.HTTP_404_NOT_FOUND
            )


class GenerateReportView(APIView):
    """
    Generate a new report.

    POST /api/v1/reports/generate/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dataset_id = serializer.validated_data['dataset_id']
        report_type = serializer.validated_data.get('report_type', Report.ReportType.FULL)
        title = serializer.validated_data.get('title')
        eda_result_id = serializer.validated_data.get('eda_result_id')
        model_id = serializer.validated_data.get('model_id')

        # Get the dataset and verify ownership
        try:
            dataset = Dataset.objects.get(
                id=dataset_id,
                owner=request.user
            )
        except Dataset.DoesNotExist:
            raise DatasetNotFoundError()

        # Get optional related objects
        eda_result = None
        trained_model = None

        if eda_result_id:
            try:
                eda_result = EDAResult.objects.get(
                    id=eda_result_id,
                    dataset=dataset
                )
            except EDAResult.DoesNotExist:
                return Response(
                    {
                        'detail': 'EDA result not found.',
                        'code': 'EDA_NOT_FOUND',
                        'meta': {}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

        if model_id:
            try:
                trained_model = TrainedModel.objects.get(
                    id=model_id,
                    owner=request.user
                )
            except TrainedModel.DoesNotExist:
                return Response(
                    {
                        'detail': 'Model not found.',
                        'code': 'MODEL_NOT_FOUND',
                        'meta': {}
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

        # Auto-generate title if not provided
        if not title:
            title = f"{dataset.name} - {report_type.capitalize()} Report"

        # Create report
        report = Report.objects.create(
            owner=request.user,
            dataset=dataset,
            eda_result=eda_result,
            trained_model=trained_model,
            title=title,
            report_type=report_type,
        )

        # Generate report content
        try:
            generator = ReportGeneratorService()
            report = generator.generate_report(report)

            logger.info(
                f'Report {report.id} generated for dataset {dataset_id} '
                f'by user {request.user.email}'
            )

            return Response(
                ReportDetailSerializer(report).data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f'Report generation failed: {str(e)}')
            return Response(
                {
                    'detail': 'Report generation failed.',
                    'code': 'GENERATION_ERROR',
                    'meta': {'error': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DatasetReportsView(APIView):
    """
    Get reports for a specific dataset.

    GET /api/v1/reports/dataset/{dataset_id}/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, dataset_id):
        # Verify dataset ownership
        try:
            dataset = Dataset.objects.get(
                id=dataset_id,
                owner=request.user
            )
        except Dataset.DoesNotExist:
            raise DatasetNotFoundError()

        reports = Report.objects.filter(
            dataset=dataset
        ).order_by('-created_at')

        serializer = ReportListSerializer(reports, many=True)

        return Response({
            'dataset_id': str(dataset_id),
            'dataset_name': dataset.name,
            'reports': serializer.data,
            'count': reports.count(),
        })
