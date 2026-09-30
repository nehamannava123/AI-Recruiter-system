#!/usr/bin/env bash
# Sets up a virtualenv (first run only) and starts the API on http://127.0.0.1:8000
set -e
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "Starting backend at http://127.0.0.1:8000 ..."
uvicorn main:app --reload
