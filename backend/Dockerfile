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

# Set the working directory inside the container
WORKDIR /usr/src/app/backend

# Copy the requirements file and install dependencies first (for layer caching)
# Build context is backend/ directory
COPY requirements.txt /usr/src/app/backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy the backend application code
COPY . /usr/src/app/backend/

# Copy and set execution permissions for the script
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Set Django settings and Python path
ENV DJANGO_SETTINGS_MODULE=backend.omni_stock.settings
ENV PYTHONPATH=/usr/src/app

# Expose port
EXPOSE 8000

# Run the start script
CMD ["/usr/local/bin/start.sh"]
