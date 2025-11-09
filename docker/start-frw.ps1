# FRW Quick Start Script for Windows PowerShell
# Automates Docker deployment for FRW

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     FRW Quick Start Setup              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    Write-Host "   Please install Docker: https://docs.docker.com/get-docker/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    Write-Host "   Please install Docker Compose: https://docs.docker.com/compose/install/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "Creating .env configuration..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

# Create sites directory
if (-not (Test-Path sites)) {
    New-Item -ItemType Directory -Path sites | Out-Null
    Write-Host "✓ Created sites directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting FRW services..." -ForegroundColor Cyan
Write-Host ""

# Start services
docker-compose up -d

Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if IPFS is healthy
Write-Host "Checking IPFS status..." -ForegroundColor Yellow
try {
    docker-compose exec -T ipfs ipfs version | Out-Null
    Write-Host "✓ IPFS is running" -ForegroundColor Green
} catch {
    Write-Host "⚠ IPFS may not be ready yet, give it a moment..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     FRW Setup Complete!                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Your FRW node is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  • IPFS Node:     http://localhost:5001" -ForegroundColor Cyan
Write-Host "  • IPFS Gateway:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "  • FRW Gateway:   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Initialize FRW:" -ForegroundColor Yellow
Write-Host "   docker-compose exec frw-cli frw init" -ForegroundColor White
Write-Host ""
Write-Host "2. Register a name:" -ForegroundColor Yellow
Write-Host "   docker-compose exec frw-cli frw register myname" -ForegroundColor White
Write-Host ""
Write-Host "3. Place your site in .\sites\my-site\ and configure:" -ForegroundColor Yellow
Write-Host "   docker-compose exec frw-cli frw configure /data/sites/my-site" -ForegroundColor White
Write-Host "   (Use custom folders? See docs\CUSTOM_FOLDERS.md)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. (Optional) Link a custom domain:" -ForegroundColor Yellow
Write-Host "   docker-compose exec frw-cli frw domain add example.com myname" -ForegroundColor White
Write-Host "   Then add DNS TXT record and verify:" -ForegroundColor Gray
Write-Host "   docker-compose exec frw-cli frw domain verify example.com" -ForegroundColor White
Write-Host ""
Write-Host "5. Publish your site:" -ForegroundColor Yellow
Write-Host "   docker-compose exec frw-cli frw publish /data/sites/my-site" -ForegroundColor White
Write-Host ""
Write-Host "6. Access content:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000/frw/myname/" -ForegroundColor Cyan
Write-Host "   or https://example.com (if domain configured)" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "Stop services:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "   make help                    # Show all commands" -ForegroundColor White
Write-Host "   make configure SITE=my-site  # Configure site" -ForegroundColor White
Write-Host "   make domain-list             # List domains" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "   docs\DOCKER_DEPLOYMENT.md" -ForegroundColor White
Write-Host "   docs\DOMAIN_MANAGEMENT.md" -ForegroundColor White
Write-Host "   docs\SITE_CONFIGURATION.md" -ForegroundColor White
Write-Host "   docs\CUSTOM_FOLDERS.md (use any folder!)" -ForegroundColor White
Write-Host ""
