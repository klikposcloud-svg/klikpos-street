@echo off
setlocal enabledelayedexpansion
title Instalador Directo Instantaneo - Venematic POS
color 0b
cls

echo ===============================================================================
echo                VENEMATIC POS ENTERPRISE - INSTALACION DIRECTA
echo ===============================================================================
echo.
echo Este metodo instala Venematic POS directamente en su equipo sin depender del
echo instalador EXE tradicional ni de las restricciones de Windows SmartScreen.
echo.
echo [1/4] Preparando directorio de destino en AppData...

set "TARGET_DIR=%LOCALAPPDATA%\Programs\Venematic POS"
set "SOURCE_DIR=%~dp0..\venematic-desktop\build-staging"

if not exist "!SOURCE_DIR!\VenematicPOS.exe" (
    set "SOURCE_DIR=%~dp0build-staging"
)

if not exist "!SOURCE_DIR!\VenematicPOS.exe" (
    echo [ERROR] No se encontraron los archivos fuente de Venematic POS.
    echo Asegurese de ejecutar este archivo dentro del repositorio o carpeta de instaladores.
    pause
    exit /b 1
)

if not exist "!TARGET_DIR!" (
    mkdir "!TARGET_DIR!"
)

echo [2/4] Copiando archivos de la aplicacion y runtime portable...
robocopy "!SOURCE_DIR!" "!TARGET_DIR!" /E /IS /IT /MT:8 /NJH /NJS /NDL /NC /NS >nul

echo [3/4] Creando accesos directos en Escritorio y Menu Inicio...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desk = [Environment]::GetFolderPath('Desktop'); " ^
  "$start = [Environment]::GetFolderPath('Programs'); " ^
  "$target = '%TARGET_DIR%\VenematicPOS.exe'; " ^
  "$icon = '%TARGET_DIR%\app.ico'; " ^
  "$s1 = $ws.CreateShortcut(\"$desk\Venematic POS.lnk\"); " ^
  "$s1.TargetPath = $target; " ^
  "$s1.WorkingDirectory = '%TARGET_DIR%'; " ^
  "$s1.IconLocation = $icon; " ^
  "$s1.Description = 'Venematic POS - Sistema Punto de Venta'; " ^
  "$s1.Save(); " ^
  "$startMenuFolder = Join-Path $start 'Venematic POS'; " ^
  "if (-not (Test-Path $startMenuFolder)) { New-Item -ItemType Directory -Path $startMenuFolder -Force | Out-Null }; " ^
  "$s2 = $ws.CreateShortcut((Join-Path $startMenuFolder 'Venematic POS.lnk')); " ^
  "$s2.TargetPath = $target; " ^
  "$s2.WorkingDirectory = '%TARGET_DIR%'; " ^
  "$s2.IconLocation = $icon; " ^
  "$s2.Description = 'Venematic POS'; " ^
  "$s2.Save(); " ^
  "Write-Host 'Accesos directos generados con exito.' -ForegroundColor Green;"

echo.
echo [4/4] Desbloqueando permisos locales de Windows Defender...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%TARGET_DIR%' -Recurse | ForEach-Object { Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue }"

echo.
echo ===============================================================================
echo                INSTALACION COMPLETADA EXITOSAMENTE!
echo ===============================================================================
echo.
echo Se ha creado el icono 'Venematic POS' en tu Escritorio y Menu Inicio.
echo Iniciando Venematic POS ahora mismo...
echo.

start "" "%TARGET_DIR%\VenematicPOS.exe"

timeout /t 3 >nul
exit
