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

# 1.1 Compilación fresca de Next.js Standalone (Estricto Zero-Regresiones)
Write-Host "`n>>> [COMPILANDO NEXT.JS STANDALONE FRESCO] npm run build..." -ForegroundColor Magenta
Push-Location $rootDir
& cmd /c "npm run build"
Pop-Location
if ($LASTEXITCODE -ne 0) {
    throw "Error fatal durante npm run build. Abortando empaquetado."
}


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

# 3. Directorio de Distribución Oficial: "KlikPOS Release"
$releaseRoot = Join-Path $rootDir "KlikPOS Release"
$liteFolder = Join-Path $releaseRoot "01_KlikPOS_Lite_Desktop"
$proFolder = Join-Path $releaseRoot "02_KlikPOS_Pro_Desktop"
$eliteFolder = Join-Path $releaseRoot "03_KlikPOS_Elite_Desktop"
$mobileFolder = Join-Path $releaseRoot "04_Apps_Moviles_Android"
$devFolder = Join-Path $releaseRoot "00_Herramientas_Desarrollador"

@($releaseRoot, $liteFolder, $proFolder, $eliteFolder, $mobileFolder, $devFolder) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

# 4. Compilar las 3 Ediciones de Escritorio (Lite, Pro, Elite)
$editions = @(
    @{ Name = "KlikPOS Lite"; Edition = "KLIKPOS_LITE"; ExeName = "KlikPOS_Lite_Setup.exe"; TargetDir = $liteFolder; Desc = "Edición esencial para bodegas y comercios pequeños (Ventas, Corte Z/X e Impresión)" },
    @{ Name = "KlikPOS Pro"; Edition = "KLIKPOS_PRO"; ExeName = "KlikPOS_Pro_Setup.exe"; TargetDir = $proFolder; Desc = "Edición comercial con Escáner Celular Satélite y Métricas Profesionales" },
    @{ Name = "KlikPOS Elite"; Edition = "KLIKPOS_ELITE"; ExeName = "KlikPOS_Elite_Setup.exe"; TargetDir = $eliteFolder; Desc = "Edición total con Vistas Gourmet, Mesas, Delivery, Temas Personalizables y Finanzas" }
)

foreach ($ed in $editions) {
    Write-Host "`n>>> [COMPILANDO] $($ed.Name) ($($ed.Edition))..." -ForegroundColor Cyan
    
    # a. Actualizar Staging con el preset de edición
    & "$desktopDir\script\build-staging.ps1" -Edition $ed.Edition
    
    # b. Compilar instalador con Inno Setup directamente al directorio destino
    $outBase = [System.IO.Path]::GetFileNameWithoutExtension($ed.ExeName)
    & $isccPath "/O$($ed.TargetDir)" "/F$outBase" "/DAppName=$($ed.Name)" "/DAppEdition=$($ed.Edition)" "/DAppVersion=$version" $issPath
    
    $targetExe = Join-Path $ed.TargetDir $ed.ExeName
    if (-not (Test-Path $targetExe)) {
        throw "Error: No se genero el archivo de instalacion en $targetExe"
    }
    Unblock-File -Path $targetExe -ErrorAction SilentlyContinue
    
    # d. Crear BAT de instalación directa y LEEME
    $batContent = "@echo off`r`ntitle Instalador $($ed.Name) v$version`r`necho ===============================================================`r`necho   INSTALADOR OFICIAL: $($ed.Name) v$version`r`necho ===============================================================`r`nstart `"`" `"%~dp0$($ed.ExeName)`"`r`nexit`r`n"
    Set-Content -Path (Join-Path $ed.TargetDir "INSTALAR_$($ed.Edition).bat") -Value $batContent -Encoding ASCII
    
    $readmeLines = @(
        "================================================================================",
        "                    GUIA OFICIAL: $($ed.Name) v$version",
        "================================================================================",
        "$($ed.Desc)",
        "",
        "ARCHIVO DE INSTALACION:",
        "- $($ed.ExeName)",
        "",
        "INSTRUCCIONES:",
        "1. Haga doble clic en $($ed.ExeName) o ejecute INSTALAR_$($ed.Edition).bat.",
        "2. Siga los pasos del asistente de instalacion.",
        "3. El sistema creara los accesos directos oficiales en su Escritorio.",
        "================================================================================"
    )
    $readmeContent = $readmeLines -join "`r`n"
    Set-Content -Path (Join-Path $ed.TargetDir "LEEME_$($ed.Edition).txt") -Value $readmeContent -Encoding UTF8
    
    Write-Host " [OK] $($ed.Name) generado exitosamente en: $targetExe" -ForegroundColor Green
}

# 5. Sincronización de compatibilidad en dist-installer y DISTRIBUCION_KLIKPOS
Write-Host "`n[5/7] Sincronizando copias de compatibilidad..." -ForegroundColor Yellow
$distRoot = Join-Path $rootDir "dist-installer"
$eliteExe = Join-Path $eliteFolder "KlikPOS_Elite_Setup.exe"

Copy-Item $eliteExe (Join-Path $distRoot "KlikPOS-Enterprise-Setup-v$version.exe") -Force
Copy-Item $eliteExe (Join-Path $distRoot "KlikPOS_Desktop_Full_Setup.exe") -Force
Copy-Item $eliteExe (Join-Path $distRoot "KlikPOS-Enterprise-Setup-v2.4.0.exe") -Force

$combo2 = Join-Path $rootDir "DISTRIBUCION_KLIKPOS\02_Combo_Empresarial_Full\KlikPOS_Desktop_Full_Setup.exe"
if (Test-Path (Split-Path $combo2)) { Copy-Item $eliteExe $combo2 -Force }

# 6. Calcular Hashes SHA256 de todas las ediciones
Write-Host "[6/7] Calculando SHA-256 universal..." -ForegroundColor Yellow
$hashLines = @()
$hashLines += "================================================================================"
$hashLines += "       INTEGRIDAD Y SUMAS DE VERIFICACION CRIPTOGRAFICA (KLIKPOS SUITE)"
$hashLines += "================================================================================"
$hashLines += "Version: $version"
$hashLines += "Fecha: $(Get-Date -Format 'dd de MMMM de yyyy')"
$hashLines += ""

foreach ($ed in $editions) {
    $exePath = Join-Path $ed.TargetDir $ed.ExeName
    $hash = (Get-FileHash $exePath -Algorithm SHA256).Hash
    $hashLines += "[$($ed.Name)] $($ed.ExeName):"
    $hashLines += "SHA256: $hash"
    $hashLines += ""
}

$hashReport = $hashLines -join "`r`n"
Set-Content -Path (Join-Path $releaseRoot "VERIFICACION_HASHES.txt") -Value $hashReport -Encoding UTF8
Set-Content -Path $hashRoot -Value $hashReport -Encoding UTF8

# 7. Publicación en GitHub Releases
Write-Host "[7/7] Sincronizando nube y publicando en GitHub Releases..." -ForegroundColor Yellow
& node (Join-Path $PSScriptRoot "publish-release-to-github.js")

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  ¡SUITE COMPLETA KLIKPOS RELEASE v$version GENERADA CON ÉXITO!" -ForegroundColor Green
Write-Host "  Carpeta de entrega: $releaseRoot" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
