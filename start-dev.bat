@echo off
echo ==== MboaTalk - Dev Mode (2 windows) ====
cd /d "%~dp0"

echo Starting API server (port 5000)...
start "MboaTalk API" cmd /k "npm run server:new"

echo Starting Vite frontend (port 3000)...
start "MboaTalk Web" cmd /k "npm run dev"

timeout /t 2 >nul
echo.
echo Frontend: http://localhost:3000
echo API:      http://localhost:5000
echo.