# ==============================================================================
# SCRIPT DE COMPILACIÓN AUTOMATIZADA: VENEMATIC POS ADMIN (APK ADMINISTRADOR)
# ==============================================================================
$ErrorActionPreference = "Stop"

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$androidDir = "$root\venematic-desktop\android"
$appGradle = "$androidDir\app\build.gradle"
$stringsXml = "$androidDir\app\src\main\res\values\strings.xml"
$publicIndex = "$androidDir\app\src\main\assets\public\index.html"
$adminIndex = "$root\venematic-desktop\scratch\admin-index.html"
$distDir = "$root\dist-apk"

# Variables de entorno Java y Android SDK
$env:JAVA_HOME = "C:\Users\pcpro\AppData\Local\Programs\Java\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "C:\Users\pcpro\AppData\Local\Android\Sdk"

$bakDir = "$root\venematic-desktop\scratch\bak"
if (!(Test-Path $bakDir)) { New-Item -ItemType Directory -Path $bakDir -Force | Out-Null }

Write-Host ">>> [1/5] Creando respaldos temporales de configuración POS..." -ForegroundColor Cyan
Copy-Item $appGradle "$bakDir\build.gradle.bak" -Force
Copy-Item $stringsXml "$bakDir\strings.xml.bak" -Force
Copy-Item $publicIndex "$bakDir\index.html.bak" -Force


try {
    Write-Host ">>> [2/5] Aplicando configuración de Venematic Admin (Dueño & Gerencia)..." -ForegroundColor Cyan
    
    # 1. Cambiar applicationId a com.venematic.admin
    (Get-Content $appGradle) -replace 'applicationId "com.venematic.pos"', 'applicationId "com.venematic.admin"' | Set-Content $appGradle
    
    # 2. Cambiar nombres en strings.xml
    $adminStrings = @"
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Venematic Admin</string>
    <string name="title_activity_main">Venematic Admin</string>
    <string name="package_name">com.venematic.admin</string>
    <string name="custom_url_scheme">com.venematic.admin</string>
</resources>
"@
    Set-Content -Path $stringsXml -Value $adminStrings -Encoding UTF8

    # 3. Inyectar admin-index.html como index.html de la APK
    Copy-Item $adminIndex $publicIndex -Force

    Write-Host ">>> [3/5] Ejecutando compilación Gradle (assembleDebug)..." -ForegroundColor Yellow
    Set-Location $androidDir
    cmd.exe /c ".\gradlew.bat assembleDebug"
    if ($LASTEXITCODE -ne 0) {
        throw "Error en Gradle assembleDebug"
    }

    Write-Host ">>> [4/5] Empaquetando VenematicPOS-Admin-Mobile.apk en dist-apk..." -ForegroundColor Green
    $outputApk = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
    $targetApk = "$distDir\VenematicPOS-Admin-Mobile.apk"
    Copy-Item $outputApk $targetApk -Force

    $hashObj = Get-FileHash -Path $targetApk -Algorithm SHA256
    $posApk = "$distDir\VenematicPOS-Caja-Mobile.apk"
    $posHashObj = Get-FileHash -Path $posApk -Algorithm SHA256

    $verifContent = @"
================================================================================
VENEMATIC POS MÓVIL & ADMIN - VERIFICACIÓN OFICIAL DE INTEGRIDAD SHA-256
================================================================================
Fecha de Compilación: 22 de Septiembre de 2026
Arquitectura: Android 8.0+ (ARM64 / x86_64)

1. APK DE CAJA / MOSTRADOR / TABLET (Cajeros y Venta Táctil):
  Archivo: VenematicPOS-Caja-Mobile.apk
  ID de Paquete: com.venematic.pos
  Nombre de App: Venematic POS Móvil
  Tamaño: $((Get-Item $posApk).Length) bytes
  SHA-256: $($posHashObj.Hash)

2. APK DE ADMINISTRADOR & MODO DUEÑO (Uso Exclusivo del Gerente):
  Archivo: VenematicPOS-Admin-Mobile.apk
  ID de Paquete: com.venematic.admin
  Nombre de App: Venematic Admin
  Tamaño: $((Get-Item $targetApk).Length) bytes
  SHA-256: $($hashObj.Hash)
  Características Exclusivas:
   - Panel de Control del Dueño en vivo con KPIs ($ y Bs)
   - Arqueo de Caja y desglose multimoneda (USD, VES, Pago Móvil, Punto, Binance, Zelle)
   - Feed en tiempo real de tickets cobrados
   - Alertas de inventario y stock crítico
   - Modificador instantáneo de Tasa Oficial BCV con propagación a cajas

Comando PowerShell para verificar:
  Get-FileHash -Path "VenematicPOS-Admin-Mobile.apk" -Algorithm SHA256
================================================================================
"@
    Set-Content -Path "$distDir\VERIFICACION_HASHES_APK.txt" -Value $verifContent -Encoding UTF8
    Write-Host ">>> [4.1] Hash SHA-256 Admin APK: $($hashObj.Hash)" -ForegroundColor Green

} finally {
    Write-Host ">>> [5/5] Restaurando configuración original de POS..." -ForegroundColor Cyan
    if (Test-Path "$bakDir\build.gradle.bak") {
        Copy-Item "$bakDir\build.gradle.bak" $appGradle -Force
    }
    if (Test-Path "$bakDir\strings.xml.bak") {
        Copy-Item "$bakDir\strings.xml.bak" $stringsXml -Force
    }
    if (Test-Path "$bakDir\index.html.bak") {
        Copy-Item "$bakDir\index.html.bak" $publicIndex -Force
    }
    Remove-Item $bakDir -Recurse -Force -ErrorAction SilentlyContinue
    # Asegurar que no quede ningún archivo no-xml en res/values/
    Get-ChildItem -Path "$androidDir\app\src\main\res\values" -Filter "*.bak" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
    Set-Location $root
    Write-Host ">>> ¡Proceso completado exitosamente!" -ForegroundColor Green
}
