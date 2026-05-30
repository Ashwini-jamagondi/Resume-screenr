#!/bin/bash
# start_frontend.sh — Run from the project root

set -e
echo "🎨 Starting RecruitAI Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm packages..."
  npm install
fi

echo "✅ Starting frontend at http://localhost:3000"
npm run dev
