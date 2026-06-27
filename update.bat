@echo off
cd /d C:\Projects\polashi
git add .
git commit -m "update"
git push
echo.
echo Done! Game updated. Vercel and Render will redeploy in ~2 minutes.
pause
