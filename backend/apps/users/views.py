"""
Views for the users app.
"""

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view that uses our custom serializer."""

    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new user.

    POST /api/v1/auth/register/
    """

    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            'detail': 'User registered successfully.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update the current user's profile.

    GET /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    Change the current user's password.

    POST /api/v1/auth/change-password/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({
            'detail': 'Password changed successfully.'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Logout by blacklisting the refresh token.

    POST /api/v1/auth/logout/
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({
                    'detail': 'Successfully logged out.'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'detail': 'Refresh token is required.',
                    'code': 'REFRESH_TOKEN_REQUIRED',
                    'meta': {}
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'detail': 'Invalid token.',
                'code': 'INVALID_TOKEN',
                'meta': {}
            }, status=status.HTTP_400_BAD_REQUEST)
