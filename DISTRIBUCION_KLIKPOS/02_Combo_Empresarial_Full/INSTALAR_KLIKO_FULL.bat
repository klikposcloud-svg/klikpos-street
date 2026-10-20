@echo off
title Kliko POS Enterprise Full - Instalador Directo
color 1F
cd /d "%~dp0"
echo =====================================================================
echo              Iniciando Instalador Kliko POS Enterprise Full
echo =====================================================================
echo.
echo Desbloqueando ejecutable y abriendo instalador...
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '.\Kliko_Desktop_Full_Setup.exe') { Unblock-File -Path '.\Kliko_Desktop_Full_Setup.exe' -ErrorAction SilentlyContinue; Start-Process -FilePath '.\Kliko_Desktop_Full_Setup.exe' } else { Unblock-File -Path '.\KlikPOS_Desktop_Full_Setup.exe' -ErrorAction SilentlyContinue; Start-Process -FilePath '.\KlikPOS_Desktop_Full_Setup.exe' }"
exit
