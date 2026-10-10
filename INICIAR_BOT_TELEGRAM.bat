@echo off
title KlikPOS Telegram Remote Bridge
color 0A
cd /d "%~dp0"

:loop
echo ========================================================
echo   KLIKPOS TELEGRAM REMOTE BRIDGE - CENTRO DE MANDO
echo   Bot: @KlikposAlerts_bot
echo ========================================================
echo.
node scripts/telegram-remote-dev.js

echo.
echo [ALERTA] El proceso se detuvo o perdio conexion.
echo Reintentando conexion en 5 segundos...
timeout /t 5 /nobreak >nul
goto loop
