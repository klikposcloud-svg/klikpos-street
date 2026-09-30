@echo off
title Venematic Master Hub - Dashboard del Desarrollador
cls
echo =====================================================================
echo           VENEMATIC POS - PANEL MASTER DEL DESARROLLADOR
echo =====================================================================
echo.
echo Iniciando el Dashboard del Desarrollador (CRM, Licencias, WhatsApp)...
echo.
start "" "%~dp0DASHBOARD_DESARROLLADOR.html"
echo Dashboard abierto en su navegador predeterminado.
timeout /t 3 >nul
exit
