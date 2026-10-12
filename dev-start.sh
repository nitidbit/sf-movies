#!/usr/bin/env bash
# Build the site and serve it from babashka, as on Opalstack.
# Rebuilds and restarts the server whenever a source file changes.

set -euo pipefail
cd "$(dirname "$0")"

# Maybe open page in browser, once the server is up
if [[ -n "${BROWSER:-}" ]]; then
  (until curl -s -o /dev/null http://localhost:8080/; do sleep 1; done
   open -a "$BROWSER" http://localhost:8080/) &
fi

exec watchexec -r -w src -w public -w movie-data -w server/src -- \
  'npm run build && SITE_DIR=site exec bb server/src/server.clj'
