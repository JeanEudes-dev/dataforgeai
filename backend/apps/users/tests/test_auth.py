"""
Tests for user authentication endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.users.models import User


@pytest.mark.django_db
class TestUserRegistration:
    """Tests for user registration endpoint."""

    def test_register_user_success(self, api_client):
        """Test successful user registration."""
        url = reverse('api_v1:users:register')
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'tokens' in response.data
        assert response.data['user']['email'] == 'newuser@example.com'
        assert 'password' not in response.data['user']
        assert User.objects.filter(email='newuser@example.com').exists()

    def test_register_user_password_mismatch(self, api_client):
        """Test registration fails with mismatched passwords."""
        url = reverse('api_v1:users:register')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'DifferentPass456!',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not User.objects.filter(email='newuser@example.com').exists()

    def test_register_user_duplicate_email(self, api_client, user):
        """Test registration fails with existing email."""
        url = reverse('api_v1:users:register')
        data = {
            'email': user.email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_user_invalid_email(self, api_client):
        """Test registration fails with invalid email."""
        url = reverse('api_v1:users:register')
        data = {
            'email': 'notanemail',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_user_short_password(self, api_client):
        """Test registration fails with short password."""
        url = reverse('api_v1:users:register')
        data = {
            'email': 'newuser@example.com',
            'password': '123',
            'password_confirm': '123',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_user_missing_fields(self, api_client):
        """Test registration fails with missing required fields."""
        url = reverse('api_v1:users:register')

        # Missing email
        response = api_client.post(url, {
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Missing password
        response = api_client.post(url, {
            'email': 'newuser@example.com',
            'password_confirm': 'SecurePass123!',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_user_with_optional_fields(self, api_client):
        """Test registration with optional first_name and last_name."""
        url = reverse('api_v1:users:register')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'John',
            'last_name': 'Doe',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email='newuser@example.com')
        assert user.first_name == 'John'
        assert user.last_name == 'Doe'


@pytest.mark.django_db
class TestUserLogin:
    """Tests for user login endpoint."""

    def test_login_success(self, api_client, user):
        """Test successful login returns tokens."""
        url = reverse('api_v1:users:login')
        data = {
            'email': user.email,
            'password': 'testpass123',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data
        assert response.data['user']['email'] == user.email

    def test_login_invalid_password(self, api_client, user):
        """Test login fails with wrong password."""
        url = reverse('api_v1:users:login')
        data = {
            'email': user.email,
            'password': 'wrongpassword',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_invalid_email(self, api_client):
        """Test login fails with non-existent email."""
        url = reverse('api_v1:users:login')
        data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self, api_client):
        """Test login fails for inactive user."""
        user = User.objects.create_user(
            email='inactive@example.com',
            username='inactive',
            password='testpass123',
            is_active=False
        )
        url = reverse('api_v1:users:login')
        data = {
            'email': user.email,
            'password': 'testpass123',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_credentials(self, api_client):
        """Test login fails with missing credentials."""
        url = reverse('api_v1:users:login')

        # Missing email
        response = api_client.post(url, {'password': 'testpass123'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Missing password
        response = api_client.post(url, {'email': 'test@example.com'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestTokenRefresh:
    """Tests for token refresh endpoint."""

    def test_refresh_token_success(self, api_client, user):
        """Test successful token refresh."""
        # First login to get tokens
        login_url = reverse('api_v1:users:login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'testpass123',
        })
        refresh_token = login_response.data['refresh']

        # Now refresh
        refresh_url = reverse('api_v1:users:token_refresh')
        response = api_client.post(refresh_url, {'refresh': refresh_token})

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    def test_refresh_token_invalid(self, api_client):
        """Test refresh fails with invalid token."""
        url = reverse('api_v1:users:token_refresh')
        response = api_client.post(url, {'refresh': 'invalid-token'})

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_token_missing(self, api_client):
        """Test refresh fails without token."""
        url = reverse('api_v1:users:token_refresh')
        response = api_client.post(url, {})

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserProfile:
    """Tests for user profile endpoint."""

    def test_get_profile_authenticated(self, authenticated_client, user):
        """Test getting profile when authenticated."""
        url = reverse('api_v1:users:profile')

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
        assert 'id' in response.data
        assert 'created_at' in response.data

    def test_get_profile_unauthenticated(self, api_client):
        """Test getting profile when not authenticated fails."""
        url = reverse('api_v1:users:profile')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self, authenticated_client, user):
        """Test updating user profile."""
        url = reverse('api_v1:users:profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
        }

        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.first_name == 'Updated'
        assert user.last_name == 'Name'


@pytest.mark.django_db
class TestChangePassword:
    """Tests for change password endpoint."""

    def test_change_password_success(self, authenticated_client, user):
        """Test successful password change."""
        url = reverse('api_v1:users:change_password')
        data = {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'NewSecurePass456!',
        }

        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password('NewSecurePass456!')

    def test_change_password_wrong_old_password(self, authenticated_client, user):
        """Test change password fails with wrong old password."""
        url = reverse('api_v1:users:change_password')
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'NewSecurePass456!',
        }

        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        user.refresh_from_db()
        assert user.check_password('testpass123')

    def test_change_password_mismatch(self, authenticated_client, user):
        """Test change password fails with mismatched new passwords."""
        url = reverse('api_v1:users:change_password')
        data = {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'DifferentPass789!',
        }

        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_password_unauthenticated(self, api_client):
        """Test change password fails when not authenticated."""
        url = reverse('api_v1:users:change_password')
        data = {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'NewSecurePass456!',
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestLogout:
    """Tests for logout endpoint."""

    def test_logout_success(self, api_client, user):
        """Test successful logout blacklists refresh token."""
        # First login
        login_url = reverse('api_v1:users:login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'testpass123',
        })
        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']

        # Set auth header
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # Logout
        logout_url = reverse('api_v1:users:logout')
        response = api_client.post(logout_url, {'refresh': refresh_token})

        assert response.status_code == status.HTTP_200_OK

        # Try to refresh with blacklisted token
        refresh_url = reverse('api_v1:users:token_refresh')
        refresh_response = api_client.post(refresh_url, {'refresh': refresh_token})
        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_unauthenticated(self, api_client):
        """Test logout fails when not authenticated."""
        url = reverse('api_v1:users:logout')
        response = api_client.post(url, {'refresh': 'some-token'})

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
