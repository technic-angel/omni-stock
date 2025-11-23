# Base image: Python 3.11 slim is a good balance of size and features
FROM python:3.11-slim

# Install system dependencies required for psycopg to install and run.
# postgresql-client: Provides the runtime libpq library.
# libpq-dev: Provides the development headers necessary for pip to successfully build psycopg.
# gcc: Necessary for compiling C extensions during the pip install process.
# git: Required by Render for deployment
RUN apt-get update && apt-get install -y --no-install-recommends \
        postgresql-client \
        libpq-dev \
        gcc \
        git \
 && rm -rf /var/lib/apt/lists/*

# Set environment variables for non-interactive commands
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set the working directory inside the container (repo-root build context)
WORKDIR /usr/src/app

# Copy the requirements file and install dependencies first (for layer caching)
# When building from repo root we reference backend/requirements.txt
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r backend/requirements.txt

# Copy the backend application code
COPY backend/ ./backend/

# Set working directory to backend
WORKDIR /usr/src/app/backend

# Set Django settings and Python path
ENV DJANGO_SETTINGS_MODULE=backend.omni_stock.settings
ENV PYTHONPATH=/usr/src/app

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "backend.omni_stock.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]
