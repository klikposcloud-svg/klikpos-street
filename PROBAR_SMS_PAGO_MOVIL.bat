@echo off
title Venematic POS - Probador de SMS Pago Movil
cls
echo =================================================================
echo       VENEMATIC POS - SIMULADOR DE SMS Y PAGO MOVIL
echo =================================================================
echo.
echo Iniciando probador interactivo de Webhooks bancarios...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\probar-sms-pagomovil.ps1"

echo.
pause
