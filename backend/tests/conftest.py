"""
Pytest configuration and fixtures for DataForge AI tests.
"""

import io
import tempfile

import pandas as pd
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.fixture
def api_client():
    """Return an unauthenticated API client."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create and return a test user."""
    return User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='testpass123'
    )


@pytest.fixture
def other_user(db):
    """Create and return another test user."""
    return User.objects.create_user(
        email='other@example.com',
        username='otheruser',
        password='testpass123'
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """Return an authenticated API client."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def sample_csv_file():
    """Create a sample CSV file for testing."""
    csv_content = """name,age,salary,department
John Doe,30,50000,Engineering
Jane Smith,25,45000,Marketing
Bob Wilson,35,60000,Engineering
Alice Brown,28,55000,Sales
Charlie Davis,32,48000,Marketing"""

    return SimpleUploadedFile(
        name='test_data.csv',
        content=csv_content.encode('utf-8'),
        content_type='text/csv'
    )


@pytest.fixture
def sample_dataframe():
    """Create a sample DataFrame for testing."""
    return pd.DataFrame({
        'name': ['John', 'Jane', 'Bob', 'Alice', 'Charlie'],
        'age': [30, 25, 35, 28, 32],
        'salary': [50000, 45000, 60000, 55000, 48000],
        'department': ['Eng', 'Mkt', 'Eng', 'Sales', 'Mkt']
    })


@pytest.fixture
def classification_dataframe():
    """Create a DataFrame for classification testing."""
    return pd.DataFrame({
        'feature1': [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
        'feature2': [5.0, 4.0, 6.0, 3.0, 7.0, 2.0, 8.0, 1.0, 9.0, 0.0],
        'category': ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],
        'target': [0, 1, 0, 1, 0, 1, 0, 1, 0, 1]
    })


@pytest.fixture
def regression_dataframe():
    """Create a DataFrame for regression testing."""
    return pd.DataFrame({
        'feature1': [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
        'feature2': [5.0, 4.0, 6.0, 3.0, 7.0, 2.0, 8.0, 1.0, 9.0, 0.0],
        'target': [10.5, 20.3, 30.1, 40.2, 50.4, 60.1, 70.3, 80.5, 90.2, 100.1]
    })


@pytest.fixture
def temp_csv_path(sample_dataframe):
    """Create a temporary CSV file and return its path."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        sample_dataframe.to_csv(f.name, index=False)
        return f.name
