@echo off
title Polashi — Local Runner

echo.
echo  ========================================
echo   POLASHI — Installing dependencies...
echo  ========================================
echo.

:: Install server dependencies if needed
if not exist "C:\Projects\polashi\server\node_modules" (
    echo Installing server packages...
    cd /d C:\Projects\polashi\server
    npm install
)

:: Install client dependencies if needed
if not exist "C:\Projects\polashi\client\node_modules" (
    echo Installing client packages...
    cd /d C:\Projects\polashi\client
    npm install
)

echo.
echo  ========================================
echo   POLASHI — Starting...
echo  ========================================
echo.

:: Start the server in a new window
start "Polashi SERVER" cmd /k "cd /d C:\Projects\polashi\server && npm install && node server.js"

:: Small delay so server starts first
timeout /t 3 /nobreak > nul

:: Start the client in a new window
start "Polashi CLIENT" cmd /k "cd /d C:\Projects\polashi\client && npm install && npm run dev -- --host"

:: Wait for client to start
timeout /t 5 /nobreak > nul

:: Open the browser
start http://localhost:5173

echo  Done! Browser opening at http://localhost:5173
echo  Close the SERVER and CLIENT windows to stop.
echo.
pause
