#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but was not found."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "docker compose is required but was not found."
  exit 1
fi

echo "Installing dependencies..."
npm ci

echo "Building frontend assets..."
npm run build

echo "Starting production deployment..."
$COMPOSE_CMD -f docker-compose.prod.yml up -d --build

echo "Deployment finished."
echo "Frontend URL: http://192.168.100.219:19081"
