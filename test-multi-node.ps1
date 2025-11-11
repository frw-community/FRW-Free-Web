#!/usr/bin/env pwsh
# Test multi-node synchronization

Write-Host "=== FRW Multi-Node Sync Test ===" -ForegroundColor Cyan
Write-Host ""

# Check IPFS is running
Write-Host "1. Checking IPFS..." -ForegroundColor Yellow
try {
    $ipfs = Invoke-RestMethod http://localhost:5001/api/v0/version
    Write-Host "   ✓ IPFS running: $($ipfs.Version)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ IPFS not running. Start with: ipfs daemon" -ForegroundColor Red
    exit 1
}

# Check if bootstrap nodes are built
Write-Host "2. Checking build..." -ForegroundColor Yellow
if (Test-Path "apps\bootstrap-node\dist\index.js") {
    Write-Host "   ✓ Bootstrap node built" -ForegroundColor Green
} else {
    Write-Host "   ✗ Building bootstrap node..." -ForegroundColor Red
    npx tsc -b apps/bootstrap-node
}

Write-Host ""
Write-Host "=== Starting Test ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "  1. Open TWO new PowerShell terminals"
Write-Host "  2. In Terminal 1, run:"
Write-Host "       cd apps\bootstrap-node"
Write-Host "       `$env:NODE_ID='test-node-A'; `$env:HTTP_PORT='3100'; node dist/index.js"
Write-Host ""
Write-Host "  3. In Terminal 2, run:"
Write-Host "       cd apps\bootstrap-node"
Write-Host "       `$env:NODE_ID='test-node-B'; `$env:HTTP_PORT='3101'; node dist/index.js"
Write-Host ""
Write-Host "  4. Wait 5 seconds, then run these tests:"
Write-Host ""

Start-Sleep -Seconds 2

Write-Host "=== Test Commands ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "# Test 1: Check both nodes are up" -ForegroundColor Green
Write-Host "Invoke-RestMethod http://localhost:3100/health"
Write-Host "Invoke-RestMethod http://localhost:3101/health"
Write-Host ""

Write-Host "# Test 2: Register a name" -ForegroundColor Green
Write-Host "frw register synctest1"
Write-Host "# Watch BOTH node terminals - should see pubsub message!"
Write-Host ""

Write-Host "# Test 3: Verify both nodes have it" -ForegroundColor Green
Write-Host "Invoke-RestMethod http://localhost:3100/api/resolve/synctest1"
Write-Host "Invoke-RestMethod http://localhost:3101/api/resolve/synctest1"
Write-Host ""

Write-Host "# Test 4: Publish content" -ForegroundColor Green
Write-Host "frw publish test-site --name synctest1"
Write-Host "# Watch BOTH nodes update contentCID!"
Write-Host ""

Write-Host "# Test 5: Kill Node B, register new name, restart Node B" -ForegroundColor Green
Write-Host "# Ctrl+C in Terminal 2"
Write-Host "frw register synctest2"
Write-Host "# Restart Terminal 2"
Write-Host "# Node B should sync synctest2 from Node A!"
Write-Host ""

Write-Host "=== Success Criteria ===" -ForegroundColor Cyan
Write-Host "✓ Both nodes show same data" -ForegroundColor Green
Write-Host "✓ Pubsub messages appear in both terminals" -ForegroundColor Green
Write-Host "✓ ContentCID updates propagate instantly" -ForegroundColor Green
Write-Host "✓ Restarted node syncs missed registrations" -ForegroundColor Green
Write-Host ""
Write-Host "If all pass: DEPLOY TO VPS!" -ForegroundColor Yellow
