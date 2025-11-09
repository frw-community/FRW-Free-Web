# FRW - Free Web Modern

> **A fully decentralized, censorship-resistant web publishing and browsing system**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![IPFS](https://img.shields.io/badge/IPFS-Powered-blueviolet.svg)](https://ipfs.tech)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)

---

## What is FRW?

FRW (Free Web Modern) is a complete decentralized web ecosystem that enables:

- 🌐 **Publish uncensorable websites** on IPFS
- 🔐 **Cryptographically sign content** with Ed25519
- 🆔 **Use human-readable names** instead of hashes
- 🌍 **Share globally** via distributed networks
- 🚀 **Browse with custom protocol** (`frw://`)

**No servers. No middlemen. Just the free web.**

---

## Features

### ✅ Complete System

- **CLI Tool** - Publish, verify, and manage content
- **Browser App** - Navigate frw:// URLs
- **IPFS Integration** - Distributed storage
- **Cryptography** - Ed25519 signatures
- **Naming System** - Human-readable URLs
- **TypeScript** - Full type safety

### ✅ Production Ready

- Monorepo architecture
- Comprehensive error handling
- Detailed logging
- Full documentation
- Working end-to-end

---

## Quick Start

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/frw-free-web-modern.git
cd frw-free-web-modern

# 2. Install dependencies
npm install

# 3. Build packages
npm run build

# 4. Install CLI
cd apps/cli
npm link
```

### Create Your First Site

```bash
# 1. Initialize FRW
frw init

# 2. Register your name
frw register myname

# 3. Create content
mkdir my-site && cd my-site
echo '<html><body><h1>Hello FRW!</h1></body></html>' > index.html

# 4. Publish
frw publish
```

### Launch Browser

```bash
# Navigate to browser
cd apps/browser

# Start browser
npm run electron:dev

# Navigate to: frw://myname/
```

**See the full guide:** [QUICK_START.md](QUICK_START.md)

---

## Documentation

📚 **Complete Guides:**

- **[Quick Start](QUICK_START.md)** - Get running in 5 minutes
- **[Installation Guide](INSTALLATION_GUIDE.md)** - Complete setup instructions
- **[User Guide](USER_GUIDE.md)** - How to use the browser
- **[IPFS Setup](IPFS_SETUP.md)** - IPFS configuration
- **[Browser Plan](BROWSER_PLAN.md)** - Technical architecture

---

## Architecture

```
FRW Ecosystem
├── CLI Tool (@frw/cli)
│   ├── Key management
│   ├── Content publishing
│   ├── Name registration
│   └── Signature verification
│
├── Browser (@frw/browser)
│   ├── frw:// protocol handler
│   ├── IPFS content fetching
│   ├── Signature verification
│   └── Modern React UI
│
└── Core Packages
    ├── @frw/common    - Shared types
    ├── @frw/crypto    - Ed25519 signatures
    ├── @frw/protocol  - URL parsing
    ├── @frw/ipfs      - IPFS client
    ├── @frw/sandbox   - VM execution
    └── @frw/storage   - Caching layer
```

---

## Technology Stack

- **Language:** TypeScript 5.3
- **Runtime:** Node.js 20+
- **Browser:** Electron 28
- **UI:** React 18 + TailwindCSS
- **Build:** Vite
- **Storage:** IPFS (Kubo)
- **Crypto:** TweetNaCl (Ed25519)
- **CLI:** Commander + Inquirer

---

## Usage Examples

### Publishing

```bash
# Publish a website
frw publish ./my-site

# Output:
# ✔ Published to IPFS
# CID: QmYwAPJzv5XgEvfF4KmGv...
# URL: frw://myname/
```

### Browsing

```bash
# Launch browser
npm run electron:dev

# Navigate to any frw:// URL
frw://alice/
frw://bob/blog/
frw://charlie/about.html
```

### Verification

```bash
# Verify content signature
frw verify index.html

# Output:
# ✓ Signature verified successfully!
# Content is authentic and unmodified
```

---

## Project Structure

```
frw-free-web-modern/
├── apps/
│   ├── cli/          # Command-line tool
│   └── browser/      # Electron browser
├── packages/
│   ├── common/       # Shared utilities
│   ├── crypto/       # Cryptography
│   ├── protocol/     # Protocol & parsing
│   ├── ipfs/         # IPFS integration
│   ├── sandbox/      # VM execution
│   └── storage/      # Storage layer
├── docs/             # Documentation
└── tests/            # Test suites
```

---

## Development

### Build

```bash
npm run build         # Build all packages
npm run build:cli     # Build CLI only
```

### Test

```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Lint

```bash
npm run lint         # Check code
npm run lint:fix     # Fix issues
npm run format       # Format code
```

---

## Contributing

We welcome contributions! Please see:

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines
- **[Development Guide](DEVELOPMENT.md)** - Dev setup

---

## Security

FRW uses:
- **Ed25519** cryptographic signatures
- **IPFS** content addressing
- **Sandboxed** execution
- **Signature verification** on all content

**Found a security issue?** Email: security@frw.dev

---

## Roadmap

### ✅ Phase 1: Core (Complete)
- [x] CLI tool
- [x] IPFS publishing
- [x] Browser with frw:// protocol
- [x] Signature verification
- [x] Name resolution

### 🚧 Phase 2: Features (Next)
- [ ] Tab support
- [ ] Bookmarks
- [ ] History
- [ ] Search
- [ ] Extensions

### 📋 Phase 3: Distribution
- [ ] Installers (Win/Mac/Linux)
- [ ] Auto-updates
- [ ] Public release
- [ ] Documentation site

**See full roadmap:** [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Community

- **GitHub:** https://github.com/frw-community/frw-free-web-modern
- **Discord:** [Coming soon]
- **Twitter:** [@FRWProtocol](https://twitter.com/FRWProtocol)
- **Website:** [Coming soon]

---

## Acknowledgments

Built with:
- [IPFS](https://ipfs.tech) - Distributed storage
- [Electron](https://electronjs.org) - Cross-platform apps
- [React](https://react.dev) - UI framework
- [TweetNaCl](https://tweetnacl.js.org) - Cryptography
- [TypeScript](https://typescriptlang.org) - Type safety

---

## Support

- **Documentation:** See `/docs` folder
- **Issues:** [GitHub Issues](https://github.com/frw-community/frw-free-web-modern/issues)
- **Discussions:** [GitHub Discussions](https://github.com/frw-community/frw-free-web-modern/discussions)

---

**Welcome to the Free Web!** 🌐

*Building a decentralized, censorship-resistant internet, one page at a time.*
