$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$desktopDir = Join-Path $rootDir "venematic-desktop"
$issPath = Join-Path $desktopDir "installer.iss"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KLIKPOS ENTERPRISE - Pipeline de Generación Instalador  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Sincronizar versiones en todos los manifiestos e instaladores
Write-Host "[1/7] Sincronizando versiones universalmente..." -ForegroundColor Yellow
& node (Join-Path $PSScriptRoot "sync-version.js")

$manifestPath = Join-Path $rootDir "version.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version

Write-Host "Versión identificada: v$version" -ForegroundColor Green

$outputExeDesktop = Join-Path $desktopDir "dist-installer\KlikPOS-Enterprise-Setup-v$version.exe"
$outputExeRoot = Join-Path $rootDir "dist-installer\KlikPOS-Enterprise-Setup-v$version.exe"
$hashDesktop = Join-Path $desktopDir "dist-installer\VERIFICACION_HASHES.txt"
$hashRoot = Join-Path $rootDir "dist-installer\VERIFICACION_HASHES.txt"

# 2. Localizar compilador Inno Setup (ISCC.exe)
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
Write-Host "[2/7] Compilador Inno Setup encontrado en: $isccPath" -ForegroundColor Green

# 3. Actualizar build-staging
Write-Host "[3/7] Actualizando directorio build-staging..." -ForegroundColor Yellow
& "$desktopDir\script\build-staging.ps1"

# 4. Compilar instalador con Inno Setup
Write-Host "[4/7] Compilando instalador Inno Setup (v$version)..." -ForegroundColor Yellow
& $isccPath $issPath

if (-not (Test-Path $outputExeDesktop)) {
    throw "Error: No se generó el archivo de instalación en $outputExeDesktop"
}

# 5. Copiar instalador a dist-installer de raíz y sincronizar carpetas oficiales
Write-Host "[5/7] Sincronizando binarios en DISTRIBUCION_KLIKPOS..." -ForegroundColor Yellow
Copy-Item $outputExeDesktop $outputExeRoot -Force
Unblock-File -Path $outputExeDesktop -ErrorAction SilentlyContinue
Unblock-File -Path $outputExeRoot -ErrorAction SilentlyContinue

# Copias de compatibilidad en dist-installer
$distRoot = Join-Path $rootDir "dist-installer"
Copy-Item $outputExeRoot (Join-Path $distRoot "Klikpos-Setup-v2.0.0.exe") -Force
Copy-Item $outputExeRoot (Join-Path $distRoot "KlikPOS_Setup_v2.4.0.exe") -Force
Copy-Item $outputExeRoot (Join-Path $distRoot "KlikPOS-Enterprise-Setup-v2.4.0.exe") -Force

# Sincronizar en combos oficiales de distribución
$combo1 = Join-Path $rootDir "DISTRIBUCION_KLIKPOS\01_Combo_Basico_Desktop_Satelite\KlikPOS_Desktop_Setup.exe"
$combo2 = Join-Path $rootDir "DISTRIBUCION_KLIKPOS\02_Combo_Empresarial_Full\KlikPOS_Desktop_Full_Setup.exe"
if (Test-Path (Split-Path $combo1)) { Copy-Item $outputExeRoot $combo1 -Force }
if (Test-Path (Split-Path $combo2)) { Copy-Item $outputExeRoot $combo2 -Force }

# 6. Calcular Hash SHA256 y actualizar archivos de verificación
Write-Host "[6/7] Calculando SHA-256 y actualizando hashes..." -ForegroundColor Yellow
$hashVal = (Get-FileHash $outputExeRoot -Algorithm SHA256).Hash

$dateStr = Get-Date -Format "dd 'de' MMMM 'de' yyyy"
$hashContent = @"
================================================================================
             INTEGRIDAD Y SUMAS DE VERIFICACION CRIPTOGRAFICA (HASHES)
================================================================================

Paquete: KlikPOS-Enterprise-Setup-v$version.exe
Version: $version
Fecha de emision: $dateStr

Algoritmo SHA256:
$hashVal

Para verificar la integridad del instalador en cualquier computadora:
PowerShell:
  Get-FileHash KlikPOS-Enterprise-Setup-v$version.exe -Algorithm SHA256
================================================================================
"@

Set-Content -Path $hashRoot -Value $hashContent -Encoding UTF8
Set-Content -Path $hashDesktop -Value $hashContent -Encoding UTF8

# 7. Publicación y Sincronización Automática en la Nube (Previene fallas del actualizador)
Write-Host "[7/7] Sincronizando nube y publicando en GitHub Releases..." -ForegroundColor Yellow
& node (Join-Path $PSScriptRoot "publish-release-to-github.js")

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ¡Instalador KlikPOS Enterprise v$version generado y publicado con éxito!" -ForegroundColor Green
Write-Host "  SHA256: $hashVal" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
