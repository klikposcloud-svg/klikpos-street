@echo off
title Detener Venematic POS
echo Cerrando instancias de Venematic POS en puerto 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002 "') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo Venematic POS se ha detenido correctamente.
timeout /t 2 >nul
exit
