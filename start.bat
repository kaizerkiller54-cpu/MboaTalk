@echo off
echo ==== MboaTalk launcher ====
cd /d "%~dp0"

rem Backend Neon/JWT (nouveau)
start "MboaTalk API" cmd /k "npm run server:new"

rem Frontend Vite (port 3000)
start "MboaTalk Web" cmd /k "npm run dev"

echo Les deux fenetres sont lancees.
echo Frontend : http://localhost:3000
timeout /t 3 >nul
