@echo off
title mboaTalk
color 0A
echo ====================================
echo   mboaTalk - Pay ^& Chat Securise
echo ====================================
echo.

if not exist "node_modules" (
    echo [1/3] Installation des dependances...
    call npm install
    if errorlevel 1 (
        echo [ERREUR] npm install a echoue.
        pause
        exit /b 1
    )
)

echo [2/3] Demarrage du backend (port 5000)...
start "mboaTalk Server" cmd /c "npm run server ^& pause"

echo [INFO] Attente du backend (3 secondes)...
timeout /t 3 /nobreak >nul

echo [3/3] Demarrage du frontend (port 3000)...
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:5000
echo.
start http://localhost:3000
npm run dev
