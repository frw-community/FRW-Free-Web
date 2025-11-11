# Test Bootstrap Node Endpoints
Write-Host "Testing Bootstrap Node Endpoints" -ForegroundColor Cyan
Write-Host ""

# Test health endpoint
Write-Host "[1/3] Testing /health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3100/health" -Method Get
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    Write-Host "  Uptime: $($health.uptime)s" -ForegroundColor Gray
    Write-Host "  Node ID: $($health.nodeId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test stats endpoint
Write-Host "[2/3] Testing /api/stats endpoint..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3100/api/stats" -Method Get
    Write-Host "✓ Stats endpoint working" -ForegroundColor Green
    Write-Host "  Total names: $($stats.totalNames)" -ForegroundColor Gray
    Write-Host "  Last updated: $($stats.lastUpdated)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Stats failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test names endpoint
Write-Host "[3/3] Testing /api/names endpoint..." -ForegroundColor Yellow
try {
    $names = Invoke-RestMethod -Uri "http://localhost:3100/api/names" -Method Get
    Write-Host "✓ Names endpoint working" -ForegroundColor Green
    Write-Host "  Names in index: $($names.count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Names endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Bootstrap node is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Register a test name" -ForegroundColor Cyan
Write-Host "  frw register testname" -ForegroundColor Yellow
