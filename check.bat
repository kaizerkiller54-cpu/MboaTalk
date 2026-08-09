@echo off
echo ==== MboaTalk - Test & Lint ====
cd /d "%~dp0"
echo.
echo 1) TypeScript check (lint)
echo 2) Build frontend only
echo 3) Full check (lint + build)
echo.
set /p choice="Choose (1-3): "
if "%choice%"=="1" npm run lint
if "%choice%"=="2" npm run build
if "%choice%"=="3" (
  npm run lint && npm run build
)
pause