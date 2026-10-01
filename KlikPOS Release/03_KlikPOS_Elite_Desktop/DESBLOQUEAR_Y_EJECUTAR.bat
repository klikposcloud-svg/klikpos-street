@echo off
title Instalador KlikPOS Elite v3.0.1
echo ===============================================================
echo   INSTALADOR OFICIAL: KlikPOS Elite v3.0.1
echo   Desbloqueando archivo de seguridad SmartScreen de Windows...
echo ===============================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Filter '*.exe' | Unblock-File" 2>nul
echo Iniciando asistente de instalacion...
start "" "%~dp0KlikPOS_Elite_Setup.exe"
exit

