@echo off
echo ============================================
echo   FinSight AI - Starting Frontend Server
echo ============================================
cd /d "%~dp0frontend"

echo [1/2] Installing npm packages...
call npm install

echo [2/2] Starting React dev server...
echo.
echo  Frontend running at: http://localhost:5173
echo.
call npm run dev
pause
