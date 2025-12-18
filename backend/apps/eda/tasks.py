"""
Celery tasks for the EDA app.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=0, time_limit=300, soft_time_limit=240)
def run_eda_task(self, dataset_id: str, eda_result_id: str = None) -> dict:
    """
    Async task to run EDA analysis.

    Args:
        dataset_id: UUID of the Dataset to analyze
        eda_result_id: Optional UUID of existing EDAResult to update

    Returns:
        Dict with EDA results
    """
    from apps.datasets.models import Dataset
    from apps.eda.models import EDAResult
    from apps.eda.services import EDAAnalyzerService

    eda_result = None

    try:
        logger.info(f'Starting async EDA for dataset {dataset_id}')

        dataset = Dataset.objects.get(id=dataset_id)

        # Get or create EDA result
        if eda_result_id:
            eda_result = EDAResult.objects.get(id=eda_result_id)
            eda_result.status = EDAResult.Status.RUNNING
            eda_result.save(update_fields=['status'])
        else:
            eda_result = EDAResult.objects.create(
                dataset=dataset,
                status=EDAResult.Status.RUNNING
            )

        # Run analysis
        analyzer = EDAAnalyzerService(dataset)
        eda_result = analyzer.analyze(eda_result=eda_result)

        logger.info(f'Async EDA completed for dataset {dataset_id}')

        return {
            'eda_result_id': str(eda_result.id),
            'dataset_id': str(dataset_id),
            'status': eda_result.status,
        }

    except Dataset.DoesNotExist:
        logger.error(f'Dataset {dataset_id} not found')
        raise

    except EDAResult.DoesNotExist:
        logger.error(f'EDA result {eda_result_id} not found')
        raise

    except Exception as e:
        logger.error(f'Async EDA failed for dataset {dataset_id}: {str(e)}')

        # Update EDA result status to error
        if eda_result:
            try:
                eda_result.status = EDAResult.Status.ERROR
                eda_result.save(update_fields=['status'])
            except Exception:
                pass

        # Don't retry - just log and return
        return {
            'dataset_id': dataset_id,
            'eda_result_id': str(eda_result.id) if eda_result else None,
            'status': 'error',
            'error': str(e),
        }
