@echo off
cd /d "%~dp0"
echo Staging all changes...
git add .
echo Committing...
git commit -m "major update"
echo Pushing to GitHub...
git push origin main
echo.
echo Done! Vercel will auto-deploy in ~1-2 minutes.
echo Check: https://vercel.com/dashboard
pause
