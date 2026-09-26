$ErrorActionPreference = "SilentlyContinue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Desbloqueo y Configuración de Confianza de Instaladores " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Localizar o importar certificado Venematic en el almacén de confianza
$certPath = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-installer\Certificado_Venematic.cer"

if (Test-Path $certPath) {
    Write-Host "Instalando certificado en Entidades de Certificación de Confianza..." -ForegroundColor Yellow
    Import-Certificate -FilePath $certPath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null
    Import-Certificate -FilePath $certPath -CertStoreLocation "Cert:\CurrentUser\TrustedPublisher" | Out-Null
    Write-Host "[OK] Certificado agregado a Editores de Confianza de Windows." -ForegroundColor Green
}

$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -match "Venematic" } | Select-Object -First 1

# 2. Desbloquear todos los ejecutables (remover marca de internet Zone.Identifier)
$files = Get-ChildItem -Path "dist-installer\*.exe", "venematic-desktop\dist-installer\*.exe"

foreach ($file in $files) {
    Unblock-File -Path $file.FullName
    if ($cert) {
        Set-AuthenticodeSignature -FilePath $file.FullName -Certificate $cert | Out-Null
    }
    $sig = Get-AuthenticodeSignature -FilePath $file.FullName
    Write-Host "Archivo: $($file.Name)" -ForegroundColor White
    Write-Host "  Estado Firma : $($sig.Status)" -ForegroundColor Cyan
    Write-Host "  Firmante     : $($sig.SignerCertificate.Subject)" -ForegroundColor Gray
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Archivos desbloqueados y certificados como confiables.  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
