@echo off
title KlikPOS Versiones Finales
echo ===============================================================
echo   KLIKPOS ENTERPRISE - SUITE OFICIAL VERSIONES FINALES
echo   Desbloqueando ejecutables para SmartScreen de Windows...
echo ===============================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Filter '*.exe' | Unblock-File" 2>nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Filter '*.apk' | Unblock-File" 2>nul
echo Archivos listos y autorizados para instalacion limpia.
pause
exit
