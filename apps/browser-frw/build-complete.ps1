# FRW Browser Complete Build Script
# This script handles everything: CEF download, React build, compilation

param(
    [string]$CEFVersion = "cef_binary_142.0.17+g60aac24+chromium-142.0.7444.176_windows64",
    [string]$CEFDownloadPath = "C:\temp\cef",
    [switch]$SkipCEFDownload = $false,
    [switch]$SkipReactBuild = $false,
    [switch]$Force = $false
)

Write-Host "=== FRW Browser Complete Build Script ===" -ForegroundColor Green
Write-Host "CEF Version: $CEFVersion" -ForegroundColor Cyan

# Helper function for colored output
function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Install CEF if needed
function Install-CEF {
    if ($SkipCEFDownload) {
        Write-Status "Skipping CEF download (SkipCEFDownload flag set)" -ForegroundColor Yellow
        return
    }
    
    # Check if CEF already exists
    $cefPath = "C:\cef_binary_$CEFVersion"
    if (Test-Path $cefPath) {
        if (-not $Force) {
            Write-Status "CEF already exists at $cefPath. Use -Force to re-download." -ForegroundColor Green
            $env:CEF_ROOT = $cefPath
            return
        } else {
            Write-Status "Removing existing CEF installation..." -ForegroundColor Yellow
            Remove-Item -Recurse -Force $cefPath -ErrorAction SilentlyContinue
        }
    }
    
    Write-Status "Downloading CEF binary..." -ForegroundColor Yellow
    
    # Create download directory
    if (-not (Test-Path $CEFDownloadPath)) {
        New-Item -ItemType Directory -Path $CEFDownloadPath -Force | Out-Null
    }
    
    # CEF download URL
    $cefUrl = "https://cef-builds.spotifycdn.com/cef_binary_$CEFVersion`_windows64.tar.bz2"
    $cefFile = "$CEFDownloadPath\cef_binary_$CEFVersion`_windows64.tar.bz2"
    
    try {
        # Download using Invoke-WebRequest
        Write-Status "Downloading from: $cefUrl" -ForegroundColor Cyan
        Invoke-WebRequest -Uri $cefUrl -OutFile $cefFile -UseBasicParsing
        
        # Extract
        Write-Status "Extracting CEF..." -ForegroundColor Yellow
        if (Get-Command "7z" -ErrorAction SilentlyContinue) {
            # Use 7-Zip if available
            & 7z x $cefFile -o"C:\" -y
        } else {
            # Use tar (Windows 10+)
            & tar -xf $cefFile -C "C:\"
        }
        
        # Set CEF_ROOT
        $env:CEF_ROOT = $cefPath
        Write-Status "CEF installed to: $env:CEF_ROOT" -ForegroundColor Green
        
        # Cleanup
        Remove-Item $cefFile -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Status "ERROR: Failed to download/extract CEF: $_" -ForegroundColor Red
        Write-Status "Please download manually from: https://cef-builds.spotifycdn.com/index.html" -ForegroundColor Red
        exit 1
    }
}

# Test dependencies
function Test-Dependencies {
    Write-Status "Checking dependencies..." -ForegroundColor Yellow
    
    # Check Visual Studio
    $vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $vsWhere) {
        $vsPath = & $vsWhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
        if ($vsPath) {
            Write-Status "Visual Studio found: $vsPath" -ForegroundColor Green
        } else {
            Write-Status "WARNING: Visual Studio with C++ tools not found" -ForegroundColor Yellow
        }
    } else {
        Write-Status "WARNING: Visual Studio not found" -ForegroundColor Yellow
    }
    
    # Check CMake
    if (Get-Command "cmake" -ErrorAction SilentlyContinue) {
        $cmakeVersion = & cmake --version | Select-Object -First 1
        Write-Status "CMake found: $cmakeVersion" -ForegroundColor Green
    } else {
        Write-Status "ERROR: CMake not found. Please install CMake." -ForegroundColor Red
        exit 1
    }
    
    # Check Node.js
    if (Get-Command "node" -ErrorAction SilentlyContinue) {
        $nodeVersion = & node --version
        Write-Status "Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Status "ERROR: Node.js not found. Please install Node.js." -ForegroundColor Red
        exit 1
    }
    
    # Check npm
    if (Get-Command "npm" -ErrorAction SilentlyContinue) {
        $npmVersion = & npm --version
        Write-Status "npm found: $npmVersion" -ForegroundColor Green
    } else {
        Write-Status "ERROR: npm not found. Please install npm." -ForegroundColor Red
        exit 1
    }
}

# Build React renderer
function Start-ReactBuild {
    if ($SkipReactBuild) {
        Write-Status "Skipping React build (SkipReactBuild flag set)" -ForegroundColor Yellow
        return
    }
    
    Write-Status "Building React renderer..." -ForegroundColor Yellow
    
    $browserPath = "..\browser"
    if (-not (Test-Path $browserPath)) {
        Write-Status "ERROR: Browser directory not found at $browserPath" -ForegroundColor Red
        exit 1
    }
    
    Push-Location $browserPath
    
    try {
        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Status "Installing React dependencies..." -ForegroundColor Cyan
            & npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Status "ERROR: npm install failed" -ForegroundColor Red
                exit 1
            }
        }
        
        # Build
        Write-Status "Building React application..." -ForegroundColor Cyan
        & npm run build:vite
        if ($LASTEXITCODE -ne 0) {
            Write-Status "ERROR: React build failed" -ForegroundColor Red
            exit 1
        }
        
        Write-Status "React build completed successfully" -ForegroundColor Green
        
    } finally {
        Pop-Location
    }
}

# Build CEF application
function Start-CEFBuild {
    Write-Status "Building CEF application..." -ForegroundColor Yellow
    
    # Check CEF_ROOT
    if (-not $env:CEF_ROOT) {
        Write-Status "ERROR: CEF_ROOT environment variable not set" -ForegroundColor Red
        Write-Status "Please set CEF_ROOT or use -SkipCEFDownload $false" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path $env:CEF_ROOT)) {
        Write-Status "ERROR: CEF_ROOT path does not exist: $env:CEF_ROOT" -ForegroundColor Red
        exit 1
    }
    
    Write-Status "Using CEF at: $env:CEF_ROOT" -ForegroundColor Cyan
    
    # Clean build directory
    if (Test-Path "build") {
        Write-Status "Cleaning previous build..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force "build"
    }
    New-Item -ItemType Directory -Path "build" | Out-Null
    
    # Configure CMake
    Write-Status "Configuring CMake..." -ForegroundColor Cyan
    & cmake -B build -S . -DCEF_ROOT="$env:CEF_ROOT" -DCMAKE_BUILD_TYPE=Release
    if ($LASTEXITCODE -ne 0) {
        Write-Status "ERROR: CMake configuration failed" -ForegroundColor Red
        exit 1
    }
    
    # Build
    Write-Status "Compiling CEF application..." -ForegroundColor Cyan
    & cmake --build build --config Release --parallel
    if ($LASTEXITCODE -ne 0) {
        Write-Status "ERROR: Build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Status "CEF build completed successfully" -ForegroundColor Green
}

# Copy runtime files
function Copy-RuntimeFiles {
    Write-Status "Copying runtime files..." -ForegroundColor Yellow
    
    $executablePath = "build\Release\frw-browser.exe"
    if (-not (Test-Path $executablePath)) {
        Write-Status "ERROR: Executable not found at $executablePath" -ForegroundColor Red
        exit 1
    }
    
    # Copy CEF runtime DLLs
    $cefReleasePath = "$env:CEF_ROOT\Release"
    $buildReleasePath = "build\Release"
    
    if (Test-Path $cefReleasePath) {
        Write-Status "Copying CEF runtime files..." -ForegroundColor Cyan
        Copy-Item "$cefReleasePath\*.dll" $buildReleasePath -Force
        Copy-Item "$cefReleasePath\*.pak" $buildReleasePath -Force
        Copy-Item "$cefReleasePath\*.dat" $buildReleasePath -Force
        Copy-Item "$cefReleasePath\*.bin" $buildReleasePath -Force
        
        # Copy resources folder
        if (Test-Path "$cefReleasePath\Resources") {
            Copy-Item "$cefReleasePath\Resources" $buildReleasePath -Recurse -Force
        }
        
        Write-Status "Runtime files copied successfully" -ForegroundColor Green
    } else {
        Write-Status "WARNING: CEF Release folder not found at $cefReleasePath" -ForegroundColor Yellow
    }
}

# Test the build
function Test-Build {
    Write-Status "Testing build..." -ForegroundColor Yellow
    
    $executablePath = "build\Release\frw-browser.exe"
    if (Test-Path $executablePath) {
        $fileInfo = Get-Item $executablePath
        Write-Status "✅ Executable created: $($fileInfo.FullName)" -ForegroundColor Green
        Write-Status "✅ Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Green
        Write-Status "✅ Created: $($fileInfo.CreationTime)" -ForegroundColor Green
        
        # Check for required DLLs
        $requiredDLLs = @("libcef.dll", "chrome_elf.dll")
        foreach ($dll in $requiredDLLs) {
            $dllPath = "build\Release\$dll"
            if (Test-Path $dllPath) {
                Write-Status "✅ $dll found" -ForegroundColor Green
            } else {
                Write-Status "❌ $dll missing" -ForegroundColor Red
            }
        }
        
        return $true
    } else {
        Write-Status "❌ Executable not found" -ForegroundColor Red
        return $false
    }
}

# Main execution
try {
    Write-Status "Starting complete build process..." -ForegroundColor Cyan
    
    # Test dependencies
    Test-Dependencies
    
    # Install/setup CEF
    Install-CEF
    
    # Build React renderer
    Start-ReactBuild
    
    # Build CEF application
    Start-CEFBuild
    
    # Copy runtime files
    Copy-RuntimeFiles
    
    # Test build
    if (Test-Build) {
        Write-Status "=== BUILD SUCCESSFUL ===" -ForegroundColor Green
        Write-Status "Executable: build\Release\frw-browser.exe" -ForegroundColor Cyan
        Write-Status "Run with: .\build\Release\frw-browser.exe" -ForegroundColor Cyan
        Write-Status "" -ForegroundColor White
        Write-Status "Test URLs:" -ForegroundColor Yellow
        Write-Status "  - Regular: https://google.com" -ForegroundColor White
        Write-Status "  - FRW: frw://myquantumsafename2025test/" -ForegroundColor White
        Write-Status "  - Settings: frw://settings" -ForegroundColor White
    } else {
        Write-Status "=== BUILD FAILED ===" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Status "BUILD ERROR: $_" -ForegroundColor Red
    Write-Status "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}

# Keep window open if running interactively
if (-not $env:CI) {
    Write-Status "Press any key to exit..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
