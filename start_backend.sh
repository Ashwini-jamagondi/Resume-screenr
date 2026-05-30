#!/bin/bash
# start_backend.sh — Run from the project root

set -e

echo "🚀 Starting RecruitAI Backend..."

cd backend

if [ ! -d "venv" ]; then
  echo "📦 Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠️  Created .env from example. Edit it before running in production."
fi

echo "✅ Starting server at http://localhost:8000"
echo "📖 API docs at http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
