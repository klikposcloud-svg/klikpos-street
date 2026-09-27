Add-Type -AssemblyName System.Drawing

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$srcKWhite = Join-Path $root "Logo Klik-POS\K logo white.png"

# Vibrant brand blue (Klik-POS blue / primary)
$brandBlue = [System.Drawing.Color]::FromArgb(2, 132, 199) # #0284c7

Write-Host "Creating blue K isotype from K logo white..."
$src = [System.Drawing.Bitmap]::FromFile($srcKWhite)
$blueK = New-Object System.Drawing.Bitmap($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $p = $src.GetPixel($x, $y)
        if ($p.A -gt 0) {
            $c = [System.Drawing.Color]::FromArgb($p.A, $brandBlue.R, $brandBlue.G, $brandBlue.B)
            $blueK.SetPixel($x, $y, $c)
        }
    }
}
$src.Dispose()

$tempBluePath = Join-Path $root "Logo Klik-POS\K logo blue.png"
$blueK.Save($tempBluePath, [System.Drawing.Imaging.ImageFormat]::Png)
$blueK.Dispose()
Write-Host "Saved temp blue K at $tempBluePath"

# Function to create square icon with white background and blue K
function Create-WhiteBgBlueIcon {
    param(
        [string]$sourcePath,
        [int]$size,
        [float]$paddingRatio = 0.16,
        [int]$radiusRatio = 0.20
    )

    $src = [System.Drawing.Bitmap]::FromFile($sourcePath)
    $dest = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)

    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)

    # Draw rounded white background badge with subtle border/drop
    $radius = [int]($size * $radiusRatio)
    if ($radius -gt 0 -and $size -gt 16) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $path.AddArc(0, 0, $d, $d, 180, 90)
        $path.AddArc($size - $d - 1, 0, $d, $d, 270, 90)
        $path.AddArc($size - $d - 1, $size - $d - 1, $d, $d, 0, 90)
        $path.AddArc(0, $size - $d - 1, $d, $d, 90, 90)
        $path.CloseFigure()

        # Fill with pure white
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.FillPath($brush, $path)
        $brush.Dispose()

        # Subtle light gray outline for contrast on white backgrounds
        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 2, 132, 199), 1)
        $g.DrawPath($pen, $path)
        $pen.Dispose()
        $path.Dispose()
    } else {
        # For 16x16, fill solid white rectangle
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.FillRectangle($brush, 0, 0, $size, $size)
        $brush.Dispose()
    }

    # Center the blue K inside
    $availW = $size * (1.0 - 2 * $paddingRatio)
    $availH = $size * (1.0 - 2 * $paddingRatio)
    $scale = [Math]::Min($availW / $src.Width, $availH / $src.Height)
    $drawW = [Math]::Max(1, [int]($src.Width * $scale))
    $drawH = [Math]::Max(1, [int]($src.Height * $scale))
    $drawX = [int](($size - $drawW) / 2)
    $drawY = [int](($size - $drawH) / 2)

    $g.DrawImage($src, $drawX, $drawY, $drawW, $drawH)

    $g.Dispose()
    $src.Dispose()

    return $dest
}

# Function to save .ico
function Save-IcoFromBitmaps {
    param(
        [System.Drawing.Bitmap[]]$bitmaps,
        [string]$destPath
    )

    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)

    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]$bitmaps.Count)

    $pngStreams = @()
    foreach ($bmp in $bitmaps) {
        $pms = New-Object System.IO.MemoryStream
        $bmp.Save($pms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngStreams += $pms
    }

    $headerSize = 6 + (16 * $bitmaps.Count)
    $currentOffset = $headerSize

    for ($i = 0; $i -lt $bitmaps.Count; $i++) {
        $bmp = $bitmaps[$i]
        $pms = $pngStreams[$i]
        $bytes = $pms.ToArray()

        $w = if ($bmp.Width -ge 256) { [byte]0 } else { [byte]$bmp.Width }
        $h = if ($bmp.Height -ge 256) { [byte]0 } else { [byte]$bmp.Height }

        $bw.Write($w)
        $bw.Write($h)
        $bw.Write([byte]0)
        $bw.Write([byte]0)
        $bw.Write([uint16]1)
        $bw.Write([uint16]32)
        $bw.Write([uint32]$bytes.Length)
        $bw.Write([uint32]$currentOffset)

        $currentOffset += $bytes.Length
    }

    for ($i = 0; $i -lt $bitmaps.Count; $i++) {
        $bytes = $pngStreams[$i].ToArray()
        $bw.Write($bytes, 0, $bytes.Length)
        $pngStreams[$i].Dispose()
    }

    $bw.Flush()
    $dir = Split-Path -Parent $destPath
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllBytes($destPath, $ms.ToArray())
    $bw.Dispose()
    $ms.Dispose()

    Write-Host "Created ICO: $destPath ($($bitmaps.Count) frames)"
}

# 1. Generate 512x512 High-Res PNG
$icon512 = Create-WhiteBgBlueIcon -sourcePath $tempBluePath -size 512 -paddingRatio 0.16 -radiusRatio 0.20
$targets512 = @(
    (Join-Path $root "public\brand\klikpos-icon-blue.png"),
    (Join-Path $root "venematic-desktop\public\brand\klikpos-icon-blue.png"),
    (Join-Path $root "venematic-desktop\android\app\src\main\assets\public\brand\klikpos-icon-blue.png"),
    (Join-Path $root "venematic-desktop\src-tauri\icons\icon.png")
)
foreach ($t in $targets512) {
    $dir = Split-Path -Parent $t
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $icon512.Save($t, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Saved 512x512 PNG at $t"
}
$icon512.Dispose()

# 2. Generate PWA icons with white background and blue K
$pwaSizes = @(72, 96, 128, 144, 152, 192, 384, 512)
foreach ($sz in $pwaSizes) {
    $bmp = Create-WhiteBgBlueIcon -sourcePath $tempBluePath -size $sz -paddingRatio 0.16 -radiusRatio 0.20
    $bmp.Save((Join-Path $root "public\icons\icon-$sz.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $root "venematic-desktop\public\icons\icon-$sz.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# 3. Generate multi-resolution .ico frames (16, 24, 32, 48, 64, 128, 256)
$icoSizes = @(16, 24, 32, 48, 64, 128, 256)
$icoBitmaps = @()
foreach ($sz in $icoSizes) {
    $icoBitmaps += (Create-WhiteBgBlueIcon -sourcePath $tempBluePath -size $sz -paddingRatio 0.16 -radiusRatio 0.20)
}

$icoDestinations = @(
    (Join-Path $root "public\favicon.ico"),
    (Join-Path $root "venematic-desktop\public\favicon.ico"),
    (Join-Path $root "landing\favicon.ico"),
    (Join-Path $root "venematic-desktop\launcher\app.ico"),
    (Join-Path $root "launcher\app.ico"),
    (Join-Path $root "venematic-desktop\build-staging\app.ico"),
    (Join-Path $root "venematic-desktop\src-tauri\icons\icon.ico"),
    (Join-Path $root "venematic-desktop\android\app\src\main\assets\public\favicon.ico")
)

foreach ($dest in $icoDestinations) {
    Save-IcoFromBitmaps -bitmaps $icoBitmaps -destPath $dest
}

foreach ($b in $icoBitmaps) {
    $b.Dispose()
}

Write-Host "ALL BLUE ICONS WITH WHITE BACKGROUND GENERATED SUCCESSFULLY!"
