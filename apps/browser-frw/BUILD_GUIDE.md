# FRW Browser Build Guide

## Quick Start (One-Click Build)

### Option 1: Complete Automated Build
```powershell
# Run the complete build script (downloads everything automatically)
.\build-complete.ps1
```

### Option 2: Manual Build (If you already have CEF)
```powershell
# Set CEF path if you have CEF already
$env:CEF_ROOT = "C:\path\to\your\cef_binary_folder"

# Run simple build
.\build.ps1
```

## Detailed Build Instructions

### Prerequisites

1. **Visual Studio 2019+** with C++ tools
2. **CMake** (version 3.15+)
3. **Node.js** (version 16+)
4. **7-Zip** (recommended for extraction)
5. **Git** (for source control)

### Step-by-Step Build

#### Step 1: Open PowerShell as Administrator
```powershell
# Right-click PowerShell -> "Run as Administrator"
```

#### Step 2: Navigate to Project Directory
```powershell
cd "C:\Projects\FRW - Free Web Modern\apps\browser-frw"
```

#### Step 3: Choose Build Method

**Method A: Complete Automated Build (Recommended)**
```powershell
# Downloads CEF, builds React, compiles everything
.\build-complete.ps1
```

**Method B: Manual Build with Existing CEF**
```powershell
# If you already have CEF downloaded
$env:CEF_ROOT = "C:\path\to\cef_binary_120.2.13..."
.\build.ps1
```

**Method C: Manual Step-by-Step**
```powershell
# 1. Download CEF manually from https://cef-builds.spotifycdn.com/
# 2. Extract to C:\cef_binary_120.2.13...
# 3. Set environment variable
$env:CEF_ROOT = "C:\cef_binary_120.2.13..."

# 4. Build React renderer
cd "..\browser"
npm install
npm run build:vite
cd "..\browser-frw"

# 5. Build CEF application
cmake -B build -S . -DCEF_ROOT="$env:CEF_ROOT" -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release

# 6. Run the browser
.\build\Release\frw-browser.exe
```

## Build Script Options

### build-complete.ps1 Parameters
```powershell
# Custom CEF version
.\build-complete.ps1 -CEFVersion "120.2.13+g1128d61+chromium-120.0.6099.199"

# Skip CEF download (if you have CEF already)
.\build-complete.ps1 -SkipCEFDownload

# Skip React build (if React is already built)
.\build-complete.ps1 -SkipReactBuild

# Force rebuild everything
.\build-complete.ps1 -Force

# Custom download location
.\build-complete.ps1 -CEFDownloadPath "D:\downloads"
```

### build.ps1 (Simple Build)
```powershell
# Requires CEF_ROOT to be set first
$env:CEF_ROOT = "C:\path\to\cef_binary_..."
.\build.ps1
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "CEF_ROOT not set" Error
```powershell
# Solution: Download CEF and set the variable
$env:CEF_ROOT = "C:\path\to\your\extracted_cef_folder"
```

#### 2. "PowerShell execution policy" Error
```powershell
# Allow scripts to run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 3. "Visual Studio not found" Error
```powershell
# Install Visual Studio 2019+ with C++ development tools
# Or install Visual Studio Build Tools
```

#### 4. "CMake not found" Error
```powershell
# Install CMake from https://cmake.org/download/
# Or via Chocolatey: choco install cmake
```

#### 5. "Node.js not found" Error
```powershell
# Install Node.js from https://nodejs.org/
# Or via Chocolatey: choco install nodejs
```

#### 6. "React build failed" Error
```powershell
# Navigate to browser directory and install manually
cd "..\browser"
npm install
npm run build:vite
```

#### 7. "CEF download failed" Error
```powershell
# Download CEF manually:
# 1. Go to https://cef-builds.spotifycdn.com/index.html
# 2. Download Windows 64-bit build
# 3. Extract with 7-Zip
# 4. Set CEF_ROOT variable
```

#### 8. "Compilation errors" Error
```powershell
# Check Visual Studio installation
# Ensure Windows SDK is installed
# Try building with verbose output:
cmake --build build --config Release --verbose
```

#### 9. "Runtime DLLs missing" Error
```powershell
# The build script should copy these automatically
# If missing, copy manually:
Copy-Item "C:\path\to\cef\Release\*.dll" "build\Release\"
```

### Verification Steps

After successful build, verify:

1. **Executable exists**:
   ```powershell
   Test-Path "build\Release\frw-browser.exe"
   ```

2. **Required DLLs present**:
   ```powershell
   Test-Path "build\Release\libcef.dll"
   Test-Path "build\Release\chrome_elf.dll"
   ```

3. **Browser starts**:
   ```powershell
   .\build\Release\frw-browser.exe
   ```

4. **FRW protocol works**:
   - Navigate to `frw://myquantumsafename2025test/`
   - Should resolve and load content

5. **Regular websites work**:
   - Navigate to `https://google.com`
   - Should load normally

## Advanced Configuration

### Custom CEF Build
```powershell
# Use specific CEF version
$env:CEF_ROOT = "C:\cef_binary_121.3.19+g8c9d2e5+chromium-121.0.6167.184_windows64"
.\build.ps1
```

### Debug Build
```powershell
# Build in Debug mode for development
cmake -B build -S . -DCEF_ROOT="$env:CEF_ROOT" -DCMAKE_BUILD_TYPE=Debug
cmake --build build --config Debug
```

### Parallel Build
```powershell
# Build faster with multiple cores
cmake --build build --config Release --parallel
```

## File Structure After Build

```
apps/browser-frw/
├── build/
│   └── Release/
│       ├── frw-browser.exe          # Main executable
│       ├── libcef.dll               # CEF core library
│       ├── chrome_elf.dll           # Chrome helper
│       ├── *.pak                    # CEF resource packs
│       ├── Resources/               # CEF resources
│       └── ...                      # Other runtime files
├── src/                             # Source code
├── build.ps1                        # Simple build script
├── build-complete.ps1               # Complete build script
└── BUILD_GUIDE.md                   # This guide
```

## Performance Tips

1. **SSD Storage**: Build on SSD for faster compilation
2. **RAM**: 8GB+ RAM recommended for smooth builds
3. **CPU**: Multi-core CPU speeds up compilation
4. **Clean Builds**: Use `Remove-Item build -Recurse -Force` before rebuilds

## Support

If you encounter issues:

1. Check this guide first
2. Verify all prerequisites are installed
3. Try the complete build script with default settings
4. Check the build output for specific error messages
5. Ensure CEF version compatibility with your system

## Next Steps

After successful build:

1. **Test the browser** with various websites
2. **Try FRW URLs** to test distributed web functionality
3. **Explore menus** and features
4. **Check settings** and configuration options
5. **Test extensions** and developer tools

The browser is now ready for full testing and development!
