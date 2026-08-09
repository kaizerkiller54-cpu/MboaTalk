@echo off
echo ==== MboaTalk - Stop Server ====
cd /d "%~dp0"
echo Killing process on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
  echo Stopped PID %%a
)
echo Done.