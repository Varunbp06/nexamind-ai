#!/bin/bash
# Render start script: disk symlinks + redis + migrations + celery + gunicorn.
set -e

# Redirect the app's relative persistence paths (./tmp, ./localdata) onto the
# mounted disk so state survives restarts when a Render disk is attached.
mkdir -p /data/appdata/tmp /data/appdata/localdata
ln -sfn /data/appdata/tmp /app/tmp
ln -sfn /data/appdata/localdata /app/localdata
mkdir -p /app/tmp/sqlite/chroma /app/localdata/sqlite

echo "[start-render] starting redis..."
redis-server --daemonize yes --save "" --appendonly no

echo "[start-render] running migrations..."
alembic upgrade head

echo "[start-render] starting celery worker..."
celery -A app.worker worker --loglevel=warning --concurrency=1 --app-dir backend &
CELERY_PID=$!

echo "[start-render] starting gunicorn on port ${PORT:-10000}..."
exec gunicorn -w 1 -b "0.0.0.0:${PORT:-10000}" -c scripts/gunicorn.conf.py app.main:app --timeout 600 --app-dir backend --access-logfile -
