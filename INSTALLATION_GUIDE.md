# FRW Installation Guide

Complete guide to installing and setting up the FRW (Free Web Modern) decentralized web system.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installing IPFS](#installing-ipfs)
4. [Installing FRW](#installing-frw)
5. [First-Time Setup](#first-time-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing FRW, ensure you have the following:

### Required Software

- **Node.js** (v20.0.0 or higher)
- **npm** (v10.0.0 or higher)
- **Git** (for cloning the repository)
- **IPFS** (Desktop or CLI)

### Operating System

FRW supports:
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+, Fedora, Arch)

---

## System Requirements

### Minimum Requirements
- **CPU:** Dual-core processor
- **RAM:** 4 GB
- **Storage:** 2 GB free space
- **Network:** Stable internet connection

### Recommended Requirements
- **CPU:** Quad-core processor
- **RAM:** 8 GB or more
- **Storage:** 10 GB+ for IPFS content
- **Network:** High-speed internet

---

## Installing IPFS

IPFS is required for FRW to store and retrieve decentralized content.

### Option 1: IPFS Desktop (Recommended for Beginners)

**Windows:**
1. Download IPFS Desktop from https://github.com/ipfs/ipfs-desktop/releases
2. Run the installer (`IPFS-Desktop-Setup-*.exe`)
3. Launch IPFS Desktop
4. The IPFS daemon starts automatically

**macOS:**
1. Download IPFS Desktop `.dmg` file
2. Open the DMG and drag IPFS Desktop to Applications
3. Launch from Applications folder
4. Allow in System Preferences if prompted

**Linux:**
1. Download the `.AppImage` or `.deb` file
2. Make executable: `chmod +x IPFS-Desktop-*.AppImage`
3. Run: `./IPFS-Desktop-*.AppImage`
4. Or install DEB: `sudo dpkg -i IPFS-Desktop-*.deb`

### Option 2: IPFS Command Line

**Windows (PowerShell):**
```powershell
# Download
Invoke-WebRequest -Uri "https://dist.ipfs.tech/kubo/v0.25.0/kubo_v0.25.0_windows-amd64.zip" -OutFile "ipfs.zip"

# Extract
Expand-Archive ipfs.zip -DestinationPath .

# Move to PATH
Move-Item kubo\ipfs.exe C:\Windows\System32\

# Initialize
ipfs init

# Start daemon
ipfs daemon
```

**macOS:**
```bash
# Using Homebrew
brew install ipfs

# Initialize
ipfs init

# Start daemon
ipfs daemon
```

**Linux:**
```bash
# Download
wget https://dist.ipfs.tech/kubo/v0.25.0/kubo_v0.25.0_linux-amd64.tar.gz

# Extract
tar xvfz kubo_v0.25.0_linux-amd64.tar.gz

# Install
cd kubo
sudo ./install.sh

# Initialize
ipfs init

# Start daemon
ipfs daemon
```

### Verify IPFS Installation

```bash
# Check version
ipfs version

# Check daemon is running
ipfs id
```

Expected output: Your IPFS peer ID and version information.

---

## Installing FRW

### Step 1: Clone the Repository

```bash
# Clone from GitHub (when published)
git clone https://github.com/frw-community/frw-free-web-modern.git

# Or use your local path
cd "C:\Projects\FRW - Free Web Modern"
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install
```

This will install dependencies for:
- Root workspace
- All packages (`@frw/common`, `@frw/crypto`, etc.)
- CLI tool (`@frw/cli`)
- Browser app (`@frw/browser`)

**Expected output:**
```
added 1393 packages in 30s
```

### Step 3: Build All Packages

```bash
# Build all TypeScript packages
npm run build
```

This compiles:
1. `@frw/common` - Common types and utilities
2. `@frw/crypto` - Cryptography functions
3. `@frw/ipfs` - IPFS integration
4. `@frw/protocol` - Protocol parsing
5. `@frw/sandbox` - VM execution
6. `@frw/storage` - Storage layer
7. `@frw/cli` - Command-line tool

**Expected output:**
```
✓ All packages built successfully
```

### Step 4: Install CLI Globally

```bash
# Link the CLI tool
cd apps/cli
npm link
```

**Windows:** Run PowerShell as Administrator if you get permission errors.

**macOS/Linux:**
```bash
sudo npm link
```

### Step 5: Verify CLI Installation

```bash
# Check FRW version
frw --version
```

Expected output: `1.0.0`

```bash
# Check available commands
frw --help
```

Expected output: List of all FRW commands.

---

## First-Time Setup

### 1. Initialize FRW Configuration

```bash
# Initialize FRW (creates keypair)
frw init
```

**Interactive prompts:**
1. **Name for this key:** Press Enter (default: "default")
2. **Password-protect private key?** Type `n` for no, `y` for yes
3. If yes, enter password twice

**Output:**
```
FRW Initialization
──────────────────
✔ Directories created
✔ Keypair generated
✔ Keypair saved

Initialization Complete
───────────────────────
✓ FRW has been initialized successfully!

Your public key: HwKdx6DgXwpEW43Px1Vos1BpWmQwEVYcp7S1DWD3VFcK
Key file: C:\Users\YourName\.frw\keys\default.json
```

**Files created:**
- `~/.frw/config.json` - FRW configuration
- `~/.frw/keys/default.json` - Your keypair

### 2. Register a Human-Readable Name

```bash
# Register your name
frw register yourname
```

Replace `yourname` with your desired name (3-63 characters, lowercase, letters/numbers/hyphens).

**Output:**
```
Registration Complete
─────────────────────
✓ Name "yourname" registered successfully!

Your site will be accessible at:
  frw://yourname/
```

### 3. Check IPFS Connection

```bash
# Verify IPFS is accessible
frw ipfs
```

**Expected output:**
```
IPFS Connection Status
──────────────────────
✔ Connected to IPFS

Node Info:
  ID: 12D3KooW...
  Agent: kubo/0.25.0
  
Connection:
  Host: localhost
  Port: 5001
  URL: http://localhost:5001
```

If this fails, ensure IPFS daemon is running.

---

## Installing the Browser

### Step 1: Install Browser Dependencies

```bash
cd apps/browser
npm install
```

### Step 2: Configure PostCSS (if not already done)

The `postcss.config.js` should already exist. Verify:

```bash
# Check file exists
ls postcss.config.js
```

If missing, create it:

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Step 3: Build Browser (Optional, for production)

```bash
# Development mode (skip this)
npm run electron:dev

# Production build (creates installer)
npm run electron:build
```

---

## Verification

### Test the Complete Workflow

#### 1. Create Test Content

```bash
# Navigate to a test directory
cd ~/Desktop
mkdir frw-test
cd frw-test

# Create a simple HTML page
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My FRW Site</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@yourname">
  <meta name="frw-date" content="2025-11-09T00:00:00Z">
</head>
<body>
  <h1>Hello FRW!</h1>
  <p>This is my first decentralized website.</p>
</body>
</html>
EOF
```

**Windows (PowerShell):**
```powershell
@'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My FRW Site</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@yourname">
  <meta name="frw-date" content="2025-11-09T00:00:00Z">
</head>
<body>
  <h1>Hello FRW!</h1>
  <p>This is my first decentralized website.</p>
</body>
</html>
'@ | Out-File -FilePath index.html -Encoding utf8
```

#### 2. Publish to IPFS

```bash
# Publish the site
frw publish .
```

**Expected output:**
```
Publish to FRW
──────────────
✔ Keypair loaded
✔ Found 1 files
✔ Signed 1 HTML files
✔ Connected to IPFS
✔ Published to IPFS
✔ Content pinned
✔ Published to IPNS

Publish Complete
────────────────
✓ Content published successfully!

IPFS CID: QmYwAPJzv...
Your site is accessible at:
  frw://yourname/
  https://ipfs.io/ipfs/QmYwAPJzv.../
```

#### 3. Launch Browser

```bash
# Navigate to browser directory
cd "C:\Projects\FRW - Free Web Modern\apps\browser"

# Start browser in development mode
npm run electron:dev
```

Browser window opens with FRW interface.

#### 4. Navigate to Your Site

1. In the address bar, type: `frw://yourname/`
2. Click **Go**
3. Your page should load!

**Expected result:** Your "Hello FRW!" page displays in the browser.

---

## Troubleshooting

### Issue: `frw: command not found`

**Cause:** CLI not linked globally.

**Solution:**
```bash
cd apps/cli
npm link
```

**Windows:** Run as Administrator.

---

### Issue: `Failed to connect to IPFS`

**Cause:** IPFS daemon not running.

**Solution:**
```bash
# Check if IPFS is running
ipfs id

# If not, start it
ipfs daemon
```

Or launch IPFS Desktop.

---

### Issue: Browser shows test page instead of real content

**Cause:** CID not in config.

**Solution:**
After publishing, manually update `~/.frw/config.json`:

```json
{
  "publishedSites": {
    "yourname": "QmYourActualCID"
  }
}
```

---

### Issue: `ECONNREFUSED` when loading frw:// URLs

**Cause:** IPFS gateway not accessible.

**Solution:**
1. Check IPFS is running: `ipfs id`
2. Test gateway in browser: `http://localhost:8080/ipfs/QmTest`
3. If port differs, update browser config

---

### Issue: Permission denied errors

**Windows:**
- Run PowerShell as Administrator
- Or use: `npm link --force`

**macOS/Linux:**
```bash
sudo npm link
```

---

### Issue: Build errors in TypeScript

**Solution:**
```bash
# Clean build
npm run clean

# Rebuild
npm run build
```

---

### Issue: Electron fails to start

**Cause:** Vite dev server not ready.

**Solution:**
Wait 5-10 seconds after running `npm run electron:dev`. The browser will launch automatically when Vite is ready.

---

## Post-Installation

### Configure IPFS (Optional)

```bash
# Increase storage limit
ipfs config Datastore.StorageMax 100GB

# View current config
ipfs config show
```

### Update FRW Config (Optional)

Edit `~/.frw/config.json`:

```json
{
  "defaultKeyPath": "C:\\Users\\You\\.frw\\keys\\default.json",
  "ipfsHost": "localhost",
  "ipfsPort": 5001,
  "registeredNames": {
    "yourname": "YourPublicKey"
  },
  "publishedSites": {
    "yourname": "YourIPFSCID"
  }
}
```

---

## Next Steps

✅ **Installation complete!**

**What to do next:**
1. Read the [User Guide](USER_GUIDE.md)
2. Create your first website
3. Publish to IPFS
4. Browse decentralized content
5. Share your frw:// URL

---

## Support

**Documentation:**
- User Guide: `USER_GUIDE.md`
- Browser Plan: `BROWSER_PLAN.md`
- IPFS Setup: `IPFS_SETUP.md`

**Resources:**
- IPFS Docs: https://docs.ipfs.tech
- Electron: https://electronjs.org
- TypeScript: https://typescriptlang.org

**Issues:**
- GitHub: https://github.com/frw-community/frw-free-web-modern/issues

---

## Quick Reference

```bash
# Essential Commands
frw init                # Initialize FRW
frw register <name>     # Register a name
frw publish [dir]       # Publish content
frw ipfs                # Check IPFS status
npm run electron:dev    # Launch browser (from apps/browser)

# IPFS Commands
ipfs daemon             # Start IPFS
ipfs id                 # Check IPFS status
ipfs pin ls             # List pinned content
```

---

**Welcome to FRW!** 🎉

You're now part of the decentralized web revolution.
