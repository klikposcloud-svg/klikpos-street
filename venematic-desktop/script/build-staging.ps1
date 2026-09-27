$ErrorActionPreference = "Stop"
$rootDir = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$desktopDir = Join-Path $rootDir "venematic-desktop"
$staging = Join-Path $desktopDir "build-staging"

Write-Output "Limpiando directorio staging: $staging"
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

# Copiar aplicación standalone Next.js compilada más reciente (desde raíz)
Write-Output "Copiando aplicación standalone Next.js compilada..."
if (Test-Path "$rootDir\.next\standalone\server.js") {
    Copy-Item "$rootDir\.next\standalone\server.js" "$staging\server.js" -Force
    Copy-Item "$rootDir\.next\standalone\package.json" "$staging\package.json" -Force
    Copy-Item -Recurse "$rootDir\.next\standalone\.next" "$staging\.next" -Force
    Copy-Item -Recurse "$rootDir\.next\standalone\node_modules" "$staging\node_modules" -Force
    Copy-Item -Recurse "$rootDir\.next\static" "$staging\.next\static" -Force
    Copy-Item -Recurse "$rootDir\public" "$staging\public" -Force
} else {
    Copy-Item "$desktopDir\.next\standalone\server.js" "$staging\server.js" -Force
    Copy-Item "$desktopDir\.next\standalone\package.json" "$staging\package.json" -Force
    Copy-Item -Recurse "$desktopDir\.next\standalone\.next" "$staging\.next" -Force
    Copy-Item -Recurse "$desktopDir\.next\standalone\node_modules" "$staging\node_modules" -Force
    Copy-Item -Recurse "$desktopDir\.next\static" "$staging\.next\static" -Force
    Copy-Item -Recurse "$desktopDir\public" "$staging\public" -Force
}

# Garantizar logos oficiales de marca
if (Test-Path "$rootDir\public\brand") {
    New-Item -ItemType Directory -Path "$staging\public\brand" -Force | Out-Null
    Copy-Item -Recurse -Force "$rootDir\public\brand\*" "$staging\public\brand\"
}

Write-Output "Staging de KlikPOS Enterprise completado exitosamente!"
Get-ChildItem $staging | Select-Object Name, Length
