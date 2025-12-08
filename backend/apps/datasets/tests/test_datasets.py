"""
Tests for dataset management.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.datasets.models import Dataset


@pytest.mark.django_db
class TestDatasetUpload:
    """Tests for dataset upload."""

    def test_upload_csv_success(self, authenticated_client, sample_csv_file, user):
        """Test successful CSV upload."""
        url = reverse('api_v1:datasets:dataset-list')
        data = {
            'name': 'Test Dataset',
            'description': 'A test dataset',
            'file': sample_csv_file,
        }

        response = authenticated_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Test Dataset'
        assert response.data['file_type'] == 'csv'
        assert Dataset.objects.filter(owner=user).count() == 1

    def test_upload_requires_authentication(self, api_client, sample_csv_file):
        """Test that upload requires authentication."""
        url = reverse('api_v1:datasets:dataset-list')
        data = {
            'name': 'Test Dataset',
            'file': sample_csv_file,
        }

        response = api_client.post(url, data, format='multipart')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestDatasetList:
    """Tests for dataset listing."""

    def test_list_own_datasets(self, authenticated_client, user):
        """Test listing own datasets."""
        # Create some datasets
        from tests.factories import DatasetFactory
        DatasetFactory.create(owner=user, name='Dataset 1')
        DatasetFactory.create(owner=user, name='Dataset 2')

        url = reverse('api_v1:datasets:dataset-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2

    def test_cannot_see_other_users_datasets(self, authenticated_client, user, other_user):
        """Test that users cannot see other users' datasets."""
        from tests.factories import DatasetFactory
        DatasetFactory.create(owner=user, name='My Dataset')
        DatasetFactory.create(owner=other_user, name='Other Dataset')

        url = reverse('api_v1:datasets:dataset-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == 'My Dataset'


@pytest.mark.django_db
class TestDatasetDetail:
    """Tests for dataset detail view."""

    def test_get_own_dataset(self, authenticated_client, user):
        """Test getting own dataset details."""
        from tests.factories import DatasetFactory
        dataset = DatasetFactory.create(owner=user, name='My Dataset')

        url = reverse('api_v1:datasets:dataset-detail', args=[dataset.id])
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'My Dataset'

    def test_cannot_get_other_users_dataset(self, authenticated_client, other_user):
        """Test that users cannot access other users' datasets."""
        from tests.factories import DatasetFactory
        dataset = DatasetFactory.create(owner=other_user, name='Other Dataset')

        url = reverse('api_v1:datasets:dataset-detail', args=[dataset.id])
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestDatasetDelete:
    """Tests for dataset deletion."""

    def test_delete_own_dataset(self, authenticated_client, user):
        """Test deleting own dataset."""
        from tests.factories import DatasetFactory
        dataset = DatasetFactory.create(owner=user, name='My Dataset')

        url = reverse('api_v1:datasets:dataset-detail', args=[dataset.id])
        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_200_OK
        assert not Dataset.objects.filter(id=dataset.id).exists()
