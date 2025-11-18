# Test all V2 packages
# Fast tests only (no multi-year PoW computations!)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  FRW V2 QUANTUM-RESISTANT TEST SUITE" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$totalStart = Get-Date

# Test crypto-pq
Write-Host "[1/3] Testing @frw/crypto-pq..." -ForegroundColor Yellow
Set-Location "crypto-pq"
npm test 2>&1 | Tee-Object -Variable cryptoOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: @frw/crypto-pq tests" -ForegroundColor Red
    exit 1
}
Write-Host "PASSED: @frw/crypto-pq" -ForegroundColor Green
Write-Host ""

# Test pow-v2
Write-Host "[2/3] Testing @frw/pow-v2..." -ForegroundColor Yellow
Set-Location "../pow-v2"
npm test 2>&1 | Tee-Object -Variable powOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: @frw/pow-v2 tests" -ForegroundColor Red
    exit 1
}
Write-Host "PASSED: @frw/pow-v2" -ForegroundColor Green
Write-Host ""

# Test protocol-v2
Write-Host "[3/3] Testing @frw/protocol-v2..." -ForegroundColor Yellow
Set-Location "../protocol-v2"
npm test 2>&1 | Tee-Object -Variable protocolOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: @frw/protocol-v2 tests" -ForegroundColor Red
    exit 1
}
Write-Host "PASSED: @frw/protocol-v2" -ForegroundColor Green
Write-Host ""

Set-Location ".."

$totalEnd = Get-Date
$duration = ($totalEnd - $totalStart).TotalSeconds

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "  Total time: $([Math]::Round($duration, 2)) seconds" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "V2 packages are READY for production deployment!" -ForegroundColor Green
