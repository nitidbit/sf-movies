#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")"

bb server/src/server.clj &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT

npm run dev &
# npm run dev -- --host &
DEV_PID=$!

# Maybe open page in browser
if [[ -n "${BROWSER:-}" ]]; then
  sleep 1
  open -a $BROWSER http://localhost:4321/sf-movies/
fi

wait "$DEV_PID"
