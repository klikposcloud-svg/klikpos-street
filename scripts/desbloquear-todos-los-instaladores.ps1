# ==============================================================================
# DESBLOQUEADOR OFICIAL DE INSTALADORES Y EJECUTABLES VENEMATIC POS
# Remueve la marca de internet (Zone.Identifier / SmartScreen Mark-of-the-Web)
# ==============================================================================

$root = $PSScriptRoot | Split-Path -Parent
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  DESBLOQUEO AUTOMATIZADO DE SMART SCREEN PARA INSTALADORES      " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$targets = @(
    "$root\dist-installer",
    "$root\venematic-desktop\dist-installer",
    "$root\venematic-desktop\launcher",
    "$root\venematic-desktop\build-staging"
)

$count = 0
foreach ($dir in $targets) {
    if (Test-Path $dir) {
        $files = Get-ChildItem -Path $dir -Filter *.exe -Recurse
        foreach ($file in $files) {
            try {
                Unblock-File -LiteralPath $file.FullName
                # Eliminar stream Zone.Identifier si existe
                $stream = "$($file.FullName):Zone.Identifier"
                if (Test-Path $stream) {
                    Remove-Item $stream -Force -ErrorAction SilentlyContinue
                }
                Write-Host " [OK Desbloqueado] $($file.FullName.Replace($root, ''))" -ForegroundColor Green
                $count++
            } catch {
                Write-Host " [ERROR] $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " ¡Listo! Se han desbloqueado $count archivos ejecutables." -ForegroundColor Cyan
Write-Host " Ya no recibirán bloqueo de SmartScreen ni advertencia de descarga." -ForegroundColor Green
Write-Host "=================================================================`n" -ForegroundColor Cyan
