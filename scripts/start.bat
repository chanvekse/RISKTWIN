@echo off
echo.
echo =====================================================
echo    🚀 RiskTwin Platform - Starting Server
echo =====================================================
echo.
echo 📂 Navigating to backend directory...
cd /d "%~dp0..\backend"

echo 🔧 Starting RiskTwin API server...
echo.
echo 📊 Dashboard will be available at: http://localhost:3000
echo 🔗 Press Ctrl+C to stop the server
echo.

node server.js

pause 