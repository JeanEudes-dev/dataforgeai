"""
Celery tasks for the Predictions app.
"""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=0)
def run_batch_prediction_task(self, job_id: str) -> dict:
    """
    Async task to run batch predictions.

    Args:
        job_id: UUID of the PredictionJob to process

    Returns:
        Dict with prediction results
    """
    from apps.predictions.models import PredictionJob
    from apps.predictions.services import PredictionService

    try:
        logger.info(f'Starting async batch prediction for job {job_id}')

        job = PredictionJob.objects.get(id=job_id)

        # Update status to running
        job.status = PredictionJob.Status.RUNNING
        job.save(update_fields=['status'])

        # Run predictions
        prediction_service = PredictionService(job.model)
        job = prediction_service.run_prediction_job(job)

        logger.info(f'Async batch prediction completed for job {job_id}')

        return {
            'job_id': str(job.id),
            'status': job.status,
            'row_count': job.input_row_count,
            'output_file': job.output_file.url if job.output_file else None,
        }

    except PredictionJob.DoesNotExist:
        logger.error(f'Prediction job {job_id} not found')
        raise

    except Exception as e:
        logger.error(f'Async batch prediction failed for job {job_id}: {str(e)}')

        # Update job status to error
        try:
            job = PredictionJob.objects.get(id=job_id)
            job.status = PredictionJob.Status.ERROR
            job.error_message = str(e)
            job.save(update_fields=['status', 'error_message'])
        except PredictionJob.DoesNotExist:
            pass

        # Don't retry - just log and return
        return {
            'job_id': job_id,
            'status': 'error',
            'error': str(e),
        }
