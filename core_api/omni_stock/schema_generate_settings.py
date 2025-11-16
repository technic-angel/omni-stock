/Users/melissa/Downloads/test_summary 2.mdfrom .settings import *

# Override database settings to use SQLite in-memory so manage.py commands
# (like spectacular) don't require PostgreSQL or psycopg on the runner.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Ensure DEBUG is True to avoid strict production checks
DEBUG = True

# Use a simple secret key suitable for local generation
SECRET_KEY = 'ci-schema-generation-temp-key'
