#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt
python train_model.py
cd ..

echo "Build complete. Ready to serve unified application."
