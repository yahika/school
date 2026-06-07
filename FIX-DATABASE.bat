@echo off
echo ================================================
echo  FIXING DATABASE - Creating all tables
echo  (Parent portal, announcements, applications...)
echo ================================================
echo.

echo [1/3] Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Regenerating Prisma client for SQLite...
call npx prisma generate
if %errorlevel% neq 0 (
  echo ERROR: prisma generate failed
  pause
  exit /b 1
)

echo [3/3] Creating missing database tables...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
  echo ERROR: prisma db push failed
  pause
  exit /b 1
)

echo.
echo ================================================
echo  SUCCESS! All tables created.
echo  Now run START.bat to restart the server.
echo ================================================
echo.
pause
