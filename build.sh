#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Preparing React Frontend ---"
if command -v npm &> /dev/null; then
  echo "Node and npm detected. Building React frontend..."
  cd frontend
  npm install
  npm run build
  cd ..
elif [ -d "frontend/dist" ]; then
  echo "Using pre-built frontend distribution from frontend/dist"
else
  echo "Error: Neither npm is available nor does frontend/dist exist."
  exit 1
fi

echo "--- Training / Verifying Machine Learning Model ---"
python backend/train_model.py

echo "--- Build complete. Application is ready to serve. ---"
