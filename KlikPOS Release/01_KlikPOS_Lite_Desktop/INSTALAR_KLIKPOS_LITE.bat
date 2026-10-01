@echo off
title Instalador KlikPOS Lite v3.0.1
echo ===============================================================
echo   INSTALADOR OFICIAL: KlikPOS Lite v3.0.1
echo   Desbloqueando archivo de seguridad SmartScreen de Windows...
echo ===============================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Filter '*.exe' | Unblock-File" 2>nul
echo Iniciando asistente de instalacion...
start "" "%~dp0KlikPOS_Lite_Setup.exe"
exit

