@echo off
echo ===================================================
echo   Deep Learning Object Detection Project Launcher
echo ===================================================

echo [1/2] Installing Backend Dependencies...
pip install -r backend/requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b
)

echo [2/2] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ===================================================
echo Project is running!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo ===================================================
pause
