#!/bin/bash
# =============================================================================
# DataForge AI Backend - Docker Entrypoint
# Handles database migrations and startup tasks
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DataForge AI Backend Starting...${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to wait for database
wait_for_db() {
    echo -e "${YELLOW}Waiting for database...${NC}"
    while ! python -c "
import sys
import psycopg
try:
    conn = psycopg.connect(
        host='${DB_HOST:-localhost}',
        port='${DB_PORT:-5432}',
        user='${DB_USER:-postgres}',
        password='${DB_PASSWORD:-postgres}',
        dbname='${DB_NAME:-dataforge}'
    )
    conn.close()
    sys.exit(0)
except Exception as e:
    sys.exit(1)
" 2>/dev/null; do
        echo -e "${YELLOW}Database not ready, waiting...${NC}"
        sleep 2
    done
    echo -e "${GREEN}Database is ready!${NC}"
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    python manage.py migrate --noinput
    echo -e "${GREEN}Migrations complete!${NC}"
}

# Function to collect static files
collect_static() {
    echo -e "${YELLOW}Collecting static files...${NC}"
    python manage.py collectstatic --noinput --clear
    echo -e "${GREEN}Static files collected!${NC}"
}

# Function to create superuser if not exists
create_superuser() {
    if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
        echo -e "${YELLOW}Creating superuser if not exists...${NC}"
        python manage.py shell -c "
from apps.users.models import User
if not User.objects.filter(email='${DJANGO_SUPERUSER_EMAIL}').exists():
    User.objects.create_superuser(
        email='${DJANGO_SUPERUSER_EMAIL}',
        password='${DJANGO_SUPERUSER_PASSWORD}'
    )
    print('Superuser created!')
else:
    print('Superuser already exists.')
"
    fi
}

# Main execution
case "$1" in
    "web")
        wait_for_db
        run_migrations
        collect_static
        create_superuser
        echo -e "${GREEN}Starting Gunicorn server...${NC}"
        exec gunicorn --bind 0.0.0.0:8000 \
            --workers ${GUNICORN_WORKERS:-4} \
            --threads ${GUNICORN_THREADS:-2} \
            --worker-class gthread \
            --timeout 120 \
            --access-logfile - \
            --error-logfile - \
            config.wsgi:application
        ;;
    "worker")
        wait_for_db
        echo -e "${GREEN}Starting Celery worker...${NC}"
        exec celery -A config worker -l ${CELERY_LOG_LEVEL:-INFO} --concurrency=${CELERY_CONCURRENCY:-2}
        ;;
    "beat")
        wait_for_db
        echo -e "${GREEN}Starting Celery beat...${NC}"
        exec celery -A config beat -l ${CELERY_LOG_LEVEL:-INFO}
        ;;
    "migrate")
        wait_for_db
        run_migrations
        ;;
    "shell")
        wait_for_db
        exec python manage.py shell
        ;;
    "test")
        wait_for_db
        run_migrations
        echo -e "${GREEN}Running tests...${NC}"
        exec pytest "${@:2}"
        ;;
    *)
        # Default: run the provided command
        exec "$@"
        ;;
esac
