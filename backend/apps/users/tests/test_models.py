"""
Tests for User model.
"""

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Tests for the User model."""

    def test_create_user_with_email(self):
        """Test creating a user with email is successful."""
        email = 'test@example.com'
        username = 'testuser'
        password = 'testpass123'

        user = User.objects.create_user(
            email=email,
            username=username,
            password=password
        )

        assert user.email == email
        assert user.username == username
        assert user.check_password(password)
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser

    def test_user_email_is_normalized(self):
        """Test email is normalized for new users."""
        emails = [
            ('test1@EXAMPLE.com', 'test1@example.com'),
            ('Test2@Example.COM', 'Test2@example.com'),
            ('TEST3@EXAMPLE.COM', 'TEST3@example.com'),
            ('test4@example.COM', 'test4@example.com'),
        ]

        for i, (email, expected) in enumerate(emails):
            user = User.objects.create_user(
                email=email,
                username=f'user{i}',
                password='testpass123'
            )
            assert user.email == expected

    def test_create_user_without_email_raises_error(self):
        """Test creating user without email raises error."""
        with pytest.raises(ValueError) as exc_info:
            User.objects.create_user(
                email='',
                username='testuser',
                password='testpass123'
            )
        assert 'email' in str(exc_info.value).lower()

    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123'
        )

        assert user.is_superuser
        assert user.is_staff

    def test_user_string_representation(self):
        """Test user string representation."""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        assert str(user) == 'test@example.com'

    def test_user_full_name(self):
        """Test user full name property."""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )

        assert user.full_name == 'John Doe'

    def test_user_full_name_empty(self):
        """Test user full name falls back to email when names are empty."""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        # Falls back to email when first_name and last_name are empty
        assert user.full_name == 'test@example.com'

    def test_user_has_uuid_pk(self):
        """Test that user has UUID primary key."""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        assert user.id is not None
        # UUID should be 36 chars with hyphens
        assert len(str(user.id)) == 36

    def test_user_email_unique(self):
        """Test that email must be unique."""
        User.objects.create_user(
            email='test@example.com',
            username='testuser1',
            password='testpass123'
        )

        with pytest.raises(Exception):
            User.objects.create_user(
                email='test@example.com',
                username='testuser2',
                password='testpass123'
            )

    def test_user_timestamps(self):
        """Test that user has created_at and updated_at."""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

        assert user.created_at is not None
        assert user.updated_at is not None
