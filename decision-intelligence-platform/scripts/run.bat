@echo off
REM ── Decision Intelligence Platform — Quick Start (Windows) ──

echo ============================================
echo  Decision Intelligence Platform
echo  Starting Backend + Frontend
echo ============================================

REM ── 1. Install Python dependencies ──
echo.
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt

REM ── 2. Install frontend dependencies ──
echo.
echo [2/4] Installing frontend dependencies...
cd decision-ui
call npm install
cd ..

REM ── 3. Start Flask API in background ──
echo.
echo [3/4] Starting Flask API on port 8080...
start "DecisionIntel-API" cmd /c "python -m backend.server"

REM ── 4. Start Vite dev server ──
echo.
echo [4/4] Starting frontend dev server...
start "DecisionIntel-UI" cmd /c "cd decision-ui && npx vite --port 3000 --open"

echo.
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000
echo Press Ctrl+C in each window to stop.
pause
