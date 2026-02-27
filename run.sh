#!/usr/bin/env bash
# VoiceCoach — run backend + frontend with one command.
# Usage: ./run.sh

set -e
cd "$(dirname "$0")"
ROOT="$PWD"

# Backend PID for cleanup
BACKEND_PID=""
cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "==> Installing backend dependencies..."
pip install -q -r backend/requirements.txt

echo "==> Installing frontend dependencies..."
(cd frontend && npm install --silent)

echo "==> Starting backend on http://127.0.0.1:8000"
(cd backend && uvicorn main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!
sleep 2

echo "==> Starting frontend on http://localhost:5173"
echo "    Open http://localhost:5173 in your browser. Stop with Ctrl+C."
(cd frontend && npm run dev)
