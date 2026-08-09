@echo off
echo ==== MboaTalk - Database Tools ====
cd /d "%~dp0"
echo.
echo 1) Generate migration
echo 2) Run migrations
echo 3) Seed database
echo 4) Push schema (dev only)
echo.
set /p choice="Choose (1-4): "
if "%choice%"=="1" npm run db:generate
if "%choice%"=="2" npm run db:migrate
if "%choice%"=="3" npm run db:seed
if "%choice%"=="4" npm run db:push
pause