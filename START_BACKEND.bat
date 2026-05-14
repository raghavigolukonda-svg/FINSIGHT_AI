@echo off
echo ============================================
echo   FinSight AI - Starting Backend Server
echo ============================================
cd /d "%~dp0backend"

echo [1/3] Creating virtual environment...
python -m venv .venv

echo [2/3] Installing dependencies...
call .venv\Scripts\activate.bat
pip install fastapi uvicorn[standard] scikit-learn numpy pandas python-multipart httpx

echo [3/3] Starting FastAPI server...
echo.
echo  Backend running at: http://localhost:8000
echo  Swagger API docs:   http://localhost:8000/docs
echo.
python main.py
pause
