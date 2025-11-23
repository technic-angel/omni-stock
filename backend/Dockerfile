# Base image: Python 3.11 slim is a good balance of size and features
FROM python:3.11-slim

#Install system dependencies required for psycopg to install and run.

# postgresql-client: Provides the runtime libpq library.

##libpq-dev: Provides the development headers necessary for pip to successfully build psycopg.

#gcc: Necessary for compiling C extensions during the pip install process.

RUN apt-get update && apt-get install -y --no-install-recommends \
	postgresql-client \
	libpq-dev \
	gcc \
 && rm -rf /var/lib/apt/lists/*

# Set environment variables for non-interactive commands
ENV PYTHONUNBUFFERED 1

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the requirements file and install dependencies first (for layer caching)
# The build context (when invoked from backend/) contains requirements.txt directly.
COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
 && pip install -r requirements.txt

# Copy the backend application code
COPY . /usr/src/app/backend
WORKDIR /usr/src/app/backend

# Collect static (optional)
# RUN python manage.py collectstatic --no-input

ENV DJANGO_SETTINGS_MODULE=backend.omni_stock.settings
ENV PYTHONPATH=/usr/src/app
EXPOSE 8000

CMD ["gunicorn", "backend.omni_stock.wsgi:application", "--bind", "0.0.0.0:8000"]

# Port Django runs on
EXPOSE 8000

# Default command to run the server (overridden by docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
