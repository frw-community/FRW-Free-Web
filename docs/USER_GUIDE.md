# FRW User Guide

## Getting Started

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/frw-free-web-modern.git
cd frw-free-web-modern

# Install dependencies
npm install

# Install IPFS (if not already installed)
# Download from https://ipfs.io or use package manager
```

### First Time Setup

1. **Start IPFS daemon**
```bash
ipfs init
ipfs daemon
```

2. **Initialize FRW**
```bash
npm run frw init
```

This creates a `.frw` directory with your cryptographic keys.

### Creating Your First Page

Create `index.frw` in your project directory:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My FRW Page</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@YOUR_PUBLIC_KEY">
  <meta name="frw-date" content="2025-11-08T00:00:00Z">
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
  </style>
</head>
<body>
  <h1>Hello FRW!</h1>
  <p>This is my first decentralized page.</p>
</body>
</html>
```

### Publishing Your Page

```bash
npm run frw publish
```

Your page is now on the FRW network! The CLI will output your FRW URL:
```
frw://YOUR_PUBLIC_KEY/index.frw
```

### Browsing FRW Content

1. **Start the FRW Client**
```bash
npm run dev
```

2. **Enter FRW URL in the address bar**
```
frw://PUBLIC_KEY/page.frw
```

## Core Concepts

### FRW URLs

Format: `frw://PUBLIC_KEY/PATH`

- `PUBLIC_KEY`: Author's Ed25519 public key (base58)
- `PATH`: Path to resource (e.g., `index.frw`, `blog/post.frw`)

### Content Signing

All content must be signed with your private key. The signature proves:
- You are the author
- Content hasn't been tampered with
- Content is authentic

### IPFS Integration

FRW uses IPFS for:
- **Storage**: Distribute content across peers
- **Addressing**: Content-addressed by hash
- **Discovery**: DHT for peer/content discovery
- **Naming**: IPNS for mutable references

## Creating Content

### Page Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Page Title</title>
  
  <!-- Required FRW metadata -->
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@your-public-key">
  <meta name="frw-date" content="2025-11-08T00:00:00Z">
  
  <!-- Optional metadata -->
  <meta name="frw-keywords" content="tags, keywords">
  <meta name="frw-license" content="CC-BY-4.0">
  
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Your content -->
  <script src="script.frw.js"></script>
</body>
</html>
```

### Linking Pages

```html
<!-- Link to another FRW page -->
<a href="frw://other-key/page.frw">Visit site</a>

<!-- Link within your site -->
<a href="frw://your-key/about.frw">About</a>
```

### Adding Images

```html
<!-- Local images -->
<img src="images/photo.jpg" alt="Photo">

<!-- From IPFS -->
<img src="ipfs://QmHash..." alt="Image">
```

### JavaScript

JavaScript works normally but runs in a sandbox for security:

```javascript
// Safe operations
document.getElementById('btn').onclick = () => {
  alert('Hello!');
};

// IPFS API (if permission granted)
const content = await ipfs.cat('QmHash...');
```

## CLI Commands

### Initialize Site

```bash
npm run frw init
```

Generates cryptographic keypair and creates `.frw/` directory.

### Publish Content

```bash
# Publish current directory
npm run frw publish

# Publish specific directory
npm run frw publish ./my-site
```

### Verify Signature

```bash
npm run frw verify index.frw
```

Checks if signature is valid.

## Security

### Key Management

**Private Key**
- Stored in `.frw/private.key`
- Keep encrypted
- Never share
- Backup securely

**Public Key**
- Stored in `.frw/public.key`
- Your FRW identity
- Safe to share

### Content Verification

Client automatically verifies:
1. Signature matches author
2. Content hasn't been modified
3. Script permissions

### Sandbox

JavaScript runs in isolated environment:
- No file system access
- No network access (except approved IPFS API)
- Limited DOM access
- No eval/Function constructor

## Troubleshooting

### IPFS Not Starting

```bash
# Check IPFS status
ipfs id

# Restart daemon
ipfs daemon
```

### Content Not Found

- Wait for DHT propagation (can take minutes)
- Check IPFS daemon is running
- Verify CID is correct
- Try different gateway

### Signature Verification Failed

- Content was modified after signing
- Wrong public key
- Re-publish with correct key

### Client Won't Load Page

- Check IPFS connection
- Verify URL format
- Check browser console for errors

## Advanced

### Custom Permissions

Request specific permissions:

```html
<meta name="frw-permissions" content="ipfs:read, storage:local">
```

### Directory Structure

```
my-site/
  index.frw           # Homepage
  about.frw           # About page
  blog/
    post1.frw
    post2.frw
  assets/
    style.css
    logo.png
  scripts/
    main.frw.js       # Signed scripts
```

### Webrings

Join communities by linking member sites:

```html
<nav class="webring">
  <a href="frw://prev-site/index.frw">← Previous</a>
  <a href="frw://ring-hub/index.frw">Ring Hub</a>
  <a href="frw://next-site/index.frw">Next →</a>
</nav>
```

## Best Practices

1. **Keep private key secure** - Use strong encryption, backup safely
2. **Sign all content** - Ensures authenticity
3. **Optimize images** - Faster loading on P2P network
4. **Use semantic HTML** - Better accessibility
5. **Test locally** - Verify before publishing
6. **Version content** - Use metadata dates
7. **Pin important content** - Ensure availability

## Resources

- [Protocol Specification](./SPECIFICATION.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Security Model](./SECURITY.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Example Sites](../examples/)
