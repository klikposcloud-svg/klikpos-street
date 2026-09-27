$ErrorActionPreference = "Stop"

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$androidDir = "$root\venematic-desktop\android"
$distDir = "$root\dist-apk"
$distFolder = "$root\DISTRIBUCION_KLIKPOS"

$env:JAVA_HOME = "C:\Users\pcpro\AppData\Local\Programs\Java\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "C:\Users\pcpro\AppData\Local\Android\Sdk"

Write-Host ">>> [1/3] Sincronizando assets web actualizados a Android..." -ForegroundColor Cyan
node "$root\scripts\enhance-and-rebrand-mobile.js"

$outputApk = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $outputApk) { Remove-Item $outputApk -Force -ErrorAction SilentlyContinue }

Write-Host ">>> [2/3] Compilando APK Móvil (KlikPOS_Movil_Full.apk / KlikPOS_Movil_Satelite.apk)..." -ForegroundColor Cyan
Set-Location $androidDir
cmd.exe /c ".\gradlew.bat assembleDebug --no-daemon"
if ($LASTEXITCODE -ne 0) {
    throw "Error compilando POS APK"
}

$outputApk = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $outputApk)) {
    throw "No se encontró el APK generado en $outputApk"
}

Write-Host ">>> [3/3] Distribuyendo APKs a dist-apk y DISTRIBUCION_KLIKPOS..." -ForegroundColor Green
$targets = @(
    "$distDir\KlikPOS_Movil_Full.apk",
    "$distDir\KlikPOS_Movil_Satelite.apk",
    "$distDir\VenematicPOS-Full-Mobile.apk",
    "$distDir\VenematicPOS-Caja-Mobile.apk",
    "$distFolder\03_Movil_Full_Autonomo\KlikPOS_Movil_Full.apk",
    "$distFolder\01_Combo_Basico_Desktop_Satelite\KlikPOS_Movil_Satelite.apk",
    "$distFolder\02_Combo_Empresarial_Full\KlikPOS_Movil_Satelite.apk"
)

foreach ($tgt in $targets) {
    Copy-Item $outputApk $tgt -Force
    Unblock-File -Path $tgt -ErrorAction SilentlyContinue
    Write-Host "  Actualizado: $tgt" -ForegroundColor Yellow
}

$hash = (Get-FileHash -Path "$distDir\KlikPOS_Movil_Full.apk" -Algorithm SHA256).Hash
Write-Host ">>> ¡APKs de KlikPOS Móvil compiladas y distribuidas con éxito!" -ForegroundColor Green
Write-Host ">>> Hash SHA-256: $hash" -ForegroundColor Green
Set-Location $root
