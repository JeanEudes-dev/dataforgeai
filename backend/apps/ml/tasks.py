"""
Celery tasks for the ML app.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=0)
def train_models_task(self, job_id: str) -> dict:
    """
    Async task to train ML models.

    Args:
        job_id: UUID of the TrainingJob to process

    Returns:
        Dict with training results
    """
    from apps.ml.models import TrainingJob
    from apps.ml.services import ModelTrainerService

    try:
        logger.info(f'Starting async training for job {job_id}')

        job = TrainingJob.objects.get(id=job_id)

        # Update status to running
        job.status = TrainingJob.Status.RUNNING
        job.save(update_fields=['status'])

        # Run training
        trainer = ModelTrainerService(job)
        job = trainer.train()

        logger.info(f'Async training completed for job {job_id}')

        return {
            'job_id': str(job.id),
            'status': job.status,
            'best_model_id': str(job.best_model.id) if job.best_model else None,
        }

    except TrainingJob.DoesNotExist:
        logger.error(f'Training job {job_id} not found')
        raise

    except Exception as e:
        logger.error(f'Async training failed for job {job_id}: {str(e)}')

        # Update job status to error
        try:
            job = TrainingJob.objects.get(id=job_id)
            job.status = TrainingJob.Status.ERROR
            job.error_message = str(e)
            job.save(update_fields=['status', 'error_message'])
        except TrainingJob.DoesNotExist:
            pass

        # Don't retry - just log and return
        return {
            'job_id': job_id,
            'status': 'error',
            'error': str(e),
        }
