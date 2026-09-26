@echo off
title Desbloqueador SmartScreen - Venematic POS
cls
echo =================================================================
echo       DESBLOQUEADOR DE INSTALADORES VENEMATIC POS
echo =================================================================
echo.
echo Removiendo proteccion de descarga de Windows (Zone.Identifier)...
echo.

powershell -Command "Get-ChildItem -Path '%~dp0*.exe' | ForEach-Object { Unblock-File -LiteralPath $_.FullName; Remove-Item \"$($_.FullName):Zone.Identifier\" -Force -ErrorAction SilentlyContinue }; Write-Host 'Todos los instaladores en esta carpeta han sido desbloqueados exitosamente.' -ForegroundColor Green"

echo.
echo Puedes hacer doble clic en el instalador ahora.
echo.
pause
