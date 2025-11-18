# Build all V2 packages
# Complete build pipeline for quantum-resistant FRW V2

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  FRW V2 BUILD PIPELINE" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$totalStart = Get-Date

# Build crypto-pq
Write-Host "[1/3] Building @frw/crypto-pq..." -ForegroundColor Yellow
Set-Location "crypto-pq"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: @frw/crypto-pq build" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: @frw/crypto-pq built" -ForegroundColor Green
Write-Host ""

# Build pow-v2
Write-Host "[2/3] Building @frw/pow-v2..." -ForegroundColor Yellow
Set-Location "../pow-v2"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: @frw/pow-v2 build" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: @frw/pow-v2 built" -ForegroundColor Green
Write-Host ""

# Build protocol-v2
Write-Host "[3/3] Building @frw/protocol-v2..." -ForegroundColor Yellow
Set-Location "../protocol-v2"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: @frw/protocol-v2 build" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: @frw/protocol-v2 built" -ForegroundColor Green
Write-Host ""

Set-Location ".."

$totalEnd = Get-Date
$duration = ($totalEnd - $totalStart).TotalSeconds

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  ALL BUILDS SUCCESSFUL!" -ForegroundColor Green
Write-Host "  Total time: $([Math]::Round($duration, 2)) seconds" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package sizes:" -ForegroundColor Cyan
Write-Host "  crypto-pq:    $(Get-ChildItem crypto-pq\dist\*.js | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum) bytes" -ForegroundColor White
Write-Host "  pow-v2:       $(Get-ChildItem pow-v2\dist\*.js | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum) bytes" -ForegroundColor White
Write-Host "  protocol-v2:  $(Get-ChildItem protocol-v2\dist\*.js | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum) bytes" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Run .\test-all-v2.ps1 to validate functionality" -ForegroundColor Yellow
