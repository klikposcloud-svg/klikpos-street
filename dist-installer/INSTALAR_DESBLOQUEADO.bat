@echo off
title Instalador Venematic POS - Desbloqueado
cd /d "%~dp0"

echo ================================================================
echo         INICIANDO INSTALADOR VENEMATIC POS ENTERPRISE
echo ================================================================
echo.
echo Desbloqueando ejecutable de las restricciones de Windows...
powershell -Command "Unblock-File -Path '%~dp0Venematic-POS-Setup-v2.0.0.exe' -ErrorAction SilentlyContinue"

echo Ejecutando instalador...
start "" "%~dp0Venematic-POS-Setup-v2.0.0.exe"
exit
