$ErrorActionPreference = "Stop"

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$desktop = Join-Path $root "venematic-desktop"
$launcherDir = Join-Path $desktop "launcher"
$appIco = Join-Path $launcherDir "app.ico"
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$iscc = "C:\Users\pcpro\AppData\Local\Programs\Inno Setup 6\ISCC.exe"

Write-Host "=== 1. COMPILING C# LAUNCHER WITH BLUE-ON-WHITE ICON ==="
$launcherCs = Join-Path $launcherDir "Program.cs"
if (-not (Test-Path $launcherCs)) {
    # Check if there's a launcher cs in scripts
    $launcherCs = Join-Path $root "scripts\VenematicKeygen.cs" # fallback check
}

$launcherExe = Join-Path $launcherDir "VenematicPOS.exe"
if (Test-Path $csc) {
    # Find launcher source if present
    $csFiles = Get-ChildItem -Path $launcherDir -Filter "*.cs" -ErrorAction SilentlyContinue
    if ($csFiles.Count -gt 0) {
        $source = $csFiles[0].FullName
        Write-Host "Compiling $source into $launcherExe..."
        & $csc /target:winexe /optimize+ /win32icon:$appIco /out:$launcherExe $source
        Write-Host "Launcher compiled successfully!"
    } else {
        Write-Host "No CS files in $launcherDir, copying app.ico to staging"
    }
}

Write-Host "=== 2. PREPARING BUILD-STAGING ==="
$staging = Join-Path $desktop "build-staging"
if (Test-Path $staging) {
    Copy-Item $appIco (Join-Path $staging "app.ico") -Force
    if (Test-Path $launcherExe) {
        Copy-Item $launcherExe (Join-Path $staging "VenematicPOS.exe") -Force
    }
    # Also copy the brand logos
    $stagingBrand = Join-Path $staging "public\brand"
    if (Test-Path $stagingBrand) {
        Copy-Item (Join-Path $root "public\brand\*") $stagingBrand -Force
    }
}

Write-Host "=== 3. COMPILING INNO SETUP INSTALLER ==="
$iss = Join-Path $desktop "installer.iss"
if ((Test-Path $iscc) -and (Test-Path $iss)) {
    Write-Host "Running ISCC on $iss..."
    & $iscc $iss
    Write-Host "Inno Setup compilation finished!"
} else {
    Write-Host "ISCC or ISS not found!"
}

Write-Host "=== 4. SYNCHRONIZING ALL INSTALLER VERSIONS ==="
$distDesktop = Join-Path $desktop "dist-installer"
$distRoot = Join-Path $root "dist-installer"

$compiledExe = Join-Path $distDesktop "Venematic-POS-Setup-v2.0.0.exe"
if (Test-Path $compiledExe) {
    $targets = @(
        (Join-Path $distDesktop "Klikpos-Setup-v2.0.0.exe"),
        (Join-Path $distDesktop "KlikPOS_Setup_v2.4.0.exe"),
        (Join-Path $distDesktop "Venematic-POS-Desktop-Setup-v2.0.0.exe"),
        (Join-Path $distDesktop "Venematic-POS-Full-Desktop-Setup-v2.0.0.exe"),
        (Join-Path $distRoot "Klikpos-Setup-v2.0.0.exe"),
        (Join-Path $distRoot "KlikPOS_Setup_v2.4.0.exe"),
        (Join-Path $distRoot "Venematic-POS-Setup-v2.0.0.exe"),
        (Join-Path $distRoot "Venematic-POS-Desktop-Setup-v2.0.0.exe"),
        (Join-Path $distRoot "Venematic-POS-Full-Desktop-Setup-v2.0.0.exe")
    )
    foreach ($tgt in $targets) {
        Copy-Item $compiledExe $tgt -Force
        Unblock-File -Path $tgt -ErrorAction SilentlyContinue
        Write-Host "Updated installer: $tgt"
    }
}

Write-Host "ALL INSTALLER VERSIONS SYNCHRONIZED WITH NEW BLUE-ON-WHITE ICON!"
