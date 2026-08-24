#!/bin/bash
# Render start script: disk symlinks + redis + migrations + celery + gunicorn.
# Mirrors scripts/start-api.sh but tuned for Render free tier (single worker, PORT 10000).

set -e

# Redirect relative persistence paths onto /data disk (paid) — free tier stays ephemeral.
mkdir -p /data/appdata/tmp /data/appdata/localdata
ln -sfn /data/appdata/tmp /app/tmp
ln -sfn /data/appdata/localdata /app/localdata
mkdir -p /app/tmp/sqlite/chroma /app/localdata/sqlite

# Ensure redis (broker for Celery). Match start-api.sh: simple daemonize, no extra flags.
echo "[start-render] starting redis..."
if pgrep redis-server > /dev/null; then
  echo "[start-render] redis already running"
else
  redis-server --daemonize yes || echo "[start-render] redis start failed (continuing)"
fi

# DB migrations — allow failure to not kill the whole container (like local dev).
echo "[start-render] running migrations..."
alembic upgrade head || echo "[start-render] alembic failed (continuing)"

# Start Celery worker (background) unless tasks run inline in the API
# process (PAIRAG_TASK_MODE=inline on small-RAM hosts).
if [ "${PAIRAG_TASK_MODE:-}" = "inline" ]; then
  echo "[start-render] PAIRAG_TASK_MODE=inline - skipping celery worker"
else
  echo "[start-render] starting celery worker..."
  celery -A app.worker worker --loglevel=warning --concurrency=1 &
  CELERY_PID=$!
  echo "[start-render] celery PID $CELERY_PID"
fi

# Start gunicorn (background) — match start-api.sh, single worker for 512 MB
echo "[start-render] starting gunicorn on port ${PORT:-10000}..."
gunicorn -w 1 -b "0.0.0.0:${PORT:-10000}" -c scripts/gunicorn.conf.py app.main:app --timeout 600 --access-logfile - &
API_PID=$!
echo "[start-render] gunicorn PID $API_PID"

# Cleanup on exit (mirror start-api.sh)
cleanup() {
  local ec=$?
  echo "[start-render] cleaning up..."
  pkill -9 -f 'celery -A app.worker' 2>/dev/null || true
  if [ -n "$API_PID" ] && kill -0 $API_PID 2>/dev/null; then kill $API_PID 2>/dev/null || true; fi
  exit $ec
}
trap cleanup EXIT TERM INT

echo "[start-render] waiting for gunicorn..."
wait $API_PID
EXIT_STATUS=$?
echo "[start-render] gunicorn stopped with exit code $EXIT_STATUS"
exit $EXIT_STATUS
