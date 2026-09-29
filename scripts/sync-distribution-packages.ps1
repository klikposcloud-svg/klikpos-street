$ErrorActionPreference = "Stop"

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$distBase = Join-Path $root "DISTRIBUCION_KLIKPOS"

# 1. Definicion de las 5 Carpetas Oficiales de Distribucion
$folderSatelitePC     = Join-Path $distBase "01_KlikPOS_Satelite_PC_Contingencia"
$folderDesktopFull    = Join-Path $distBase "02_Combo_Empresarial_Full"
$folderTabletStand    = Join-Path $distBase "03_KlikPOS_Tablet_Standalone_Mesas"
$folderMovilAutonomo  = Join-Path $distBase "04_KlikPOS_Movil_Full_Autonomo_Nube"
$folderMovilFullPC    = Join-Path $distBase "05_KlikPOS_Movil_Full_Para_PC"

# Crear carpetas si no existen
$allFolders = @($folderSatelitePC, $folderDesktopFull, $folderTabletStand, $folderMovilAutonomo, $folderMovilFullPC)
foreach ($f in $allFolders) {
    if (-not (Test-Path $f)) {
        New-Item -ItemType Directory -Force -Path $f | Out-Null
    }
}

# 2. Origenes de archivos binarios
$setups = Get-ChildItem -Path (Join-Path $root "dist-installer") -Filter "KlikPOS-Enterprise-Setup-*.exe" | Sort-Object Name -Descending
if ($setups.Count -gt 0) {
    $srcDesktopSetup = $setups[0].FullName
} else {
    $srcDesktopSetup = Join-Path $root "dist-installer\KlikPOS-Enterprise-Setup-v2.4.7.exe"
}
Write-Host "Instalador Desktop detectado: $srcDesktopSetup" -ForegroundColor Gray

$srcSateliteApk = Join-Path $root "dist-apk\KlikPOS_Movil_Satelite.apk"
$srcFullApk     = Join-Path $root "dist-apk\KlikPOS_Movil_Full.apk"
$srcStreetApk   = Join-Path $root "dist-apk\KlikPOS_Street.apk"
$srcTabletApk   = Join-Path $root "dist-apk\KlikPOS_Tablet_Standalone.apk"
$srcAdminApk    = Join-Path $root "dist-apk\KlikAdmin.apk"
if (-not (Test-Path $srcAdminApk)) {
    $srcAdminApk = Join-Path $root "dist-apk\Klikpos-Admin-Mobile.apk"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KLIKPOS ENTERPRISE - SINCRONIZACION DE 5 EDICIONES      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# EDICION 1: KlikPOS Movil Satelite PC
# -----------------------------------------------------------------------------
Write-Host "[1/5] Sincronizando Edicion 1: Satelite PC Contingencia..." -ForegroundColor Yellow
if (Test-Path $srcSateliteApk) {
    Copy-Item -Path $srcSateliteApk -Destination (Join-Path $folderSatelitePC "KlikPOS_Movil_Satelite.apk") -Force
}
$doc1 = @"
================================================================================
EDICION 1: KLIKPOS MOVIL SATELITE PC (CONTINGENCIA Y ESCANER)
================================================================================
* Proposito: Companion complementario de la PC para cobro con camara, auditoria 
  de inventario en anaquel y venta de contingencia cuando se corta la luz.
* Boton Central en Dock: ESCANER (Camara lectora de codigos de barra 60 FPS).
* Sincronizacion: Conectado a la PC local (LAN/Wi-Fi) y respaldo en nube Firestore.
* Instalacion: Copia o envia este archivo APK a cualquier telefono o tablet Android
  y ejecutalo habilitando 'Instalar apps de fuentes desconocidas'.
================================================================================
"@
$doc1 | Out-File -FilePath (Join-Path $folderSatelitePC "LEEME_SATELITE_PC.txt") -Encoding utf8

# -----------------------------------------------------------------------------
# EDICION 2: KlikPOS Desktop Empresarial Full PC
# -----------------------------------------------------------------------------
Write-Host "[2/5] Sincronizando Edicion 2: Desktop Empresarial PC..." -ForegroundColor Yellow
if (Test-Path $srcDesktopSetup) {
    Copy-Item -Path $srcDesktopSetup -Destination (Join-Path $folderDesktopFull "KlikPOS_Desktop_Full_Setup.exe") -Force
}
if (Test-Path $srcSateliteApk) {
    Copy-Item -Path $srcSateliteApk -Destination (Join-Path $folderDesktopFull "KlikPOS_Movil_Satelite.apk") -Force
}
if (Test-Path $srcAdminApk) {
    Copy-Item -Path $srcAdminApk -Destination (Join-Path $folderDesktopFull "KlikPOS_Movil_Administrador.apk") -Force
}

$launcherBat = @"
@echo off
title KlikPOS Enterprise Full - Instalador Directo
color 1F
cd /d "%~dp0"
echo =====================================================================
echo              Iniciando Instalador KlikPOS Enterprise Full
echo =====================================================================
echo.
echo Desbloqueando ejecutable y abriendo instalador...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -Path '.\KlikPOS_Desktop_Full_Setup.exe' -ErrorAction SilentlyContinue; Start-Process -FilePath '.\KlikPOS_Desktop_Full_Setup.exe'"
exit
"@
$launcherBat | Out-File -FilePath (Join-Path $folderDesktopFull "INSTALAR_KLIKPOS_FULL.bat") -Encoding ascii

$doc2 = @"
================================================================================
EDICION 2: KLIKPOS DESKTOP EMPRESARIAL FULL PC (WINDOWS)
================================================================================
* Proposito: Version central para computadoras de caja en Windows 10/11.
* Soporte integrado: Balanzas electronicas (Torrey, Systel, Dibal), lectoras USB,
  impresoras termicas ESC/POS (USB/Red/Serial), cajon monedero y servidor local.
* Temas visuales: Blanco Oficial Industrial WCAG AAA, Modo Oscuro Totalmente 
  Personalizable (Negro OLED, Grafito Carbon, Esmeralda, Purpura, Azul o Hex Libre)
  y Modo Esmerilado Glassmorphism.
* Instalacion: Haz doble clic en INSTALAR_KLIKPOS_FULL.bat.
================================================================================
"@
$doc2 | Out-File -FilePath (Join-Path $folderDesktopFull "LEEME_DESKTOP_EMPRESARIAL.txt") -Encoding utf8

# -----------------------------------------------------------------------------
# EDICION 3: KlikPOS Tablet / Movil Standalone
# -----------------------------------------------------------------------------
Write-Host "[3/5] Sincronizando Edicion 3: Tablet Standalone Mesas..." -ForegroundColor Yellow
$targetTabletSrc = $null
if (Test-Path $srcTabletApk) {
    $targetTabletSrc = $srcTabletApk
} elseif (Test-Path $srcStreetApk) {
    $targetTabletSrc = $srcStreetApk
}

if ($targetTabletSrc) {
    Copy-Item -Path $targetTabletSrc -Destination (Join-Path $folderTabletStand "KlikPOS_Tablet_Standalone.apk") -Force
    Copy-Item -Path $targetTabletSrc -Destination (Join-Path $folderTabletStand "KlikPOS_Tablet_Standalone_Mesas.apk") -Force
}
$doc3 = @"
================================================================================
EDICION 3: KLIKPOS TABLET / MOVIL STANDALONE (MESAS Y RESTAURANTES)
================================================================================
* Proposito: Edicion 100% INDEPENDIENTE de la computadora de escritorio.
  Disenada para restaurantes, cafeterias, pizzerias, comida rapida y autoservicio.
* Boton Central en Dock: COBRAR (CircleDollarSign con pasarela multimoneda).
* Modulos incluidos:
  - Mapa interactivo de Mesas, Barra y Cuentas para Llevar.
  - Comanda tactil con notas de cocina (ej. 'Sin cebolla', 'Termino medio').
  - Menu digital QR dinamico para clientes.
  - Cartera y registro rapido de clientes.
  - Configuracion completa de datos de Empresa (RIF, Nombre, Telefono, Direccion).
  - Configuracion de Pago Movil con selector de bancos venezolanos y copia 1-tap.
  - Pasarela de cobro multimoneda (USD, Bs. BCV, Efectivo, Debito, Zelle).
  - Tiradores laterales flotantes sutiles semi-traslucidos adaptados al branding.
================================================================================
"@
$doc3 | Out-File -FilePath (Join-Path $folderTabletStand "LEEME_TABLET_STANDALONE.txt") -Encoding utf8

# -----------------------------------------------------------------------------
# EDICION 4: KlikPOS Movil Full Autonomo
# -----------------------------------------------------------------------------
Write-Host "[4/5] Sincronizando Edicion 4: Movil Full Autonomo Retail..." -ForegroundColor Yellow
if (Test-Path $srcFullApk) {
    Copy-Item -Path $srcFullApk -Destination (Join-Path $folderMovilAutonomo "KlikPOS_Movil_Full_Autonomo.apk") -Force
}
$doc4 = @"
================================================================================
EDICION 4: KLIKPOS MOVIL FULL AUTONOMO (RETAIL NUBE 100% EN CELULAR)
================================================================================
* Proposito: Para clientes que manejan TODO su comercio exclusivamente desde su 
  telefono o tablet Android, sin requerir nunca una computadora.
* Boton Central en Dock: ESCANER (Camara lectora laser de codigos de barra).
* Modulos incluidos:
  - Venta directa retail con escaner de codigos de barra con camara del telefono.
  - Balanza digital tactil para productos pesados (kg / gramos).
  - Deteccion en vivo de SMS bancarios de Pago Movil con auto-llenado de referencia.
  - Catalogo de productos completo con busqueda, categorias y fotos.
  - Actualizacion automatica de Tasa BCV oficial (DolarAPI en vivo).
  - Sincronizacion continua de productos y ventas en Firebase Firestore 
    organizado por comercio y licencia comercial.
================================================================================
"@
$doc4 | Out-File -FilePath (Join-Path $folderMovilAutonomo "LEEME_MOVIL_AUTONOMO.txt") -Encoding utf8

# -----------------------------------------------------------------------------
# EDICION 5: KlikPOS Movil Full para PC
# -----------------------------------------------------------------------------
Write-Host "[5/5] Sincronizando Edicion 5: Movil Full para PC (Companion)..." -ForegroundColor Yellow
if (Test-Path $srcFullApk) {
    Copy-Item -Path $srcFullApk -Destination (Join-Path $folderMovilFullPC "KlikPOS_Movil_Full_PC.apk") -Force
}
$doc5 = @"
================================================================================
EDICION 5: KLIKPOS MOVIL FULL PARA PC (COMPANION TOTAL ENLAZADO)
================================================================================
* Proposito: App movil conectada al servidor local de la PC principal.
* Caracteristicas:
  - Todo el inventario de la computadora central reflejado en el telefono.
  - Permite cobrar desde cualquier rincon del local e imprimir en la caja de la PC.
  - Escaner laser para usar el telefono como pistola lectora remota hacia la PC.
  - Envio de fotos tomadas con el celular directo al formulario de producto en la PC.
================================================================================
"@
$doc5 | Out-File -FilePath (Join-Path $folderMovilFullPC "LEEME_MOVIL_FULL_PC.txt") -Encoding utf8

# -----------------------------------------------------------------------------
# GUIA GENERAL MAESTRA EN LA RAIZ DE DISTRIBUCION_KLIKPOS
# -----------------------------------------------------------------------------
$guiaMaestra = @"
================================================================================
GUIA OFICIAL DE DISTRIBUCION - KLIKPOS ENTERPRISE
================================================================================

Este directorio contiene las 5 ediciones oficiales de KlikPOS:

[01] 01_KlikPOS_Satelite_PC_Contingencia
     -> KlikPOS_Movil_Satelite.apk
     -> Companion para PC: cobro con escaner, inventario anaquel y contingencia sin luz.
     -> Boton central: ESCANER.

[02] 02_Combo_Empresarial_Full
     -> INSTALAR_KLIKPOS_FULL.bat + KlikPOS_Desktop_Full_Setup.exe
     -> Version Windows completa con balanza, lector, impresora y servidor local.
     -> Modo Oscuro personalizable (OLED, Carbon, Esmeralda, Purpura, Azul o Hex Libre).

[03] 03_KlikPOS_Tablet_Standalone_Mesas
     -> KlikPOS_Tablet_Standalone.apk
     -> 100% independiente de PC. Restaurantes, comanda, mesas, clientes y Pago Movil.
     -> Boton central: COBRAR.

[04] 04_KlikPOS_Movil_Full_Autonomo_Nube
     -> KlikPOS_Movil_Full_Autonomo.apk
     -> 100% independiente de PC. Retail, escaner camara, balanza y nube Firestore.
     -> Boton central: ESCANER.

[05] 05_KlikPOS_Movil_Full_Para_PC
     -> KlikPOS_Movil_Full_PC.apk
     -> Control y cobro remoto enlazado al servidor local de la PC principal.
     -> Boton central: ESCANER.

================================================================================
"@
$guiaMaestra | Out-File -FilePath (Join-Path $distBase "00_GUIA_OFICIAL_EDICIONES_KLIKPOS.txt") -Encoding utf8

Write-Host ">>> Sincronizacion de distribucion finalizada con exito!" -ForegroundColor Green
Get-ChildItem -Path $distBase -Recurse -File | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize
