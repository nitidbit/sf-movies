#!/usr/bin/env bash
# Deploy the server to Opalstack. Usage: scripts/deploy.sh staging

set -euo pipefail
cd "$(dirname "$0")/.."

case "${1:-}" in
  staging)
    HOST=sf-mov-staging@opal3.opalstack.com
    APP_DIR=/home/sf-mov-staging/apps/sf-movies-staging
    PORT=26840
    ;;
  *)
    echo "Usage: $0 staging" >&2
    exit 1
    ;;
esac

BB_VERSION=$(cat server/src/bb-version)

# Only src/ gets --delete, so bin/, sqlite/ and server.pid in APP_DIR are untouched.
rsync -av server/start server/stop "$HOST:$APP_DIR/"
rsync -av --delete server/src/ "$HOST:$APP_DIR/src/"

ssh "$HOST" "APP_DIR=$APP_DIR PORT=$PORT BB_VERSION=$BB_VERSION bash -s" <<'EOF'
set -euo pipefail

"$APP_DIR/stop"

if [[ "$("$APP_DIR/bin/bb" --version 2>/dev/null || true)" != "babashka v$BB_VERSION" ]]; then
  echo "Installing babashka $BB_VERSION"
  mkdir -p "$APP_DIR/bin"
  curl -sSfL "https://github.com/babashka/babashka/releases/download/v$BB_VERSION/babashka-$BB_VERSION-linux-amd64-static.tar.gz" \
    | tar -xz -C "$APP_DIR/bin" bb
fi

"$APP_DIR/start"
echo "Started on port $PORT"
EOF
