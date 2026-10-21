@echo off
title Kliko POS Enterprise - Instalador Directo
color 1F
cd /d "%~dp0"
echo =====================================================================
echo                Iniciando Instalador Kliko POS Enterprise
echo =====================================================================
echo.
echo Desbloqueando ejecutable y abriendo instalador...
if exist ".\Kliko_Desktop_Setup.exe" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -Path '.\Kliko_Desktop_Setup.exe' -ErrorAction SilentlyContinue; Start-Process -FilePath '.\Kliko_Desktop_Setup.exe'"
) else if exist ".\Kliko_Desktop_Full_Setup.exe" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -Path '.\Kliko_Desktop_Full_Setup.exe' -ErrorAction SilentlyContinue; Start-Process -FilePath '.\Kliko_Desktop_Full_Setup.exe'"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -Path '.\KlikPOS_Desktop_Setup.exe' -ErrorAction SilentlyContinue; Start-Process -FilePath '.\KlikPOS_Desktop_Setup.exe'"
)
exit