@echo off
title Detener KlikPOS Enterprise
echo Cerrando instancias de KlikPOS Enterprise en puerto 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002 "') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo KlikPOS se ha detenido correctamente.
timeout /t 2 >nul
exit
