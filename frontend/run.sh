#!/usr/bin/env bash
# Installs dependencies (first run only) and starts the dev server (usually http://127.0.0.1:5173)
set -e
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

npm run dev
