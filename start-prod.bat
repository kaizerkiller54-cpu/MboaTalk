@echo off
echo ==== MboaTalk - Start Production ====
cd /d "%~dp0"
echo Building frontend...
npm run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)
echo Starting server (API + Frontend on port 5000)...
npm run server