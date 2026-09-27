@echo off
title KlikPOS Enterprise - Instalador Directo
color 1F
cd /d "%~dp0"
echo =====================================================================
echo                Iniciando Instalador KlikPOS Enterprise
echo =====================================================================
echo.
echo Desbloqueando ejecutable y abriendo instalador...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -Path '.\KlikPOS_Desktop_Setup.exe' -ErrorAction SilentlyContinue; Start-Process -FilePath '.\KlikPOS_Desktop_Setup.exe'"
exit
