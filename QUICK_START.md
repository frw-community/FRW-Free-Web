# FRW Quick Start Guide

Get up and running with FRW in 5 minutes!

---

## Prerequisites

- [DONE] Node.js 20+ installed
- [DONE] IPFS running (Desktop or daemon)
- [DONE] FRW repository cloned

---

## Installation (One-Time Setup)

```bash
# 1. Install dependencies
npm install

# 2. Build packages
npm run build

# 3. Link CLI
cd apps/cli
npm link
```

---

## First-Time Setup

```bash
# 1. Initialize FRW
frw init
# Press Enter for defaults, 'n' for no password

# 2. Register your name
frw register alice
# Replace 'alice' with your name
```

---

## Create & Publish

```bash
# 1. Create a site
mkdir my-site
cd my-site

# 2. Create HTML file
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My FRW Site</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@alice">
  <meta name="frw-date" content="2025-11-09T00:00:00Z">
</head>
<body>
  <h1>Hello FRW!</h1>
</body>
</html>
EOF

# 3. Publish
frw publish

# 4. Note the CID from output
```

---

## Configure Browser

Edit `~/.frw/config.json` and add:

```json
{
  "publishedSites": {
    "alice": "QmYourCIDFromAbove"
  }
}
```

---

## Launch Browser

```bash
# Navigate to browser
cd "C:\Projects\FRW - Free Web Modern\apps\browser"

# Start browser
npm run electron:dev
```

---

## Browse Your Site

1. Wait for browser window to open
2. Enter in address bar: `frw://alice/`
3. Click **Go**
4. **See your page!** 🎉

---

## Verify It Works

Your page should display in the browser with:
- [DONE] Green verification badge
- [DONE] Your content visible
- [DONE] IPFS Connected status

---

## Essential Commands

```bash
frw init            # Setup FRW
frw register <name> # Register name
frw publish [dir]   # Publish to IPFS
frw serve          # Preview locally
frw ipfs           # Check IPFS status
```

---

## Troubleshooting

**IPFS not connected?**
```bash
ipfs daemon
```

**CLI not found?**
```bash
cd apps/cli
npm link
```

**Page not loading?**
- Check CID in config matches published CID
- Restart browser after config changes

---

## Full Documentation

- **Installation:** `INSTALLATION_GUIDE.md`
- **User Guide:** `USER_GUIDE.md`
- **IPFS Setup:** `IPFS_SETUP.md`

---

**That's it! You're now using the decentralized web!** [LAUNCH]
