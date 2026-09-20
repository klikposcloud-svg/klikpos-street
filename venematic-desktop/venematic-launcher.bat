@echo off
title Venematic POS - Terminal de Ventas
cd /d "%~dp0"

echo ===================================================
echo       Iniciando Venematic POS Desktop
echo ===================================================

:: Iniciar el servidor local en segundo plano en caso de no estar corriendo
start /b cmd /c "npm start" > nul 2>&1

:: Esperar 2 segundos a que inicialice el puerto
timeout /t 2 /nobreak > nul

:: Lanzar en ventana de aplicación nativa usando Microsoft Edge en modo app
start msedge --app=http://localhost:3002 --window-size=1366,768

exit
