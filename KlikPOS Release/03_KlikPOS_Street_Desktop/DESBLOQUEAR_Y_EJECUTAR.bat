@echo off
title Instalador KlikPOS Street v3.0.4
echo ===============================================================
echo   INSTALADOR OFICIAL: KlikPOS Street v3.0.4
echo   Desbloqueando archivo de seguridad SmartScreen de Windows...
echo ===============================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Filter '*.exe' | Unblock-File" 2>nul
echo Iniciando asistente de instalacion...
start "" "%~dp0KlikPOS_Street_v3.0.4_Setup.exe"
exit
