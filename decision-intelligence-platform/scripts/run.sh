#!/usr/bin/env bash
set -euo pipefail
# ── Decision Intelligence Platform — Quick Start (Unix/WSL) ──

echo "============================================"
echo " Decision Intelligence Platform"
echo " Starting Backend + Frontend"
echo "============================================"

# 1. Install dependencies
echo ""
echo "[1/3] Installing Python dependencies..."
pip install -r requirements.txt

# 2. Start Flask API in background
echo ""
echo "[2/3] Starting Flask API on port 8080..."
python -m backend.server &
API_PID=$!
echo "API PID: $API_PID"

# 3. Open frontend
echo ""
echo "[3/3] Launching frontend..."
if command -v xdg-open &>/dev/null; then
  xdg-open frontend/index.html
elif command -v open &>/dev/null; then
  open frontend/index.html
fi

echo ""
echo "Ready. Navigate the 4-beat storyboard in your browser."
echo "Press Ctrl+C to stop."
wait $API_PID
