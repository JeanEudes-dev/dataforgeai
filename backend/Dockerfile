# =============================================================================
# DataForge AI Backend - Dockerfile
# Multi-stage build for optimized production image
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements/base.txt requirements/prod.txt /tmp/requirements/
RUN pip install --upgrade pip && \
    pip install -r /tmp/requirements/prod.txt


# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS production

# Labels
LABEL maintainer="DataForge AI Team" \
      version="1.0.0" \
      description="DataForge AI Backend - ML Analytics Platform"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    APP_HOME=/app \
    PATH="/opt/venv/bin:$PATH"

# Install runtime dependencies
# - libpq5: PostgreSQL client library
# - libmagic1: For python-magic file type detection
# - WeasyPrint dependencies for PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libmagic1 \
    # WeasyPrint dependencies
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-liberation \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Set working directory
WORKDIR $APP_HOME

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY --chown=appuser:appgroup . .

# Create necessary directories and make entrypoint executable
RUN mkdir -p $APP_HOME/media $APP_HOME/staticfiles $APP_HOME/logs && \
    chown -R appuser:appgroup $APP_HOME && \
    chmod +x $APP_HOME/docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Collect static files
RUN python manage.py collectstatic --noinput --clear

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health/')" || exit 1

# Default command - run web server via entrypoint
CMD ["web"]


# -----------------------------------------------------------------------------
# Stage 3: Development (optional - for local development with hot reload)
# -----------------------------------------------------------------------------
FROM production AS development

USER root

# Install development dependencies (need both files since dev.txt includes base.txt)
COPY requirements/base.txt requirements/dev.txt /tmp/requirements/
RUN pip install -r /tmp/requirements/dev.txt

USER appuser

# Override entrypoint for development (direct command)
ENTRYPOINT []

# Override command for development (with auto-reload)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
