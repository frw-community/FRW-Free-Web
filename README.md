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

### Protocol Implementation

- **FRW Protocol** - Native frw:// URL scheme with cryptographic verification
- **CLI Tool** - Command-line interface for publishing and management
- **Browser Application** - Electron-based browser for FRW protocol
- **IPFS Integration** - Distributed content storage and retrieval
- **Ed25519 Signatures** - Cryptographic content authentication
- **Naming System** - Human-readable name resolution via DHT
- **HTTP Gateway** - Bridge layer for standard browser compatibility
- **DNS Integration** - Custom domain mapping for traditional web access

### Architecture

- TypeScript codebase with full type safety
- Monorepo structure with Lerna
- Modular package design
- Comprehensive error handling
- Structured logging
- Test coverage

## Quick Start

### Docker Installation (Recommended)

```bash
# Clone repository
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern

# Start services
docker-compose up -d

# Initialize FRW
docker-compose exec frw-cli frw init

# Register a name
docker-compose exec frw-cli frw register myname

# Configure your site
docker-compose exec frw-cli frw configure /data/sites/my-site

# Publish
docker-compose exec frw-cli frw publish /data/sites/my-site

# Check your site's metrics
docker-compose exec frw-cli frw metrics myname

# Access via FRW protocol: frw://myname/
# Access via HTTP gateway: http://localhost:3000/frw/myname/
```

Complete guide: [Docker Deployment](docs/DOCKER_DEPLOYMENT.md)

### Native Installation

```bash
# Clone repository
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern

# Install dependencies
npm install

# Build packages
npm run build

# Install CLI globally
cd apps/cli
npm link

# Verify installation
frw --version
```

## Access Methods

### Primary: FRW Protocol

```bash
# Launch FRW browser
cd apps/browser
npm run electron:dev

# Navigate to published content
# Address bar: frw://myname/
```

### Access Your Site

**Primary (FRW Browser):**
```
frw://myname/
```

**Secondary (HTTP Gateway):**
```
http://localhost:3000/frw/myname/
```

**Tertiary (Custom Domain):**
```bash
# Configure domain mapping
frw domain add example.com myname

# Add DNS TXT record
# Access via: https://example.com
```

Reference: [Access Methods Documentation](docs/ACCESS_METHODS.md)

### Protect Your Name

**Check Usage Metrics:**
```bash
frw metrics myname
```

**Challenge Inactive Names:**
```bash
frw challenge create squattedname \
  --reason squatting \
  --bond 1000000
```

**Respond to Challenges:**
```bash
frw challenge respond <challenge-id> --counter-bond 1000000
```

Reference: [Challenge System User Guide](docs/USER_GUIDE_CHALLENGES.md)

## Documentation

Complete documentation available in [docs/](docs/) directory.

### Core Documentation
- [Protocol Specification](docs/SPECIFICATION.md) - FRW Protocol v1.0 technical specification
- [Architecture](docs/ARCHITECTURE.md) - System design and component interaction
- [Security Model](docs/SECURITY.md) - Cryptographic primitives and threat analysis
- [Access Methods](docs/ACCESS_METHODS.md) - Protocol comparison and usage guidelines
- [Name Registry Specification](docs/NAME_REGISTRY_SPEC.md) - Anti-squatting system technical spec

### Deployment Guides
- [Docker Deployment](docs/DOCKER_DEPLOYMENT.md) - Containerized deployment procedures
- [Installation Guide](docs/INSTALLATION_GUIDE.md) - Native installation instructions
- [Custom Folders](docs/CUSTOM_FOLDERS.md) - Flexible filesystem configuration
- [Production Roadmap](docs/PRODUCTION_ROADMAP.md) - Production deployment checklist

### Operational Guides
- [User Guide](docs/USER_GUIDE.md) - End-user operations
- [Challenge System Guide](docs/USER_GUIDE_CHALLENGES.md) - Name disputes and challenges
- [Domain Management](docs/DOMAIN_MANAGEMENT.md) - DNS bridge configuration
- [DNS Resolution](docs/DNS_RESOLUTION.md) - DNS TXT-based name resolution in FRW browser
- [Site Configuration](docs/SITE_CONFIGURATION.md) - Site structure and metadata
- [IPFS Setup](docs/IPFS_SETUP.md) - IPFS node configuration

### Development
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - API reference and extension development
- [Contributing](CONTRIBUTING.md) - Contribution procedures
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Codebase organization
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

## Development Status

### Implemented
- FRW protocol specification v1.0
- CLI tooling (init, register, publish, verify, metrics, challenges)
- Electron browser with frw:// protocol handler
- IPFS integration via Kubo
- Ed25519 cryptographic signing
- Name resolution system
- HTTP gateway bridge
- DNS domain mapping
- Docker deployment configuration
- Site configuration system
- Anti-squatting challenge system (Phase 1)
- IPFS metrics collection and scoring
- Automatic dispute resolution

### In Development
- Browser tab management
- Bookmark system
- History tracking
- Browser extension for standard browsers
- Bond management system (crypto integration)
- DHT publication for challenges
- Trust graph (Phase 2)
- Community voting (Phase 2)

### Planned
- Native installers for Windows/Mac/Linux
- Automatic update system
- Mobile client applications
- Distributed name registry with DHT
- Enhanced gateway features

Reference: [Production Roadmap](docs/PRODUCTION_ROADMAP.md)

## License

MIT License - see [LICENSE](LICENSE) for details

## Technology Stack

### Core
- TypeScript 5.3 - Type-safe implementation
- Node.js 20+ - Runtime environment
- IPFS (Kubo) - Distributed storage layer

### Cryptography
- TweetNaCl - Ed25519 signature implementation
- SHA-256 - Content hashing

### Browser
- Electron 28 - Cross-platform application framework
- React 18 - User interface components
- Vite - Build tooling

### CLI
- Commander - Command-line interface framework
- Inquirer - Interactive prompts

### Infrastructure
- Docker - Containerization
- Lerna - Monorepo management
- Jest - Testing framework

## Repository

GitHub: https://github.com/frw-community/frw-free-web-modern

Issues: Submit technical issues and bug reports  
Discussions: Protocol discussion and feature proposals

## License

MIT License. See [LICENSE](LICENSE) file for complete terms.
