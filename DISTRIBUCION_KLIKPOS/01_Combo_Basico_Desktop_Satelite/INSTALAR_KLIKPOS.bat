@echo off
title KlikPOS Enterprise - Instalador Seguro
color 1F
cd /d "%~dp0"
echo =====================================================================
echo                 Instalando KlikPOS Enterprise
echo =====================================================================
echo Desbloqueando instalador...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -Path '.\KlikPOS_Desktop_Setup.exe' -ErrorAction SilentlyContinue"
echo Iniciando asistente de instalacion...
start "" ".\KlikPOS_Desktop_Setup.exe"
exit
