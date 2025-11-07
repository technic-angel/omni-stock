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
# The context is ./core_api, so we refer to the files in that directory using '.'
COPY requirements.txt /usr/src/app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the entire application code
COPY . /usr/src/app/

# Port Django runs on
EXPOSE 8000

# Default command to run the server (overridden by docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
