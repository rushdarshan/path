#!/usr/bin/env bash
# Render free tier sleeps after ~15m with no traffic.
# This script keeps any URL awake by hitting /health every 12 minutes.
# Usage:
#   ./render-keepalive.sh https://your-app.onrender.com
# Or on Render itself (add as a Cron Job service — see render.yaml cron_keeper).
set -e
URL="${1:-${RENDER_EXTERNAL_URL:-${APP_URL:-}}}"
if [ -z "$URL" ]; then
  echo "Usage: $0 https://your-app.onrender.com"
  exit 1
fi
# normalize trailing slash
URL="${URL%/}/health"
echo "[keepalive] pinging $URL every 12m (Ctrl+C to stop)"
while true; do
  curl -fsS "$URL" >/dev/null && echo "$(date -u +%FT%TZ) ok $URL" || echo "$(date -u +%FT%TZ) fail $URL"
  sleep 720
done
