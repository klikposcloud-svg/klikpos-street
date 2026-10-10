# scripts/generate-edition-icons.ps1
# Generador Maestro de Iconos Diferenciados para KlikPOS Android (Street, Keygen, Movil)
Add-Type -AssemblyName System.Drawing

$root = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master"
$srcKWhite = Join-Path $root "Logo Klik-POS\K logo white.png"
$iconsBaseDir = Join-Path $root "venematic-desktop\android-icons"

if (-not (Test-Path $srcKWhite)) {
    Write-Error "No se encontro K logo white.png en Logo Klik-POS"
    exit 1
}

# Densidades Android
$densities = @(
    @{ Name="mipmap-mdpi"; Full=48; Fore=108 },
    @{ Name="mipmap-hdpi"; Full=72; Fore=162 },
    @{ Name="mipmap-xhdpi"; Full=96; Fore=216 },
    @{ Name="mipmap-xxhdpi"; Full=144; Fore=324 },
    @{ Name="mipmap-xxxhdpi"; Full=192; Fore=432 }
)

# Definicion de Ediciones
$editions = @(
    @{
        Key = "street"
        Title = "STREET"
        BgColor = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
        AdaptiveBgHex = "#FFFFFF"
        KColor = [System.Drawing.Color]::FromArgb(255, 239, 68, 68)     # Rojo Street Food (#ef4444)
        BadgeBg = [System.Drawing.Color]::FromArgb(255, 220, 38, 38)    # Rojo Carmesi (#dc2626)
        BadgeText = [System.Drawing.Color]::White
        BorderColor = [System.Drawing.Color]::FromArgb(255, 254, 202, 202)
    },
    @{
        Key = "keygen"
        Title = "KEYGEN"
        BgColor = [System.Drawing.Color]::FromArgb(255, 15, 12, 32)     # Midnight Obsidian (#0f0c20)
        AdaptiveBgHex = "#0F0C20"
        KColor = [System.Drawing.Color]::FromArgb(255, 245, 158, 11)   # Oro Brillante (#f59e0b)
        BadgeBg = [System.Drawing.Color]::FromArgb(255, 217, 119, 6)    # Ambar Oro (#d97706)
        BadgeText = [System.Drawing.Color]::FromArgb(255, 15, 12, 32)   # Texto oscuro
        BorderColor = [System.Drawing.Color]::FromArgb(255, 180, 83, 9)
    },
    @{
        Key = "movil"
        Title = "MOVIL"
        BgColor = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
        AdaptiveBgHex = "#FFFFFF"
        KColor = [System.Drawing.Color]::FromArgb(255, 2, 132, 199)     # Azul Electrico (#0284c7)
        BadgeBg = [System.Drawing.Color]::FromArgb(255, 3, 105, 161)    # Azul Marino (#0369a1)
        BadgeText = [System.Drawing.Color]::White
        BorderColor = [System.Drawing.Color]::FromArgb(255, 186, 230, 253)
    }
)

# Funcion para tenir el isotipo K
function Tint-Bitmap {
    param(
        [System.Drawing.Bitmap]$source,
        [System.Drawing.Color]$tintColor
    )
    $tinted = New-Object System.Drawing.Bitmap($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($y = 0; $y -lt $source.Height; $y++) {
        for ($x = 0; $x -lt $source.Width; $x++) {
            $p = $source.GetPixel($x, $y)
            if ($p.A -gt 0) {
                $c = [System.Drawing.Color]::FromArgb($p.A, $tintColor.R, $tintColor.G, $tintColor.B)
                $tinted.SetPixel($x, $y, $c)
            }
        }
    }
    return $tinted
}

# Cargar Isotipo Blanco original
$rawK = [System.Drawing.Bitmap]::FromFile($srcKWhite)

foreach ($ed in $editions) {
    Write-Host "Generando Iconos para Edicion: $($ed.Title) ($($ed.Key))..."
    $edDir = Join-Path $iconsBaseDir $ed.Key
    
    # Tenir K
    $kImage = Tint-Bitmap -source $rawK -tintColor $ed.KColor

    # Crear values con ic_launcher_background.xml
    $valuesDir = Join-Path $edDir "values"
    if (-not (Test-Path $valuesDir)) { New-Item -ItemType Directory -Path $valuesDir -Force | Out-Null }
    
    $xmlLines = @(
        '<?xml version="1.0" encoding="utf-8"?>',
        '<resources>',
        "    <color name=`"ic_launcher_background`">$($ed.AdaptiveBgHex)</color>",
        '</resources>'
    )
    [System.IO.File]::WriteAllLines((Join-Path $valuesDir "ic_launcher_background.xml"), $xmlLines)

    foreach ($d in $densities) {
        $targetDir = Join-Path $edDir $d.Name
        if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }

        # 1. ic_launcher_foreground.png
        $fore = New-Object System.Drawing.Bitmap($d.Fore, $d.Fore, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($fore)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $g.Clear([System.Drawing.Color]::Transparent)

        $safeZone = $d.Fore * 0.62
        $safeTop = ($d.Fore - $safeZone) / 2
        $safeLeft = ($d.Fore - $safeZone) / 2

        $kHeight = $safeZone * 0.68
        $kWidth = ($rawK.Width / $rawK.Height) * $kHeight
        $kX = ($d.Fore - $kWidth) / 2
        $kY = $safeTop + ($safeZone * 0.05)

        $g.DrawImage($kImage, [float]$kX, [float]$kY, [float]$kWidth, [float]$kHeight)

        # Cinta / Badge inferior
        $badgeH = [Math]::Max(10, [int]($safeZone * 0.22))
        $badgeW = [Math]::Max(24, [int]($safeZone * 0.88))
        $badgeX = ($d.Fore - $badgeW) / 2
        $badgeY = $safeTop + ($safeZone * 0.74)

        $badgeBrush = New-Object System.Drawing.SolidBrush($ed.BadgeBg)
        $badgeRadius = [int]($badgeH * 0.45)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $dRadius = $badgeRadius * 2
        $path.AddArc($badgeX, $badgeY, $dRadius, $dRadius, 180, 90)
        $path.AddArc($badgeX + $badgeW - $dRadius, $badgeY, $dRadius, $dRadius, 270, 90)
        $path.AddArc($badgeX + $badgeW - $dRadius, $badgeY + $badgeH - $dRadius, $dRadius, $dRadius, 0, 90)
        $path.AddArc($badgeX, $badgeY + $badgeH - $dRadius, $dRadius, $dRadius, 90, 90)
        $path.CloseFigure()
        $g.FillPath($badgeBrush, $path)

        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 255, 255), [float]([Math]::Max(1, $badgeH * 0.06)))
        $g.DrawPath($pen, $path)

        $fontSize = [Math]::Max(6.0, [float]($badgeH * 0.58))
        $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $textBrush = New-Object System.Drawing.SolidBrush($ed.BadgeText)
        $rectF = New-Object System.Drawing.RectangleF([float]$badgeX, [float]$badgeY, [float]$badgeW, [float]$badgeH)
        $g.DrawString($ed.Title, $font, $textBrush, $rectF, $sf)

        $g.Dispose()
        $fore.Save((Join-Path $targetDir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $fore.Dispose()

        # 2. ic_launcher.png (Legacy Square)
        $legacy = New-Object System.Drawing.Bitmap($d.Full, $d.Full, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($legacy)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $g.Clear([System.Drawing.Color]::Transparent)

        $sqRadius = [int]($d.Full * 0.18)
        $sqPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $dSq = $sqRadius * 2
        $sqPath.AddArc(0, 0, $dSq, $dSq, 180, 90)
        $sqPath.AddArc($d.Full - $dSq, 0, $dSq, $dSq, 270, 90)
        $sqPath.AddArc($d.Full - $dSq, $d.Full - $dSq, $dSq, $dSq, 0, 90)
        $sqPath.AddArc(0, $d.Full - $dSq, $dSq, $dSq, 90, 90)
        $sqPath.CloseFigure()

        $bgBrush = New-Object System.Drawing.SolidBrush($ed.BgColor)
        $g.FillPath($bgBrush, $sqPath)
        $borderPen = New-Object System.Drawing.Pen($ed.BorderColor, [float]([Math]::Max(1, $d.Full * 0.03)))
        $g.DrawPath($borderPen, $sqPath)

        $fullKHeight = $d.Full * 0.50
        $fullKWidth = ($rawK.Width / $rawK.Height) * $fullKHeight
        $fullKX = ($d.Full - $fullKWidth) / 2
        $fullKY = $d.Full * 0.12
        $g.DrawImage($kImage, [float]$fullKX, [float]$fullKY, [float]$fullKWidth, [float]$fullKHeight)

        $fullBadgeH = [Math]::Max(8, [int]($d.Full * 0.20))
        $fullBadgeW = [Math]::Max(20, [int]($d.Full * 0.82))
        $fullBadgeX = ($d.Full - $fullBadgeW) / 2
        $fullBadgeY = $d.Full * 0.68

        $fullPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $dF = [int]($fullBadgeH * 0.45) * 2
        $fullPath.AddArc($fullBadgeX, $fullBadgeY, $dF, $dF, 180, 90)
        $fullPath.AddArc($fullBadgeX + $fullBadgeW - $dF, $fullBadgeY, $dF, $dF, 270, 90)
        $fullPath.AddArc($fullBadgeX + $fullBadgeW - $dF, $fullBadgeY + $fullBadgeH - $dF, $dF, $dF, 0, 90)
        $fullPath.AddArc($fullBadgeX, $fullBadgeY + $fullBadgeH - $dF, $dF, $dF, 90, 90)
        $fullPath.CloseFigure()
        $g.FillPath($badgeBrush, $fullPath)

        $fullFontSize = [Math]::Max(5.0, [float]($fullBadgeH * 0.58))
        $fullFont = New-Object System.Drawing.Font("Arial", $fullFontSize, [System.Drawing.FontStyle]::Bold)
        $rectFullF = New-Object System.Drawing.RectangleF([float]$fullBadgeX, [float]$fullBadgeY, [float]$fullBadgeW, [float]$fullBadgeH)
        $g.DrawString($ed.Title, $fullFont, $textBrush, $rectFullF, $sf)

        $g.Dispose()
        $legacy.Save((Join-Path $targetDir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $legacy.Dispose()

        # 3. ic_launcher_round.png
        $round = New-Object System.Drawing.Bitmap($d.Full, $d.Full, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($round)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $g.Clear([System.Drawing.Color]::Transparent)

        $g.FillEllipse($bgBrush, 0, 0, $d.Full, $d.Full)
        $g.DrawEllipse($borderPen, 0, 0, $d.Full - 1, $d.Full - 1)

        $g.DrawImage($kImage, [float]$fullKX, [float]$fullKY, [float]$fullKWidth, [float]$fullKHeight)
        $g.FillPath($badgeBrush, $fullPath)
        $g.DrawString($ed.Title, $fullFont, $textBrush, $rectFullF, $sf)

        $g.Dispose()
        $round.Save((Join-Path $targetDir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $round.Dispose()
    }

    $kImage.Dispose()
    Write-Host "  [OK] Set generado en: $edDir"
}

$rawK.Dispose()
Write-Host "TODOS LOS ICONOS DIFERENCIADOS FUERON GENERADOS EXITOSAMENTE!"
