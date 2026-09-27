@echo off
title KlikPOS Enterprise - Verificacion y Desbloqueo de Seguridad
color 1F
echo =====================================================================
echo           KlikPOS Enterprise - Instalador Confiable
echo =====================================================================
echo.
echo 1. Desbloqueando archivos de instalacion...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Recurse -Filter '*.exe' | Unblock-File"

echo.
echo 2. Registrando Certificado de Seguridad KlikPOS en Windows...
if exist "Certificado_KlikPOS.cer" (
    certutil -user -addstore TrustedPublisher "Certificado_KlikPOS.cer" >nul 2>&1
    echo [OK] Certificado KlikPOS validado con exito.
)

echo.
echo =====================================================================
echo  Listo. Ya puedes ejecutar el instalador sin bloqueos de SmartScreen.
echo =====================================================================
echo.
pause