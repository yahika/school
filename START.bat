@echo off
title American School Results Portal — Setup
color 0A
echo.
echo  =========================================
echo   American School Results Portal
echo   Setup and Launch Script
echo  =========================================
echo.

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is NOT installed on your computer.
    echo.
    echo  Please install it first:
    echo  1. Open this link in your browser:
    echo     https://nodejs.org/en/download
    echo  2. Download the "LTS" version (Windows Installer)
    echo  3. Install it, then double-click this file again.
    echo.
    start https://nodejs.org/en/download
    pause
    exit /b 1
)

echo  [OK] Node.js found:
node --version
echo.

:: Install dependencies
echo  [Step 1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] npm install failed. Check your internet connection.
    pause
    exit /b 1
)
echo  [OK] Dependencies installed!

echo.

:: Generate Prisma client
echo  [Step 2/4] Setting up Prisma client...
call npx prisma generate
echo  [OK] Prisma client ready.
echo.

:: Push database schema
echo  [Step 3/4] Creating database...
call npx prisma db push
echo  [OK] Database created.
echo.

:: Seed sample data (only if DB is fresh)
echo  [Step 4/4] Loading sample data...
call npx tsx prisma/seed.ts
echo  [OK] Sample data loaded.
echo.

echo  =========================================
echo   Starting the website...
echo   Open your browser at: http://localhost:3000
echo.
echo   Admin login: http://localhost:3000/admin/login
echo   Username: admin
echo   Password: Admin@2024!
echo  =========================================
echo.

:: Open browser automatically after 3 seconds
timeout /t 3 /nobreak >nul
start http://localhost:3000

:: Start Next.js dev server
call npm run dev

pause
