# FRW Protocol - Chrome Extension

**Browse the decentralized web using `frw://` URLs directly in Chrome, Edge, Brave, and other Chromium browsers.**

## Overview

This Chrome extension enables seamless browsing of FRW (Free Web) content published on IPFS with human-readable names. No separate application needed - just install the extension and start browsing `frw://name/` URLs!

### Key Features

- **frw:// Protocol Support** - Navigate to `frw://alice/`, `frw://bob/`, etc.
- **Distributed Name Resolution** - Queries 4 Swiss bootstrap nodes for fast, reliable resolution
- **IPFS Gateway Fallback** - Automatically tries multiple IPFS gateways (ipfs.io, Cloudflare, dweb.link, etc.)
- **Verification Badges** - Visual indicators showing cryptographically verified content
- **Smart Caching** - 5-minute L1 cache for instant repeated access
- **Beautiful UI** - Modern, clean interface matching FRW branding
- **Zero Configuration** - Works out of the box with FRW network

## Installation

### From Source (Development)

```bash
# Navigate to extension directory
cd apps/chrome-extension

# Install dependencies
npm install

# Build the extension
npm run build

# The built extension will be in the 'dist' directory
```

### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` directory
5. The FRW extension is now installed!

### Load in Edge, Brave, Opera

Same process as Chrome - all Chromium browsers support the same extension format.

## Usage

**IMPORTANT**: Chrome extensions cannot intercept `frw://` URLs typed directly in the address bar due to browser security limitations. Use one of these methods instead:

### Method 1: Extension Popup (Recommended - Easiest!)

1. **Click** the FRW icon in your toolbar (⚓ nautical wheel logo)
2. **Type** the name (e.g., `frw`)
3. **Click** "Go" or press Enter

**This is the most natural way to use the extension!**

### Method 2: Omnibox Keyword

1. Type `frw` in address bar
2. Press **Tab** (you'll see "Search FRW Protocol")
3. Type the name (e.g., `frw`)
4. Press **Enter**

### Method 3: Keyboard Shortcut (Coming Soon)

We're working on adding `Alt+F` to open the extension popup quickly.

---

## Why Can't I Type `frw://name` Directly?

Chrome doesn't allow extensions to register custom protocol handlers like `frw://`. This is a security restriction to prevent malicious extensions from hijacking URLs.

**For native `frw://` support**, use the **FRW Electron Browser** (`apps/browser/`) which registers the protocol at the OS level.

## Architecture

### Components

```
chrome-extension/
├── src/
│   ├── background/
│   │   └── service-worker.ts    # Intercepts frw:// URLs
│   ├── core/
│   │   ├── resolver.ts          # Queries bootstrap nodes
│   │   └── ipfs-fetcher.ts      # Fetches from IPFS gateways
│   ├── viewer/
│   │   ├── viewer.html          # Content display page
│   │   ├── viewer.css           # Styling
│   │   └── viewer.ts            # Viewer logic
│   └── popup/
│       ├── popup.html           # Extension popup
│       ├── popup.css            # Popup styling
│       └── popup.ts             # Popup logic
├── tests/
│   ├── resolver.test.ts         # Resolver unit tests
│   └── ipfs-fetcher.test.ts     # Fetcher unit tests
├── manifest.json                # Extension manifest (V3)
└── webpack.config.js            # Build configuration
```

### How It Works

1. **URL Interception**: Background service worker listens for `frw://` URLs
2. **Name Resolution**: Queries bootstrap HTTP API: `GET /api/resolve/:name`
3. **Bootstrap Response**: Returns `{name, publicKey, contentCID, timestamp, signature}`
4. **IPFS Fetch**: Tries multiple gateways: `https://ipfs.io/ipfs/{CID}/`
5. **Content Display**: Shows content in iframe with verification badge

### Bootstrap Nodes

The extension queries 4 Swiss bootstrap nodes in parallel for 99.9% uptime:

```typescript
const BOOTSTRAP_NODES = [
  'http://83.228.214.189:3100',   // Swiss #1
  'http://83.228.213.45:3100',    // Swiss #2
  'http://83.228.213.240:3100',   // Swiss #3
  'http://83.228.214.72:3100'     // Swiss #4
];
```

### IPFS Gateways

Auto-fallback across multiple public gateways:

- `https://ipfs.io` - Official IPFS gateway
- `https://cloudflare-ipfs.com` - Cloudflare CDN (fast globally)
- `https://dweb.link` - Protocol Labs gateway
- `https://gateway.pinata.cloud` - Pinata gateway
- `https://ipfs.eth.aragon.network` - Ethereum/Aragon gateway

## Development

### Setup

```bash
npm install
```

### Scripts

```bash
# Build for production
npm run build

# Build for development (with watch)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

### Testing

Comprehensive unit tests with Jest:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Current Coverage**: 80%+ on all metrics

### Project Structure

- **TypeScript** - Type-safe development
- **Webpack** - Module bundling
- **Jest** - Unit testing framework
- **Manifest V3** - Latest Chrome extension standard

## API Reference

### FRWResolver

```typescript
import { FRWResolver } from './core/resolver';

const resolver = new FRWResolver({
  bootstrapNodes: ['http://node:3100'],  // Optional custom nodes
  timeout: 3000,                          // Query timeout (ms)
  cacheTTL: 300000                        // Cache TTL (ms)
});

// Resolve name to record
const record = await resolver.resolveName('alice');
// Returns: { name, publicKey, contentCID, ipnsKey, timestamp, signature }

// Clear cache
resolver.clearCache();

// Get stats
const stats = resolver.getCacheStats();
// Returns: { size: number, entries: string[] }
```

### IPFSFetcher

```typescript
import { IPFSFetcher } from './core/ipfs-fetcher';

const fetcher = new IPFSFetcher(10000); // 10s timeout

// Fetch content
const result = await fetcher.fetch('QmXxx...', '/index.html');
// Returns: { content, mimeType, gateway, latency }
```

## Configuration

### Custom Bootstrap Nodes

You can configure custom bootstrap nodes in the extension options (future feature):

```json
{
  "bootstrapNodes": [
    "http://my-node:3100",
    "http://my-other-node:3100"
  ]
}
```

### Cache Settings

Cache TTL can be configured (default: 5 minutes):

```typescript
const resolver = new FRWResolver({ cacheTTL: 600000 }); // 10 minutes
```

## Troubleshooting

### Extension Not Loading URLs

1. Check extension is enabled: `chrome://extensions/`
2. Check browser console for errors
3. Verify bootstrap nodes are reachable
4. Try clearing cache in popup

### Name Not Found

- Name might not be registered yet
- Bootstrap nodes might be temporarily unavailable
- Check name spelling (case-insensitive)

### Content Not Loading

- IPFS gateways might be slow/unavailable
- Content CID might not be pinned
- Try refreshing the page

### Debugging

1. Open extension popup
2. Check cache statistics
3. Open browser DevTools console
4. Look for `[FRW Extension]`, `[Resolver]`, `[IPFS]` log messages

## Security

- **Cryptographic Verification**: All names are signed with Ed25519
- **Proof of Work**: Anti-spam protection on name registration
- **Content Isolation**: Content displayed in sandboxed iframe
- **HTTPS Gateways**: All IPFS fetches use HTTPS (except localhost)

## Performance

- **Resolution Speed**: 50-200ms (bootstrap HTTP API)
- **IPFS Fetch**: 500ms-5s (depends on gateway and pinning)
- **Cache Hit**: <1ms (instant)
- **Total Load Time**: 500ms-5s typical

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave 1.20+
- ✅ Opera 74+
- ✅ Any Chromium-based browser with Manifest V3 support

## Contributing

### Adding Features

1. Create feature branch: `git checkout -b feature/my-feature`
2. Write code with tests
3. Run `npm test` and `npm run lint`
4. Submit pull request

### Reporting Bugs

Open an issue with:
- Browser version
- Extension version
- Steps to reproduce
- Console logs

## Publishing

### Chrome Web Store

1. Build production version: `npm run build`
2. Create ZIP: `zip -r frw-extension.zip dist/*`
3. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Fill in store listing details
5. Submit for review

### Edge Add-ons

Same extension works on Edge - submit to [Edge Add-ons](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview)

## Roadmap

- [ ] Settings page for custom bootstrap nodes
- [ ] Bookmark manager for FRW sites
- [ ] History tracking
- [ ] Content pinning to local IPFS
- [ ] Offline mode with service worker cache
- [ ] Dark mode
- [ ] Multi-language support

## License

MIT License - see LICENSE file

## Links

- **GitHub**: https://github.com/frw-community/FRW-Free-Web
- **Documentation**: https://github.com/frw-community/FRW-Free-Web/docs
- **Community**: https://github.com/frw-community/FRW-Free-Web/discussions

## Support

- **Issues**: https://github.com/frw-community/FRW-Free-Web/issues
- **Discussions**: https://github.com/frw-community/FRW-Free-Web/discussions

---

**Built with ❤️ by the FRW Community**

**Making the decentralized web accessible to everyone, one extension at a time.**
