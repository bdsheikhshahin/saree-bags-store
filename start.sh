#!/bin/bash
# Start BOTH services in a single container (the Dockerfile's default CMD).
# docker-compose.yml overrides this and runs one service per container
# instead — that is the recommended production setup. This script is only
# for `docker run` / single-container use.
#
# The API runs in the background; the web app runs in the foreground so it
# receives the container's signals. When the container stops, the trap kills
# the API too.
set -e

npm start --workspace=@ecommerce/api &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup TERM INT EXIT

npm start --workspace=@ecommerce/web &
WEB_PID=$!

wait "$WEB_PID"
