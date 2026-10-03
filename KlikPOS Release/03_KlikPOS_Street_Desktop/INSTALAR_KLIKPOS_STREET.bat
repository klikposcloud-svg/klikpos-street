@echo off
title Instalador KlikPOS Street v1.0
echo ===============================================================
echo   INSTALADOR OFICIAL: KlikPOS Street v1.0
echo   Desbloqueando archivo de seguridad SmartScreen de Windows...
echo ===============================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Filter '*.exe' | Unblock-File" 2>nul
echo Iniciando asistente de instalacion...
start "" "%~dp0KlikPOS_Street_v1.0_Setup.exe"
exit
