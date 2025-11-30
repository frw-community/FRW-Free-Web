# FRW Browser (CEF) Build Script for Windows

Write-Host "=== FRW CEF Browser Build ===" -ForegroundColor Green

# Check for CEF_ROOT
if (-not $env:CEF_ROOT) {
    Write-Host "ERROR: CEF_ROOT environment variable is not set." -ForegroundColor Red
    Write-Host "Download a CEF binary distribution and set CEF_ROOT to its folder." -ForegroundColor Red
    exit 1
}

Write-Host "CEF_ROOT: $env:CEF_ROOT" -ForegroundColor Cyan

# Ensure the React renderer is built
Write-Host "Building React renderer..." -ForegroundColor Yellow
Set-Location "..\browser"
npm run build:vite
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: React renderer build failed." -ForegroundColor Red
    exit 1
}

# Return to CEF directory
Set-Location "..\browser-frw"

# Create build directory
Write-Host "Configuring CMake..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
New-Item -ItemType Directory -Path "build" | Out-Null

# Configure
cmake -B build -S . -DCEF_ROOT="$env:CEF_ROOT" -DCMAKE_BUILD_TYPE=Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: CMake configuration failed." -ForegroundColor Red
    exit 1
}

# Build
Write-Host "Building CEF application..." -ForegroundColor Yellow
cmake --build build --config Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed." -ForegroundColor Red
    exit 1
}

Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host "Executable: build\Release\frw-browser.exe" -ForegroundColor Cyan
Write-Host "Run it to test the FRW CEF browser." -ForegroundColor Cyan
