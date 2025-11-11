# FRW Quick Start Guide

**Status:** PRODUCTION READY | **Time:** 10 minutes

Get your site on the decentralized web with global name resolution!

---

## Prerequisites

- ✓ Node.js 20+ installed
- ✓ IPFS running (Desktop or daemon)
- ✓ FRW repository cloned

---

## Installation (One-Time Setup)

```bash
# 1. Install dependencies
cd "C:\Projects\FRW - Free Web Modern"
npm install

# 2. Build all packages
npm run build

# 3. Link CLI globally
cd apps/cli
npm link

# Verify installation
frw --version
```

---

## Step 1: Initialize FRW

```bash
# Create your keypair
frw init

# Press Enter for defaults
# Enter 'n' when asked for password (optional)
```

**Result:** Keypair created at `~/.frw/keys/default.key`

---

## Step 2: Start IPFS

```bash
# Start IPFS daemon
ipfs daemon

# Or use IPFS Desktop
# Download: https://docs.ipfs.tech/install/ipfs-desktop/
```

**Result:** IPFS running on `http://localhost:5001`

---

## Step 3: Register Your Name

```bash
# Register a globally unique name
frw register myname

# Wait for Proof of Work (~10 seconds)
# Name is published to distributed registry
```

**Result:** Name registered on bootstrap node `http://83.228.214.189:3100`

---

## Step 4: Create Your Site

```bash
# 1. Create a site directory
mkdir my-site
cd my-site

# 2. Create HTML file
echo "<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <title>My FRW Site</title>
</head>
<body>
  <h1>Hello Decentralized Web!</h1>
  <p>This site is hosted on IPFS and accessible globally via frw://myname/</p>
</body>
</html>" > index.html
```

**Result:** `index.html` ready to publish

---

## Step 5: Publish with Name

```bash
# Publish and link to your registered name
frw publish . --name myname

# Process:
# ✓ Files signed
# ✓ Uploaded to IPFS
# ✓ Published to IPNS
# ✓ Name registry updated
```

**Result:** 
- IPFS CID: `QmXXX...`
- Name `myname` now points to your content
- Globally resolvable!

---

## Step 6: Launch Browser

```bash
# Navigate to browser
cd "C:\Projects\FRW - Free Web Modern\apps\browser"

# Install dependencies (first time)
npm install

# Start browser
npm run dev
```

**Result:** FRW Browser opens

---

## Step 7: Browse Your Site

1. Browser window opens automatically
2. Enter in address bar: `frw://myname/`
3. Click **Go** (or press Enter)
4. **Your site loads!** 🚀

**What you'll see:**
- ✓ Green verification badge (@yourname)
- ✓ "Secure" indicator
- ✓ Your content from IPFS
- ✓ Resolved via distributed registry

---

## Verify Global Resolution

```powershell
# Check your name on the bootstrap node
Invoke-RestMethod http://83.228.214.189:3100/api/resolve/myname

# Should return:
# name: myname
# publicKey: YOUR_KEY
# contentCID: QmXXX... (your IPFS hash)
# resolvedBy: bootstrap-XXXXX
```

**Result:** Your name is globally resolvable! Anyone can access `frw://myname/`

---

## Essential Commands

```bash
# Setup
frw init                          # Initialize FRW
frw register <name>               # Register global name

# Publishing
frw publish <directory>           # Publish to IPFS only
frw publish <directory> --name <name>  # Publish and update registry

# Utilities
frw serve [dir]                   # Preview locally
frw ipfs                          # Check IPFS status
frw keys                          # Manage keypairs
```

---

## Update Your Site

```bash
# Edit your files
echo "<p>Updated content!</p>" >> my-site/index.html

# Republish (automatically updates registry)
frw publish my-site --name myname

# Refresh browser - new content loads!
```

---

## Troubleshooting

### IPFS Not Connected
```bash
# Check IPFS status
ipfs id

# Restart daemon
ipfs daemon
```

### Name Not Found in Browser
```bash
# Verify registration
Invoke-RestMethod http://83.228.214.189:3100/api/resolve/myname

# Republish with name
frw publish my-site --name myname
```

### CLI Not Found
```bash
# Re-link CLI
cd "C:\Projects\FRW - Free Web Modern\apps\cli"
npm link
```

### Page Not Loading
1. Check IPFS daemon is running: `ipfs id`
2. Verify name has contentCID: See "Verify Global Resolution" above
3. Restart browser: `npm run dev`
4. Clear browser cache: DevTools → Application → Clear Storage

---

## What You Just Built

✓ **Decentralized Identity:** Your keypair, your name  
✓ **Global Name Registry:** Distributed across IPFS  
✓ **Content Distribution:** Hosted on IPFS, cached globally  
✓ **Censorship Resistant:** No central server to shut down  
✓ **Permanent:** Your content persists as long as it's pinned  

---

## Next Steps

1. **Customize Your Site:** Add CSS, images, multiple pages
2. **Share Your Name:** Tell others to visit `frw://myname/`
3. **Run a Bootstrap Node:** Help the network by running `docs/deployment/DEPLOY_NOW_VPS.md`
4. **Explore Advanced Features:**
   - DNS verification: `frw register --verify-dns`
   - Challenge system: `docs/USER_GUIDE_CHALLENGES.md`
   - Multi-site hosting: Create multiple names

---

## Full Documentation

- **Deployment Guide:** `docs/deployment/DEPLOY_NOW_VPS.md`
- **User Guide:** `docs/USER_GUIDE.md`
- **Command Reference:** `QUICK_COMMANDS.md`
- **Architecture:** `docs/ARCHITECTURE.md`

---

## Live Bootstrap Node

**URL:** http://83.228.214.189:3100  
**Status:** ✓ Operational (Switzerland)  
**API:** `/api/resolve/<name>`, `/api/stats`, `/api/health`

---

**Congratulations! You're now part of the Free Resilient Web!** 🌐
