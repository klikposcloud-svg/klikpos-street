# Comprehensive script to apply all Klik-POS official logos across the entire project
Add-Type -AssemblyName System.Drawing

$root = (Get-Location).Path
$sourceDir = Join-Path $root "Logo Klik-POS"

$srcLogoFull = Join-Path $sourceDir "klik POS Logo Full.png"
$srcLogoFullWhite = Join-Path $sourceDir "klik POS Logo Full Blanco.png"
$srcKGrafite = Join-Path $sourceDir "K logo grafite.png"
$srcKWhite = Join-Path $sourceDir "K logo white.png"

Write-Host "Verifying source files..."
if (-not (Test-Path $srcLogoFull) -or -not (Test-Path $srcLogoFullWhite) -or -not (Test-Path $srcKGrafite)) {
    Write-Error "Source files missing in $sourceDir"
    exit 1
}

# --- Helper Functions ---
function Ensure-Dir($dirPath) {
    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
    }
}

function Copy-FileSafely($src, $dest) {
    Ensure-Dir (Split-Path -Parent $dest)
    Copy-Item -Path $src -Destination $dest -Force
    Write-Host "Copied: $dest"
}

function Create-SquareBitmap {
    param(
        [string]$sourcePath,
        [int]$size,
        [float]$paddingRatio = 0.12,
        [System.Drawing.Color]$bgColor = [System.Drawing.Color]::Transparent,
        [bool]$isRound = $false,
        [int]$cornerRadius = 0
    )

    $src = [System.Drawing.Bitmap]::FromFile($sourcePath)
    $dest = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)

    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($bgColor -ne [System.Drawing.Color]::Transparent) {
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        if ($isRound) {
            $g.Clear([System.Drawing.Color]::Transparent)
            $g.FillEllipse($brush, 0, 0, $size, $size)
        } elseif ($cornerRadius -gt 0) {
            $g.Clear([System.Drawing.Color]::Transparent)
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $d = $cornerRadius * 2
            $path.AddArc(0, 0, $d, $d, 180, 90)
            $path.AddArc($size - $d, 0, $d, $d, 270, 90)
            $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
            $path.AddArc(0, $size - $d, $d, $d, 90, 90)
            $path.CloseFigure()
            $g.FillPath($brush, $path)
            $path.Dispose()
        } else {
            $g.FillRectangle($brush, 0, 0, $size, $size)
        }
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $availW = $size * (1.0 - 2 * $paddingRatio)
    $availH = $size * (1.0 - 2 * $paddingRatio)

    $scale = [Math]::Min($availW / $src.Width, $availH / $src.Height)
    $drawW = [int]($src.Width * $scale)
    $drawH = [int]($src.Height * $scale)
    $drawX = [int](($size - $drawW) / 2)
    $drawY = [int](($size - $drawH) / 2)

    $g.DrawImage($src, $drawX, $drawY, $drawW, $drawH)

    $g.Dispose()
    $src.Dispose()

    return $dest
}

function Create-CenteredSplash {
    param(
        [string]$sourcePath,
        [int]$width,
        [int]$height,
        [float]$scaleRatio = 0.5,
        [System.Drawing.Color]$bgColor = [System.Drawing.Color]::White
    )

    $src = [System.Drawing.Bitmap]::FromFile($sourcePath)
    $dest = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)

    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $brush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($brush, 0, 0, $width, $height)
    $brush.Dispose()

    $availW = $width * $scaleRatio
    $availH = $height * $scaleRatio
    $scale = [Math]::Min($availW / $src.Width, $availH / $src.Height)
    $drawW = [int]($src.Width * $scale)
    $drawH = [int]($src.Height * $scale)
    $drawX = [int](($width - $drawW) / 2)
    $drawY = [int](($height - $drawH) / 2)

    $g.DrawImage($src, $drawX, $drawY, $drawW, $drawH)

    $g.Dispose()
    $src.Dispose()

    return $dest
}

function Save-PngBitmap {
    param(
        [System.Drawing.Bitmap]$bmp,
        [string]$destPath
    )
    Ensure-Dir (Split-Path -Parent $destPath)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated PNG: $destPath ($($bmp.Width)x$($bmp.Height))"
}

function Save-IcoFromBitmaps {
    param(
        [System.Drawing.Bitmap[]]$bitmaps,
        [string]$destPath
    )

    Ensure-Dir (Split-Path -Parent $destPath)
    $pngStreams = @()
    foreach ($b in $bitmaps) {
        $ms = New-Object System.IO.MemoryStream
        $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngStreams += $ms
    }

    $count = $bitmaps.Count
    $fs = New-Object System.IO.FileStream($destPath, [System.IO.FileMode]::Create)
    $bw = New-Object System.IO.BinaryWriter($fs)

    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]$count)

    $offset = 6 + (16 * $count)
    for ($i = 0; $i -lt $count; $i++) {
        $b = $bitmaps[$i]
        $w = if ($b.Width -ge 256) { 0 } else { [byte]$b.Width }
        $h = if ($b.Height -ge 256) { 0 } else { [byte]$b.Height }
        $bytesInRes = [uint32]$pngStreams[$i].Length

        $bw.Write([byte]$w)
        $bw.Write([byte]$h)
        $bw.Write([byte]0)
        $bw.Write([byte]0)
        $bw.Write([uint16]1)
        $bw.Write([uint16]32)
        $bw.Write([uint32]$bytesInRes)
        $bw.Write([uint32]$offset)

        $offset += $bytesInRes
    }

    for ($i = 0; $i -lt $count; $i++) {
        $bytes = $pngStreams[$i].ToArray()
        $bw.Write($bytes)
        $pngStreams[$i].Dispose()
    }

    $bw.Flush()
    $bw.Close()
    $fs.Close()
    Write-Host "Generated ICO: $destPath with $count frames"
}

Write-Host "=== 1. COPYING BRAND LOGOS ==="

# Brand targets for White Logo (dark theme / dark headers)
$whiteLogoTargets = @(
    (Join-Path $root "public\brand\klikpos-logo-white.png"),
    (Join-Path $root "public\klikpos-logo-white.png"),
    (Join-Path $root "venematic-desktop\public\brand\klikpos-logo-white.png"),
    (Join-Path $root "venematic-desktop\public\klikpos-logo-white.png"),
    (Join-Path $root "venematic-desktop\android\app\src\main\assets\public\brand\klikpos-logo-white.png"),
    (Join-Path $root "landing\klikpos-logo-white.png")
)
foreach ($t in $whiteLogoTargets) {
    Copy-FileSafely $srcLogoFullWhite $t
}

# Brand targets for Dark Logo (light theme / standard)
$darkLogoTargets = @(
    (Join-Path $root "public\brand\klikpos-logo-dark.png"),
    (Join-Path $root "public\brand\klikpos-logo.png"),
    (Join-Path $root "public\klikpos-logo.png"),
    (Join-Path $root "venematic-desktop\public\brand\klikpos-logo-dark.png"),
    (Join-Path $root "venematic-desktop\public\brand\klikpos-logo.png"),
    (Join-Path $root "venematic-desktop\public\klikpos-logo.png"),
    (Join-Path $root "venematic-desktop\android\app\src\main\assets\public\brand\klikpos-logo-dark.png"),
    (Join-Path $root "venematic-desktop\android\app\src\main\assets\public\brand\klikpos-logo.png"),
    (Join-Path $root "landing\klikpos-logo-dark.png"),
    (Join-Path $root "landing\klikpos-logo.png")
)
foreach ($t in $darkLogoTargets) {
    Copy-FileSafely $srcLogoFull $t
}

# Brand targets for K Isotypes
$kGrafiteTargets = @(
    (Join-Path $root "public\brand\klikpos-icon-grafite.png"),
    (Join-Path $root "venematic-desktop\public\brand\klikpos-icon-grafite.png")
)
foreach ($t in $kGrafiteTargets) {
    Copy-FileSafely $srcKGrafite $t
}

$kWhiteTargets = @(
    (Join-Path $root "public\brand\klikpos-icon-white.png"),
    (Join-Path $root "venematic-desktop\public\brand\klikpos-icon-white.png")
)
foreach ($t in $kWhiteTargets) {
    Copy-FileSafely $srcKWhite $t
}

# High-res 512x512 K icon for klikpos-icon-blue / app icon
$k512 = Create-SquareBitmap -sourcePath $srcKGrafite -size 512 -paddingRatio 0.10
Save-PngBitmap $k512 (Join-Path $root "public\brand\klikpos-icon-blue.png")
Save-PngBitmap $k512 (Join-Path $root "venematic-desktop\public\brand\klikpos-icon-blue.png")
Save-PngBitmap $k512 (Join-Path $root "venematic-desktop\android\app\src\main\assets\public\brand\klikpos-icon-blue.png")
$k512.Dispose()

Write-Host "=== 2. GENERATING PWA ICONS ==="
$pwaSizes = @(72, 96, 128, 144, 152, 192, 384, 512)
foreach ($sz in $pwaSizes) {
    $bmp = Create-SquareBitmap -sourcePath $srcKGrafite -size $sz -paddingRatio 0.10
    Save-PngBitmap $bmp (Join-Path $root "public\icons\icon-$sz.png")
    Save-PngBitmap $bmp (Join-Path $root "venematic-desktop\public\icons\icon-$sz.png")
    $bmp.Dispose()
}

Write-Host "=== 3. GENERATING TAURI ICONS ==="
$tauri512 = Create-SquareBitmap -sourcePath $srcKGrafite -size 512 -paddingRatio 0.10
Save-PngBitmap $tauri512 (Join-Path $root "venematic-desktop\src-tauri\icons\icon.png")
$tauri512.Dispose()

Write-Host "=== 4. GENERATING FAVICONS ==="
$icoSizes = @(16, 24, 32, 48, 64, 128, 256)
$icoBmps = @()
foreach ($sz in $icoSizes) {
    $icoBmps += (Create-SquareBitmap -sourcePath $srcKGrafite -size $sz -paddingRatio 0.08)
}

$favTargets = @(
    (Join-Path $root "public\favicon.ico"),
    (Join-Path $root "venematic-desktop\public\favicon.ico"),
    (Join-Path $root "landing\favicon.ico"),
    (Join-Path $root "venematic-desktop\android\app\src\main\assets\public\favicon.ico"),
    (Join-Path $root "venematic-desktop\src-tauri\icons\icon.ico")
)
foreach ($ft in $favTargets) {
    Save-IcoFromBitmaps -bitmaps $icoBmps -destPath $ft
}
foreach ($b in $icoBmps) { $b.Dispose() }

Write-Host "=== 5. GENERATING ANDROID LAUNCHER MIPMAPS ==="
# Densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
$densities = @(
    @{ Name="mipmap-mdpi"; Full=48; Fore=108 },
    @{ Name="mipmap-hdpi"; Full=72; Fore=162 },
    @{ Name="mipmap-xhdpi"; Full=96; Fore=216 },
    @{ Name="mipmap-xxhdpi"; Full=144; Fore=324 },
    @{ Name="mipmap-xxxhdpi"; Full=192; Fore=432 }
)

$androidResDir = Join-Path $root "venematic-desktop\android\app\src\main\res"

foreach ($d in $densities) {
    $targetDir = Join-Path $androidResDir $d.Name

    # 1. ic_launcher_foreground.png (transparent background, safe zone padding ~25% so it fits within the 66% circle)
    $foreBmp = Create-SquareBitmap -sourcePath $srcKGrafite -size $d.Fore -paddingRatio 0.22
    Save-PngBitmap $foreBmp (Join-Path $targetDir "ic_launcher_foreground.png")
    $foreBmp.Dispose()

    # 2. ic_launcher.png (legacy square, white background with subtle rounded corners)
    $radius = [int]($d.Full * 0.15)
    $legacyBmp = Create-SquareBitmap -sourcePath $srcKGrafite -size $d.Full -paddingRatio 0.14 -bgColor ([System.Drawing.Color]::White) -cornerRadius $radius
    Save-PngBitmap $legacyBmp (Join-Path $targetDir "ic_launcher.png")
    $legacyBmp.Dispose()

    # 3. ic_launcher_round.png (legacy round, white background circle)
    $roundBmp = Create-SquareBitmap -sourcePath $srcKGrafite -size $d.Full -paddingRatio 0.16 -bgColor ([System.Drawing.Color]::White) -isRound $true
    Save-PngBitmap $roundBmp (Join-Path $targetDir "ic_launcher_round.png")
    $roundBmp.Dispose()
}

Write-Host "=== 6. GENERATING ANDROID SPLASH SCREENS ==="
$splashes = @(
    @{ Path="drawable\splash.png"; W=480; H=320; Ratio=0.60 },
    @{ Path="drawable-land-mdpi\splash.png"; W=480; H=320; Ratio=0.60 },
    @{ Path="drawable-land-hdpi\splash.png"; W=800; H=480; Ratio=0.55 },
    @{ Path="drawable-land-xhdpi\splash.png"; W=1280; H=720; Ratio=0.50 },
    @{ Path="drawable-land-xxhdpi\splash.png"; W=1600; H=960; Ratio=0.50 },
    @{ Path="drawable-land-xxxhdpi\splash.png"; W=1920; H=1280; Ratio=0.45 },
    @{ Path="drawable-port-mdpi\splash.png"; W=320; H=480; Ratio=0.75 },
    @{ Path="drawable-port-hdpi\splash.png"; W=480; H=800; Ratio=0.75 },
    @{ Path="drawable-port-xhdpi\splash.png"; W=720; H=1280; Ratio=0.70 },
    @{ Path="drawable-port-xxhdpi\splash.png"; W=960; H=1600; Ratio=0.70 },
    @{ Path="drawable-port-xxxhdpi\splash.png"; W=1280; H=1920; Ratio=0.65 }
)

foreach ($sp in $splashes) {
    $destPath = Join-Path $androidResDir $sp.Path
    $spBmp = Create-CenteredSplash -sourcePath $srcLogoFull -width $sp.W -height $sp.H -scaleRatio $sp.Ratio -bgColor ([System.Drawing.Color]::White)
    Save-PngBitmap $spBmp $destPath
    $spBmp.Dispose()
}

Write-Host "=== ALL ASSETS GENERATED SUCCESSFULLY ==="
