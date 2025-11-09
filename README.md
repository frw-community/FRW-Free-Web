# FRW - Free Web Modern

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![IPFS](https://img.shields.io/badge/IPFS-Powered-blueviolet.svg)](https://ipfs.tech)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)

A fully decentralized, censorship-resistant web publishing and browsing system

## What is FRW?

FRW (Free Web Modern) is a complete decentralized web ecosystem that enables:

- Publish uncensorable websites on IPFS
- Cryptographically sign content with Ed25519
- Use human-readable names instead of hashes
- Share globally via distributed networks
- Browse with custom protocol (`frw://`)

No servers. No middlemen. Just the free web.

## See It In Action

![FRW Browser showing verified frw://alice/ content](docs/images/browser-screenshot.png)
*FRW Browser displaying a verified decentralized website - no servers, no censorship, just cryptographic proof*

### Complete Workflow

![CLI Workflow from init to publish](docs/images/cli-workflow.png)
*From identity creation to publishing - the full FRW experience in your terminal*

## Features

### Complete System

- **CLI Tool** - Publish, verify, and manage content
- **Browser App** - Navigate frw:// URLs
- **IPFS Integration** - Distributed storage
- **Cryptography** - Ed25519 signatures
- **Naming System** - Human-readable URLs
- **TypeScript** - Full type safety

### Production Ready

- Monorepo architecture
- Comprehensive error handling
- Detailed logging
- Full documentation
- Working end-to-end

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/frw-free-web-modern.git
cd frw-free-web-modern

# Install dependencies
npm install

# Build packages
npm run build

# Install CLI
cd apps/cli
npm link
```

### Create Your First Site

```bash
# Initialize FRW
frw init

# Register your name
frw register myname

# Create content
mkdir my-site && cd my-site
echo '<html><body><h1>Hello FRW!</h1></body></html>' > index.html

# Publish
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

See the full guide: [QUICK_START.md](QUICK_START.md)

## Philosophy

**📜 [Read The FRW Manifesto](MANIFESTO.md)** - Our vision for a free, decentralized web

## Documentation

**📚 [Complete Documentation Index](docs/DOCUMENTATION_INDEX.md)** - All documentation organized by topic

### Quick Access

**Getting Started:**
- [Quick Start](QUICK_START.md) - Get running in 5 minutes
- [Installation Guide](docs/INSTALLATION_GUIDE.md) - Complete setup instructions
- [User Guide](docs/USER_GUIDE.md) - How to use the browser

**Technical:**
- [Specification](docs/SPECIFICATION.md) - FRW Protocol v1.0
- [Architecture](docs/ARCHITECTURE.md) - System design
- [Security](docs/SECURITY.md) - Security model
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - API reference

**For Contributors:**
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Roadmap](docs/ROADMAP.md) - Development phases

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

## Technology Stack

- **Language:** TypeScript 5.3
- **Runtime:** Node.js 20+
- **Browser:** Electron 28
- **UI:** React 18 + TailwindCSS
- **Build:** Vite
- **Storage:** IPFS (Kubo)
- **Crypto:** TweetNaCl (Ed25519)
- **CLI:** Commander + Inquirer

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

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md)

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Security

FRW uses:
- Ed25519 cryptographic signatures
- IPFS content addressing
- Sandboxed execution
- Signature verification on all content

Found a security issue? Email: security@frw.dev

## Roadmap

### Phase 1: Core (Complete)
- [x] CLI tool
- [x] IPFS publishing
- [x] Browser with frw:// protocol
- [x] Signature verification
- [x] Name resolution

### Phase 2: Features (In Progress)
- [x] Electron browser working
- [x] IPFS content fetching
- [ ] Tab support
- [ ] Bookmarks
- [ ] History

### Phase 3: Distribution
- [ ] Installers (Win/Mac/Linux)
- [ ] Auto-updates
- [ ] Public release
- [ ] Documentation site

See full roadmap: [PRODUCTION_ROADMAP.md](docs/PRODUCTION_ROADMAP.md)

## License

MIT License - see [LICENSE](LICENSE) for details

## Community

- **GitHub:** https://github.com/frw-community/frw-free-web-modern
- **Discord:** [Coming soon]
- **Twitter:** [@FRWProtocol](https://twitter.com/FRWProtocol)
- **Website:** [Coming soon]

## Acknowledgments

Built with:
- [IPFS](https://ipfs.tech) - Distributed storage
- [Electron](https://electronjs.org) - Cross-platform apps
- [React](https://react.dev) - UI framework
- [TweetNaCl](https://tweetnacl.js.org) - Cryptography
- [TypeScript](https://typescriptlang.org) - Type safety

## Support

- **Documentation:** See `/docs` folder
- **Issues:** [GitHub Issues](https://github.com/frw-community/frw-free-web-modern/issues)
- **Discussions:** [GitHub Discussions](https://github.com/frw-community/frw-free-web-modern/discussions)

---

**Welcome to the Free Web**

Building a decentralized, censorship-resistant internet, one page at a time.
