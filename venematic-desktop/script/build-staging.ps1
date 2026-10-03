param(
    [string]$Edition = "KLIKPOS_ELITE"
)

$ErrorActionPreference = "Stop"
$rootDir = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$desktopDir = Join-Path $rootDir "venematic-desktop"
$staging = Join-Path $desktopDir "build-staging"

Write-Output "Iniciando Staging de KlikPOS ($Edition) en: $staging"
if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}

Write-Output "Creando directorios base..."
New-Item -ItemType Directory -Path "$staging\bin" -Force | Out-Null

Write-Output "Copiando binarios del runtime portable..."
Copy-Item "C:\Program Files\nodejs\node.exe" "$staging\bin\node.exe" -Force

# Binarios y Lanzadores de KlikPOS
Copy-Item "$desktopDir\launcher\KlikPOS.exe" "$staging\KlikPOS.exe" -Force
Copy-Item "$desktopDir\launcher\KlikPOS.exe" "$staging\VenematicPOS.exe" -Force
Copy-Item "$desktopDir\launcher\app.ico" "$staging\app.ico" -Force
Copy-Item "$desktopDir\launcher\detener-klikpos.bat" "$staging\detener-klikpos.bat" -Force
Copy-Item "$desktopDir\launcher\iniciar-klikpos.bat" "$staging\iniciar-klikpos.bat" -Force
Copy-Item "$desktopDir\launcher\detener-venematic.bat" "$staging\detener-venematic.bat" -Force
Copy-Item "$desktopDir\launcher\iniciar-venematic.bat" "$staging\iniciar-venematic.bat" -Force

# Copiar aplicación standalone Next.js compilada más reciente (desde raíz) con robocopy de alta velocidad
Write-Output "Copiando aplicación standalone Next.js compilada..."
function Fast-CopyDir($src, $dst) {
    if (Test-Path $src) {
        New-Item -ItemType Directory -Path $dst -Force | Out-Null
        robocopy $src $dst /E /NFL /NDL /NJH /NJS /nc /ns /np /r:1 /w:1 | Out-Null
    }
}

if (Test-Path "$rootDir\.next\standalone\server.js") {
    Copy-Item "$rootDir\.next\standalone\server.js" "$staging\server.js" -Force
    Copy-Item "$rootDir\.next\standalone\package.json" "$staging\package.json" -Force
    Fast-CopyDir "$rootDir\.next\standalone\.next" "$staging\.next"
    Fast-CopyDir "$rootDir\.next\standalone\node_modules" "$staging\node_modules"
    Fast-CopyDir "$rootDir\.next\static" "$staging\.next\static"
    Fast-CopyDir "$rootDir\public" "$staging\public"
} else {
    Copy-Item "$desktopDir\.next\standalone\server.js" "$staging\server.js" -Force
    Copy-Item "$desktopDir\.next\standalone\package.json" "$staging\package.json" -Force
    Fast-CopyDir "$desktopDir\.next\standalone\.next" "$staging\.next"
    Fast-CopyDir "$desktopDir\.next\standalone\node_modules" "$staging\node_modules"
    Fast-CopyDir "$desktopDir\.next\static" "$staging\.next\static"
    Fast-CopyDir "$desktopDir\public" "$staging\public"
}

# Garantizar logos oficiales de marca
if (Test-Path "$rootDir\public\brand") {
    Fast-CopyDir "$rootDir\public\brand" "$staging\public\brand"
}

# Inyectar Preset de Edición en el staging
$editionPayload = @{ edition = $Edition } | ConvertTo-Json
Set-Content -Path "$staging\preset-edition.json" -Value $editionPayload -Encoding UTF8
Set-Content -Path "$staging\public\preset-edition.json" -Value $editionPayload -Encoding UTF8

Write-Output "Staging de KlikPOS ($Edition) completado exitosamente!"
Get-ChildItem $staging | Select-Object Name, Length
