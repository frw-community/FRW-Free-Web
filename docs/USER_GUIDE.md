# FRW Browser User Guide

Complete guide to using the FRW Browser and decentralized web system.

---

## Quick Start

### Launch the Browser

```bash
# Navigate to browser directory
cd "C:\Projects\FRW - Free Web Modern\apps\browser"

# Start browser
npm run electron:dev
```

The FRW Browser window opens after 5-10 seconds.

---

## Browser Interface

### Main Components

```
┌─────────────────────────────────────────┐
│  ←  →  ↻         FRW Browser           │ Navigation Bar
├─────────────────────────────────────────┤
│  [SECURE] frw://alice/              [Go]     │ Address Bar
├─────────────────────────────────────────┤
│  [x] Verified @alice                     │ Verification Badge
│     Published: 09/11/2025              │
├─────────────────────────────────────────┤
│                                         │
│         [Page Content Here]             │ Content Viewer
│                                         │
├─────────────────────────────────────────┤
│  [OK] IPFS Connected    FRW Browser v1.0  │ Status Bar
└─────────────────────────────────────────┘
```

### Controls

- **←** Back button
- **→** Forward button  
- **↻** Reload page
- **Address Bar** - Enter frw:// URLs
- **Go** - Navigate to URL

---

## Publishing Content

### 1. Create Your Website

```bash
# Create directory
mkdir my-site
cd my-site

# Create HTML file
notepad index.html
```

**Minimal FRW page:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Site</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@yourname">
  <meta name="frw-date" content="2025-11-09T00:00:00Z">
</head>
<body>
  <h1>Hello World!</h1>
</body>
</html>
```

### 2. Publish to IPFS

```bash
frw publish
```

**Output:**
```
✔ Published to IPFS
IPFS CID: QmYwAPJzv...
Your site is accessible at: frw://yourname/
```

### 3. Update Config (Important!)

Add the CID to your config at `~/.frw/config.json`:

```json
{
  "publishedSites": {
    "yourname": "QmYourActualCIDFromAbove"
  }
}
```

### 4. Browse Your Site

1. Open FRW Browser
2. Enter `frw://yourname/`
3. Click **Go**
4. Your page loads!

---

## Navigating Content

### Entering URLs

**Format:** `frw://name/path`

**Examples:**
- `frw://alice/` - Alice's homepage
- `frw://alice/about.html` - About page
- `frw://alice/blog/post1.html` - Blog post

### Verification Badge

**Green badge ([x] Verified):**
- Content is cryptographically signed
- Signature is valid
- Author confirmed

**Yellow badge ([!] Unverified):**
- No signature found
- Content cannot be verified
- View with caution

---

## CLI Commands

### Essential Commands

```bash
# Initialize FRW
frw init

# Register a name
frw register myname

# Publish content
frw publish ./my-site

# Verify a file
frw verify index.html

# Preview locally
frw serve

# Check IPFS connection
frw ipfs

# List keys
frw keys --list
```

### Publishing Workflow

```bash
# 1. Create content
mkdir website && cd website
echo '<html>...</html>' > index.html

# 2. Preview locally
frw serve
# Opens http://localhost:3000

# 3. Publish to IPFS
frw publish

# 4. Note the CID and update config

# 5. Browse in FRW Browser
# Navigate to frw://yourname/
```

---

## Configuration

### Config Location

**Windows:** `C:\Users\YourName\.frw\config.json`  
**macOS/Linux:** `~/.frw/config.json`

### Config Structure

```json
{
  "defaultKeyPath": "C:\\Users\\You\\.frw\\keys\\default.json",
  "ipfsHost": "localhost",
  "ipfsPort": 5001,
  "registeredNames": {
    "alice": "HwKdx6DgXwpEW43Px1Vos1BpWmQwEVYcp7S1DWD3VFcK"
  },
  "publishedSites": {
    "alice": "QmWdZUNyME2jmaArxuaudRzrocC6BuokFPkGpa8v68xMEe"
  }
}
```

---

## Keyboard Shortcuts

- **Ctrl+L** - Focus address bar
- **Ctrl+R** - Reload page
- **Ctrl+Shift+I** - Open DevTools
- **Alt+←** - Back
- **Alt+→** - Forward

---

## Troubleshooting

### Page doesn't load

1. Check IPFS is running: `ipfs id`
2. Verify CID in config matches published CID
3. Test in regular browser: `http://localhost:8080/ipfs/[CID]/`

### "Site Not Found" error

- Site hasn't been published yet
- CID not in `publishedSites` config
- Run `frw publish` and update config

### IPFS Disconnected

- Start IPFS daemon: `ipfs daemon`
- Or launch IPFS Desktop

---

## Advanced Features

### Multiple Pages

```
my-site/
├── index.html
├── about.html
├── blog/
│   └── post1.html
└── css/
    └── style.css
```

Publish entire directory: `frw publish my-site`

### Custom Styles

Include CSS in your HTML:
```html
<link rel="stylesheet" href="css/style.css">
```

FRW serves all files from your published directory.

---

## Best Practices

1. **Always sign content** - Include FRW metadata
2. **Test locally first** - Use `frw serve`
3. **Keep backups** - Save your keypair
4. **Update regularly** - Republish for changes
5. **Verify signatures** - Check verification badge

---

## Sharing Your Site

**Share the frw:// URL:**
```
frw://yourname/
```

**Or share IPFS gateway URL:**
```
https://ipfs.io/ipfs/QmYourCID/
```

Both work! The frw:// URL is cleaner.

---

## Support

- **Installation Guide:** `INSTALLATION_GUIDE.md`
- **IPFS Setup:** `IPFS_SETUP.md`
- **Technical Docs:** `BROWSER_PLAN.md`

---

**Enjoy the decentralized web!** [GLOBE]
