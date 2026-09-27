Add-Type -AssemblyName System.Drawing
foreach ($f in (Get-ChildItem "Logo Klik-POS\*.png")) {
    $b = [System.Drawing.Bitmap]::FromFile($f.FullName)
    Write-Host "$($f.Name): $($b.Width)x$($b.Height)"
    
    # Check dominant colors
    $pixels = @{}
    for ($y = 0; $y -lt $b.Height; $y += [Math]::Max(1, [int]($b.Height / 20))) {
        for ($x = 0; $x -lt $b.Width; $x += [Math]::Max(1, [int]($b.Width / 20))) {
            $c = $b.GetPixel($x, $y)
            if ($c.A -gt 30) {
                $hex = "#{0:X2}{1:X2}{2:X2}" -f $c.R, $c.G, $c.B
                $pixels[$hex] = ($pixels[$hex] -as [int]) + 1
            }
        }
    }
    $topColors = ($pixels.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3 | ForEach-Object { "$($_.Key) ($($_.Value))" }) -join ", "
    Write-Host "   Top non-transparent colors: $topColors"
    $b.Dispose()
}
