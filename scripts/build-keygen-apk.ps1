$ErrorActionPreference = "Stop"

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$androidDir = "$root\venematic-desktop\android"
$appGradle = "$androidDir\app\build.gradle"
$stringsXml = "$androidDir\app\src\main\res\values\strings.xml"
$publicIndex = "$androidDir\app\src\main\assets\public\index.html"
$distDir = "$root\dist-apk"
$distFolder = "$root\DISTRIBUCION_KLIKPOS"
$devToolsFolder = "$distFolder\00_Herramientas_Desarrollador"

$env:JAVA_HOME = "C:\Users\pcpro\AppData\Local\Programs\Java\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "C:\Users\pcpro\AppData\Local\Android\Sdk"

$bakDir = "$root\venematic-desktop\scratch\bak-keygen"
if (-not (Test-Path $bakDir)) { New-Item -ItemType Directory -Path $bakDir -Force | Out-Null }
if (-not (Test-Path $devToolsFolder)) { New-Item -ItemType Directory -Path $devToolsFolder -Force | Out-Null }
if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir -Force | Out-Null }

Write-Host "[1/5] Creando respaldos temporales..." -ForegroundColor Cyan
Copy-Item $appGradle "$bakDir\build.gradle.bak" -Force
Copy-Item $stringsXml "$bakDir\strings.xml.bak" -Force
Copy-Item $publicIndex "$bakDir\index.html.bak" -Force

try {
    Write-Host "[2/5] Configurando identificador y nombre KlikPOS Keygen..." -ForegroundColor Cyan
    
    # Reemplazar applicationId
    $gradleContent = Get-Content $appGradle -Raw
    $gradleContent = $gradleContent -replace 'applicationId ".*?"', 'applicationId "com.klikpos.keygen"'
    Set-Content -Path $appGradle -Value $gradleContent -Encoding UTF8
    
    # Reemplazar strings.xml
    $xmlContent = "<?xml version='1.0' encoding='utf-8'?>`n<resources>`n    <string name=`"app_name`">KlikPOS Keygen</string>`n    <string name=`"title_activity_main`">KlikPOS Keygen</string>`n    <string name=`"package_name`">com.klikpos.keygen</string>`n    <string name=`"custom_url_scheme`">com.klikpos.keygen</string>`n</resources>"
    Set-Content -Path $stringsXml -Value $xmlContent -Encoding UTF8

    # Copiar index
    New-Item -ItemType Directory -Force -Path "$androidDir\app\src\main\assets\public" | Out-Null
    Copy-Item "$root\public\keygen-app.html" $publicIndex -Force

    Write-Host "[3/5] Compilando con Gradle (assembleDebug)..." -ForegroundColor Yellow
    Set-Location $androidDir
    cmd.exe /c ".\gradlew.bat assembleDebug --no-daemon"
    if ($LASTEXITCODE -ne 0) {
        throw "Error al compilar Gradle assembleDebug"
    }

    $outputApk = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
    if (-not (Test-Path $outputApk)) {
        throw "No se encontro el archivo APK generado en: $outputApk"
    }

    Write-Host "[4/5] Exportando KlikPOS_Keygen.apk..." -ForegroundColor Green
    $targets = @(
        "$distDir\KlikPOS_Keygen.apk",
        "$distDir\KlikPOS_Keygen_Master.apk",
        "$devToolsFolder\KlikPOS_Keygen.apk",
        "$distFolder\KlikPOS_Keygen.apk"
    )

    foreach ($tgt in $targets) {
        Copy-Item $outputApk $tgt -Force
        Unblock-File -Path $tgt -ErrorAction SilentlyContinue
        Write-Host "  OK: $tgt" -ForegroundColor Yellow
    }

    $hash = (Get-FileHash -Path "$distDir\KlikPOS_Keygen.apk" -Algorithm SHA256).Hash
    Write-Host ">>> KlikPOS Keygen APK compilado exitosamente!" -ForegroundColor Green
    Write-Host ">>> SHA-256: $hash" -ForegroundColor Green

} finally {
    Write-Host "[5/5] Restaurando configuracion previa..." -ForegroundColor Cyan
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
    Set-Location $root
}
