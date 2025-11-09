# FRW Quick Start Guide

Get your first FRW site running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- IPFS installed and running

## Step 1: Install IPFS

### macOS
```bash
brew install ipfs
```

### Linux
```bash
wget https://dist.ipfs.io/go-ipfs/latest/go-ipfs_linux-amd64.tar.gz
tar xvfz go-ipfs_linux-amd64.tar.gz
cd go-ipfs
sudo ./install.sh
```

### Windows
Download installer from https://ipfs.io

## Step 2: Start IPFS

```bash
ipfs init
ipfs daemon
```

Leave this running in a terminal.

## Step 3: Clone FRW

```bash
git clone https://github.com/your-org/frw-free-web-modern.git
cd frw-free-web-modern
npm install
```

## Step 4: Initialize Your Site

```bash
npm run frw init
```

This generates your cryptographic keys. Output:
```
Public key: 9ac8f22a4b1c...
Keys saved to .frw/
IMPORTANT: Keep your private key secure!
```

## Step 5: Create Your Page

Create `index.frw`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My First FRW Site</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@YOUR_PUBLIC_KEY">
  <meta name="frw-date" content="2025-11-08T00:00:00Z">
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <h1>Hello FRW!</h1>
  <p>This is my first decentralized website.</p>
</body>
</html>
```

Replace `YOUR_PUBLIC_KEY` with the key from step 4.

## Step 6: Publish

```bash
npm run frw publish
```

Output:
```
Publishing from .
Added to IPFS: QmXx...
Published to IPNS: k51...
Your site: frw://9ac8f22a4b1c.../index.frw
```

## Step 7: Browse

Start the FRW client:

```bash
npm run dev
```

Enter your FRW URL in the address bar.

## Done!

Your site is now live on the decentralized web!

## Next Steps

- [Full User Guide](./USER_GUIDE.md)
- [Create interactive pages](../examples/)
- [Join a webring](./USER_GUIDE.md#webrings)
- [Contribute](../CONTRIBUTING.md)

## Troubleshooting

**IPFS not found**
```bash
ipfs version
```
If error, reinstall IPFS.

**Permission denied**
```bash
chmod +x ./node_modules/.bin/frw
```

**Content not loading**
Wait 1-2 minutes for DHT propagation.
