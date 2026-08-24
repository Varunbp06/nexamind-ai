#!/bin/bash
# Hugging Face Spaces start script: redis + migrations + celery + gunicorn.
# HF free CPU: 2 vCPU / 16GB RAM, app_port 7860 (no PORT env injected).
set -e

mkdir -p /data/appdata/tmp /data/appdata/localdata
ln -sfn /data/appdata/tmp /app/tmp
ln -sfn /data/appdata/localdata /app/localdata
mkdir -p /app/tmp/sqlite/chroma /app/localdata/sqlite

echo "[start-hf] starting redis..."
if pgrep redis-server > /dev/null; then
  echo "[start-hf] redis already running"
else
  redis-server --daemonize yes || echo "[start-hf] redis start failed (continuing)"
fi

echo "[start-hf] running migrations..."
alembic upgrade head || echo "[start-hf] alembic failed (continuing)"

echo "[start-hf] starting celery worker..."
celery -A app.worker worker --loglevel=warning --concurrency=1 &
CELERY_PID=$!
echo "[start-hf] celery PID $CELERY_PID"

HF_PORT="${PORT:-7860}"
echo "[start-hf] starting gunicorn on port ${HF_PORT}..."
gunicorn -w 1 -b "0.0.0.0:${HF_PORT}" -c scripts/gunicorn.conf.py app.main:app --timeout 600 --access-logfile - &
API_PID=$!
echo "[start-hf] gunicorn PID $API_PID"

cleanup() {
  local ec=$?
  echo "[start-hf] cleaning up..."
  pkill -9 -f 'celery -A app.worker' 2>/dev/null || true
  if [ -n "$API_PID" ] && kill -0 $API_PID 2>/dev/null; then kill $API_PID 2>/dev/null || true; fi
  exit $ec
}
trap cleanup EXIT TERM INT

wait $API_PID
EXIT_STATUS=$?
echo "[start-hf] gunicorn stopped with exit code $EXIT_STATUS"
exit $EXIT_STATUS
