$ErrorActionPreference = "Stop"

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$distBase = Join-Path $root "DISTRIBUCION_KLIKPOS"

$combo1 = Join-Path $distBase "01_Combo_Basico_Desktop_Satelite"
$combo2 = Join-Path $distBase "02_Combo_Empresarial_Full"
$movilFullDir = Join-Path $distBase "03_Movil_Full_Autonomo"

New-Item -ItemType Directory -Force -Path $combo1 | Out-Null
New-Item -ItemType Directory -Force -Path $combo2 | Out-Null
New-Item -ItemType Directory -Force -Path $movilFullDir | Out-Null

$srcAdminApk = Join-Path $root "dist-apk\Klikpos-Admin-Mobile.apk"
$srcSateliteApk = Join-Path $root "dist-apk\VenematicPOS-Caja-Mobile.apk"
$srcFullApk = Join-Path $root "dist-apk\VenematicPOS-Full-Mobile.apk"

$srcDesktop = Join-Path $root "dist-installer\Klikpos-Setup-v2.0.0.exe"
$srcDesktopFull = Join-Path $root "dist-installer\KlikPOS_Setup_v2.4.0.exe"

Write-Host "=== SINCRONIZANDO DISTRIBUCION OFICIAL KLIKPOS ==="

# 01 Combo Basico
Write-Host "Copiando Combo Basico..."
Copy-Item -Path $srcDesktop -Destination (Join-Path $combo1 "KlikPOS_Desktop_Setup.exe") -Force
Copy-Item -Path $srcSateliteApk -Destination (Join-Path $combo1 "KlikPOS_Movil_Satelite.apk") -Force

# 02 Combo Empresarial Full
Write-Host "Copiando Combo Empresarial Full..."
Copy-Item -Path $srcDesktopFull -Destination (Join-Path $combo2 "KlikPOS_Desktop_Full_Setup.exe") -Force
Copy-Item -Path $srcSateliteApk -Destination (Join-Path $combo2 "KlikPOS_Movil_Satelite.apk") -Force
Copy-Item -Path $srcAdminApk -Destination (Join-Path $combo2 "KlikPOS_Movil_Administrador.apk") -Force

# 03 Movil Full Autonomo
Write-Host "Copiando Movil Full Autonomo..."
Copy-Item -Path $srcFullApk -Destination (Join-Path $movilFullDir "KlikPOS_Movil_Full.apk") -Force

Write-Host "ESTRUCTURA DE DISTRIBUCION ACTUALIZADA SATISFACTORIAMENTE"
Get-ChildItem -Path $distBase -Recurse -File | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize
