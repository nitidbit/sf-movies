#!/usr/bin/env bash

set -euo pipefail
cd "$(dirname "$0")"

npm run dev &
DEV_PID=$!

# Maybe open page in browser
if [[ -n "${BROWSER:-}" ]]; then
  sleep 1
  open -a $BROWSER http://localhost:4322/sf-movies/
fi

wait "$DEV_PID"
