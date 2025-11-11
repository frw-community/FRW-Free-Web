# Test Bootstrap Node Locally
Write-Host "[1/4] Checking IPFS daemon..." -ForegroundColor Cyan

# Check if IPFS daemon is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/v0/version" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ IPFS daemon is running" -ForegroundColor Green
} catch {
    Write-Host "✗ IPFS daemon not running" -ForegroundColor Red
    Write-Host "Start IPFS: ipfs daemon" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or install IPFS:" -ForegroundColor Yellow
    Write-Host "  Windows: choco install ipfs" -ForegroundColor Yellow
    Write-Host "  Or download from: https://dist.ipfs.tech/#go-ipfs" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/4] Starting bootstrap node..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start bootstrap node
Set-Location "$PSScriptRoot\apps\bootstrap-node"
npm start
