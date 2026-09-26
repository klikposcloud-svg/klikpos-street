$ErrorActionPreference = "Stop"

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$androidDir = "$root\venematic-desktop\android"
$distDir = "$root\dist-apk"

$env:JAVA_HOME = "C:\Users\pcpro\AppData\Local\Programs\Java\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "C:\Users\pcpro\AppData\Local\Android\Sdk"

Write-Host ">>> Compilando APK de Caja / Mostrador (VenematicPOS-Caja-Mobile.apk)..." -ForegroundColor Cyan
Set-Location $androidDir
cmd.exe /c ".\gradlew.bat assembleDebug"
if ($LASTEXITCODE -ne 0) {
    throw "Error compilando POS APK"
}

$outputApk = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
$targetApk = "$distDir\VenematicPOS-Caja-Mobile.apk"
Copy-Item $outputApk $targetApk -Force

$hash = (Get-FileHash -Path $targetApk -Algorithm SHA256).Hash
Write-Host ">>> ¡VenematicPOS-Caja-Mobile.apk compilada con éxito!" -ForegroundColor Green
Write-Host ">>> Hash SHA-256: $hash" -ForegroundColor Green
Set-Location $root
