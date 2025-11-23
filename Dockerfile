# Root-level Dockerfile so Render/other platforms can build without custom root settings
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq-dev \
    gcc \
 && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1
WORKDIR /usr/src/app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
 && pip install -r requirements.txt

COPY backend /usr/src/app/backend
WORKDIR /usr/src/app/backend

# Optional: collect static files by enabling this when deploying
# RUN python manage.py collectstatic --no-input

ENV DJANGO_SETTINGS_MODULE=backend.omni_stock.settings
ENV PYTHONPATH=/usr/src/app
EXPOSE 8000

CMD ["gunicorn", "backend.omni_stock.wsgi:application", "--bind", "0.0.0.0:8000"]
