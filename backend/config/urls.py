"""
URL configuration for DataForge AI.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint."""
    return Response({
        'status': 'healthy',
        'service': 'DataForge AI',
        'version': '1.0.0',
    })


# API v1 URL patterns
api_v1_patterns = [
    path('health/', health_check, name='health_check'),
    path('core/', include('apps.core.urls', namespace='core')),
    path('auth/', include('apps.users.urls', namespace='users')),
    path('datasets/', include('apps.datasets.urls', namespace='datasets')),
    path('eda/', include('apps.eda.urls', namespace='eda')),
    path('ml/', include('apps.ml.urls', namespace='ml')),
    path('predictions/', include('apps.predictions.urls', namespace='predictions')),
    path('reports/', include('apps.reports.urls', namespace='reports')),
    path('assistant/', include('apps.assistant.urls', namespace='assistant')),
]

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/', include((api_v1_patterns, 'api_v1'))),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
