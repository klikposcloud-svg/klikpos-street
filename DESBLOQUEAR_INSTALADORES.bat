@echo off
setlocal enabledelayedexpansion
title Desbloqueador y Ejecutor - Venematic POS
color 0a
cls

echo ===============================================================================
echo            DESBLOQUEADOR Y EJECUTOR DE INSTALADORES VENEMATIC POS
echo ===============================================================================
echo.
echo [1/2] Removiendo marcas de bloqueo web de Windows (Zone.Identifier)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0*.exe' | ForEach-Object { Unblock-File -LiteralPath $_.FullName; Remove-Item \"$($_.FullName):Zone.Identifier\" -Force -ErrorAction SilentlyContinue }; Write-Host '   -> Todos los instaladores han sido desbloqueados a nivel de archivo.' -ForegroundColor Green"

echo.
echo [2/2] Como iniciar la instalacion:
echo.
echo   OPCION A (Recomendada - 100%% sin bloqueos):
echo      Doble clic al archivo: INSTALAR_DIRECTO_SIN_SMARTSCREEN.bat
echo.
echo   OPCION B (Instalador tradicional EXE):
echo      Si Windows SmartScreen muestra la ventana azul "Windows protegio su PC":
echo      1. Haz clic en el enlace sub-rayado "Mas informacion".
echo      2. Aparecera el boton "Ejecutar de todas formas" (haz clic en el).
echo.
echo ===============================================================================
echo Deseas ejecutar ahora el instalador Full Desktop? (S/N)
echo ===============================================================================
set /p opt="Opcion [S/N]: "

if /i "!opt!"=="S" (
    echo.
    echo Iniciando Venematic-POS-Full-Desktop-Setup-v2.0.0.exe...
    start "" "%~dp0Venematic-POS-Full-Desktop-Setup-v2.0.0.exe"
)

exit
