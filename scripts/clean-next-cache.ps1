$ErrorActionPreference = "SilentlyContinue"
$target = "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\.next"
if (Test-Path $target) {
    Remove-Item -Path $target -Recurse -Force
    Write-Host "Deleted .next directory"
} else {
    Write-Host ".next does not exist"
}
