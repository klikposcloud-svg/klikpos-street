@echo off
title Desbloqueador de Instaladores KlikPOS
color 0A
echo ===============================================================================
echo            DESBLOQUEADOR DE SEGURIDAD SMARTSCREEN - KLIKPOS ENTERPRISE
echo ===============================================================================
echo.
echo Eliminando la marca de bloqueo web (Zone.Identifier) en todos los ejecutables...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Recurse -Filter '*.exe' | ForEach-Object { Unblock-File -Path $_.FullName; Write-Host ' [OK] Desbloqueado: ' $_.Name -ForegroundColor Green }"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Recurse -Filter '*.bat' | ForEach-Object { Unblock-File -Path $_.FullName }"
echo.
echo ===============================================================================
echo  Todos los instaladores han sido desbloqueados exitosamente.
echo  Ya puedes hacer doble clic en cualquier instalador (.exe) sin avisos de bloqueo.
echo ===============================================================================
echo.
pause
