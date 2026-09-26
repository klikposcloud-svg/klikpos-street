@echo off
title Venematic POS - Generador Portable de Licencias
cd /d "%~dp0"
if exist "VenematicKeygenPortable.exe" (
    start "" "VenematicKeygenPortable.exe"
) else (
    echo Iniciando generador en terminal...
    node scripts\generar-licencia.mjs
    pause
)
