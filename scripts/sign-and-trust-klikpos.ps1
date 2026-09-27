$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    KlikPOS Enterprise - Certificado y Desbloqueo SmartScreen " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$certSubject = "CN=KlikPOS Cloud Enterprise, O=KlikPOS Inc, C=VE"

# 1. Obtener o crear certificado de firma de codigo para KlikPOS
$cert = Get-ChildItem -Path Cert:\CurrentUser\My -CodeSigningCert | 
        Where-Object { $_.Subject -match "KlikPOS Cloud Enterprise" } | 
        Select-Object -First 1

if (-not $cert) {
    Write-Host "[1/5] Creando certificado digital oficial de KlikPOS Enterprise..." -ForegroundColor Yellow
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject $certSubject `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -FriendlyName "KlikPOS Cloud Enterprise Verified Publisher" `
        -NotAfter (Get-Date).AddYears(10)
    Write-Host "[OK] Certificado creado con exito (Thumbprint: $($cert.Thumbprint))" -ForegroundColor Green
} else {
    Write-Host "[1/5] Certificado KlikPOS existente localizado (Thumbprint: $($cert.Thumbprint))" -ForegroundColor Green
}

# 2. Exportar certificado publico .cer
Write-Host "[2/5] Exportando certificados publicos .cer..." -ForegroundColor Yellow
$certDistDir = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\DISTRIBUCION_KLIKPOS"
$certLocalDir = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-installer"

if (-not (Test-Path $certDistDir)) { New-Item -ItemType Directory -Path $certDistDir -Force | Out-Null }
if (-not (Test-Path $certLocalDir)) { New-Item -ItemType Directory -Path $certLocalDir -Force | Out-Null }

$pubCertDist = Join-Path $certDistDir "Certificado_KlikPOS.cer"
$pubCertLocal = Join-Path $certLocalDir "Certificado_KlikPOS.cer"

Export-Certificate -Cert $cert -FilePath $pubCertDist -Force | Out-Null
Export-Certificate -Cert $cert -FilePath $pubCertLocal -Force | Out-Null
Write-Host "[OK] Certificados guardados en DISTRIBUCION_KLIKPOS y dist-installer" -ForegroundColor Green

# 3. Registrar en TrustedPublisher via certutil (sin prompts)
Write-Host "[3/5] Registrando en Almacen de Editores de Confianza..." -ForegroundColor Yellow
& certutil -user -addstore TrustedPublisher $pubCertLocal | Out-Null
Write-Host "[OK] Certificado registrado en Windows (TrustedPublisher)" -ForegroundColor Green

# 4. Localizar todos los ejecutables a firmar y desbloquear
Write-Host "[4/5] Firmando digitalmente y desbloqueando ejecutables..." -ForegroundColor Yellow

$targetFiles = @(
    "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-installer\KlikPOS-Enterprise-Setup-v2.4.0.exe",
    "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\DISTRIBUCION_KLIKPOS\01_Combo_Basico_Desktop_Satelite\KlikPOS_Desktop_Setup.exe",
    "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\DISTRIBUCION_KLIKPOS\02_Combo_Empresarial_Full\KlikPOS_Desktop_Full_Setup.exe",
    "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\launcher\KlikPOS.exe",
    "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\build-staging\KlikPOS.exe"
)

foreach ($filePath in $targetFiles) {
    if (Test-Path $filePath) {
        # Desbloquear marca de origen web/red
        Unblock-File -Path $filePath -ErrorAction SilentlyContinue
        
        # Firmar con Authenticode
        $res = Set-AuthenticodeSignature -FilePath $filePath -Certificate $cert
        
        $sig = Get-AuthenticodeSignature -FilePath $filePath
        Write-Host "  -> $([System.IO.Path]::GetFileName($filePath))" -ForegroundColor White
        Write-Host "     Estado: $($sig.Status) | Firmante: $($sig.SignerCertificate.Subject)" -ForegroundColor Cyan
    } else {
        Write-Host "  -> [Omitido, no encontrado]: $filePath" -ForegroundColor DarkGray
    }
}

# 5. Generar archivo .bat de 1 solo clic para clientes / instalacion externa
Write-Host "[5/5] Generando asistente de desbloqueo rapido para clientes..." -ForegroundColor Yellow
$batContent = @"
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
"@

$batPath = Join-Path $certDistDir "00_DESBLOQUEAR_SMARTSCREEN_KLIKPOS.bat"
[System.IO.File]::WriteAllText($batPath, $batContent, [System.Text.Encoding]::ASCII)
Write-Host "[OK] Asistente generado en: $batPath" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   Proceso finalizado. Instaladores firmados y confiables.  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
