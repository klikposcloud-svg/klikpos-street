$ErrorActionPreference = "Stop"
$desktopDir = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop"
$staging = Join-Path $desktopDir "build-staging"

Write-Output "Limpiando directorio staging: $staging"
if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}

Write-Output "Creando directorios base..."
New-Item -ItemType Directory -Path "$staging\bin" -Force | Out-Null

Write-Output "Copiando binarios del runtime portable..."
Copy-Item "C:\Program Files\nodejs\node.exe" "$staging\bin\node.exe" -Force
Copy-Item "$desktopDir\launcher\VenematicPOS.exe" "$staging\VenematicPOS.exe" -Force
Copy-Item "$desktopDir\launcher\app.ico" "$staging\app.ico" -Force
Copy-Item "$desktopDir\launcher\detener-venematic.bat" "$staging\detener-venematic.bat" -Force
Copy-Item "$desktopDir\launcher\iniciar-venematic.bat" "$staging\iniciar-venematic.bat" -Force

Write-Output "Copiando aplicacion standalone Next.js compilada..."
Copy-Item "$desktopDir\.next\standalone\server.js" "$staging\server.js" -Force
Copy-Item "$desktopDir\.next\standalone\package.json" "$staging\package.json" -Force

Copy-Item -Recurse "$desktopDir\.next\standalone\.next" "$staging\.next" -Force
Copy-Item -Recurse "$desktopDir\.next\standalone\node_modules" "$staging\node_modules" -Force
Copy-Item -Recurse "$desktopDir\.next\static" "$staging\.next\static" -Force
Copy-Item -Recurse "$desktopDir\public" "$staging\public" -Force

Write-Output "Staging completado exitosamente!"
Get-ChildItem $staging | Select-Object Name, Length
