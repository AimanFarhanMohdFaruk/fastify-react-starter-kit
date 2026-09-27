#!/bin/sh
set -eu

echo "[entrypoint] waiting for database…"
i=0
until npm run db:migrate; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[entrypoint] migrate failed after retries" >&2
    exit 1
  fi
  echo "[entrypoint] migrate not ready, retry $i/30…"
  sleep 2
done

exec "$@"
