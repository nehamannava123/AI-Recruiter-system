@echo off
cd /d "%~dp0"

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo Starting backend at http://127.0.0.1:8000 ...
uvicorn main:app --reload
