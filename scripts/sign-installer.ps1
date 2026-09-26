$ErrorActionPreference = "Stop"

$exePath = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-installer\Venematic-POS-Setup-v2.0.0.exe"

# 1. Desbloquear archivo (remover Zone.Identifier)
Unblock-File -Path $exePath -ErrorAction SilentlyContinue

# 2. Crear certificado de firma de código autofirmado si no existe
$certSubject = "CN=Venematic Software C.A., O=Venematic POS, C=VE"
$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -match "Venematic" } | Select-Object -First 1

if (-not $cert) {
    Write-Host "Creando certificado de firma de código local..."
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject $certSubject `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(5)
}

# 3. Exportar certificado público
$certPath = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\dist-installer\Certificado_Venematic.cer"
Export-Certificate -Cert $cert -FilePath $certPath -Force | Out-Null

# 4. Firmar el instalador con Authenticode
Write-Host "Firmando digitalmente el instalador..."
Set-AuthenticodeSignature -FilePath $exePath -Certificate $cert -TimestampServer "http://timestamp.digicert.com" -ErrorAction SilentlyContinue
if ((Get-AuthenticodeSignature $exePath).Status -eq "UnknownError") {
    # Fallback sin timestamp si no hay internet hacia digicert
    Set-AuthenticodeSignature -FilePath $exePath -Certificate $cert
}

# 5. Instalar certificado en Trusted Root del usuario actual para que Windows lo reconozca
try {
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
} catch {}

try {
    $store2 = New-Object System.Security.Cryptography.X509Certificates.X509Store("TrustedPublisher", "CurrentUser")
    $store2.Open("ReadWrite")
    $store2.Add($cert)
    $store2.Close()
} catch {}

$sig = Get-AuthenticodeSignature $exePath
Write-Host "Estado de Firma:" $sig.Status
Write-Host "Firmante:" $sig.SignerCertificate.Subject
