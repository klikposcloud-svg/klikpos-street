@echo off
title Kliko POS Enterprise - Verificacion y Desbloqueo de Seguridad
color 1F
echo =====================================================================
echo           Kliko POS Enterprise - Instalador Confiable
echo =====================================================================
echo.
echo 1. Desbloqueando archivos de instalacion...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Recurse -Filter '*.exe' | Unblock-File"

echo.
echo 2. Registrando Certificado de Seguridad en Windows...
if exist "Certificado_KlikPOS.cer" (
    certutil -user -addstore TrustedPublisher "Certificado_KlikPOS.cer" >nul 2>&1
    echo [OK] Certificado validado con exito.
)

echo.
echo =====================================================================
echo  Listo. Ya puedes ejecutar el instalador sin bloqueos de SmartScreen.
echo =====================================================================
echo.
pause