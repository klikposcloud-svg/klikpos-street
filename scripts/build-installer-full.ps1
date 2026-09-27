$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$desktopDir = Join-Path $rootDir "venematic-desktop"
$issPath = Join-Path $desktopDir "installer.iss"
$outputExeDesktop = Join-Path $desktopDir "dist-installer\KlikPOS-Enterprise-Setup-v2.4.0.exe"
$outputExeRoot = Join-Path $rootDir "dist-installer\KlikPOS-Enterprise-Setup-v2.4.0.exe"
$hashDesktop = Join-Path $desktopDir "dist-installer\VERIFICACION_HASHES.txt"
$hashRoot = Join-Path $rootDir "dist-installer\VERIFICACION_HASHES.txt"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KLIKPOS ENTERPRISE - Pipeline de Generación Instalador  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Localizar compilador Inno Setup (ISCC.exe)
$isccCandidates = @(
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
)

$isccPath = $null
foreach ($path in $isccCandidates) {
    if (Test-Path $path) {
        $isccPath = $path
        break
    }
}

if (-not $isccPath) {
    throw "No se encontró ISCC.exe en las rutas esperadas de Inno Setup 6."
}
Write-Host "[1/5] Compilador Inno Setup encontrado en: $isccPath" -ForegroundColor Green

# 2. Actualizar build-staging
Write-Host "[2/5] Actualizando directorio build-staging..." -ForegroundColor Yellow
& "$desktopDir\script\build-staging.ps1"

# 3. Compilar instalador con Inno Setup
Write-Host "[3/5] Compilando instalador Inno Setup..." -ForegroundColor Yellow
& $isccPath $issPath

if (-not (Test-Path $outputExeDesktop)) {
    throw "Error: No se generó el archivo de instalación en $outputExeDesktop"
}

# 4. Copiar instalador a dist-installer de raíz y sincronizar nombres
Copy-Item $outputExeDesktop $outputExeRoot -Force
Unblock-File -Path $outputExeDesktop -ErrorAction SilentlyContinue
Unblock-File -Path $outputExeRoot -ErrorAction SilentlyContinue

# Copias de compatibilidad para carpetas de distribución
$distRoot = Join-Path $rootDir "dist-installer"
Copy-Item $outputExeRoot (Join-Path $distRoot "Klikpos-Setup-v2.0.0.exe") -Force
Copy-Item $outputExeRoot (Join-Path $distRoot "KlikPOS_Setup_v2.4.0.exe") -Force

# 5. Calcular Hash SHA256 y actualizar archivos de verificación
Write-Host "[5/5] Calculando SHA-256 y actualizando hashes..." -ForegroundColor Yellow
$hashVal = (Get-FileHash $outputExeRoot -Algorithm SHA256).Hash

$dateStr = Get-Date -Format "dd 'de' MMMM 'de' yyyy"
$hashContent = @"
================================================================================
             INTEGRIDAD Y SUMAS DE VERIFICACION CRIPTOGRAFICA (HASHES)
================================================================================

Paquete: KlikPOS-Enterprise-Setup-v2.4.0.exe
Version: 2.4.0 (Enterprise Security Suite, Anti-BruteForce, BCV Realtime, Cloud Sync)
Fecha de emision: $dateStr

Algoritmo SHA256:
$hashVal

Para verificar la integridad del instalador en cualquier computadora:
PowerShell:
  Get-FileHash KlikPOS-Enterprise-Setup-v2.4.0.exe -Algorithm SHA256
================================================================================
"@

Set-Content -Path $hashRoot -Value $hashContent -Encoding UTF8
Set-Content -Path $hashDesktop -Value $hashContent -Encoding UTF8

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ¡Instalador KlikPOS Enterprise v2.4.0 generado con éxito!" -ForegroundColor Green
Write-Host "  SHA256: $hashVal" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
