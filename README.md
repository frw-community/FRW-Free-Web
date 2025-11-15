# FRW - Free Resilient Web

> A truly decentralized web protocol - censorship-resistant, ownerless, and unstoppable.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![IPFS](https://img.shields.io/badge/IPFS-Powered-blueviolet.svg)](https://ipfs.tech)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)

FRW is a fully decentralized web platform where content is stored on IPFS, names are registered via distributed consensus with proof-of-work anti-spam protection, and everything is cryptographically verified. No central servers, no gatekeepers, no censorship.

## Why FRW?

**Problem:** Traditional web relies on centralized DNS, hosting providers, and certificate authorities. Any of these can censor, take down, or block your content.

**Solution:** FRW removes all central points of failure:
- **Content** stored on IPFS (distributed globally across thousands of nodes)
- **Names** registered via DHT + optional bootstrap nodes (pure peer-to-peer)
- **Updates** propagated via IPFS pubsub (real-time, censorship-resistant)
- **Security** via Ed25519 signatures (cryptographically verified, not trust-based)

## Key Features

### For Users
- **Human-readable names** - `frw://myname/` instead of long hashes
- **Instant publishing** - Deploy sites in seconds with one command
- **True ownership** - Your keys, your content, forever
- **Censorship-resistant** - No one can take down your content
- **Works offline** - IPFS caching means content survives network failures

### For Developers
- **TypeScript** - Full type safety across the stack
- **Modular architecture** - Clean separation of concerns
- **IPFS integration** - Built on battle-tested Web3 infrastructure
- **Proof-of-work** - Prevents name squatting without fees
- **Distributed registry** - Multi-layer resolution with DHT fallback

### Technical Highlights
- **Ed25519 cryptographic signatures** for all content verification
- **Proof-of-work name registration** prevents spam and squatting
- **Multi-layer resolution**: HTTP bootstrap → IPFS DHT → Pubsub
- **Works without bootstrap nodes** - Pure P2P fallback via IPFS DHT
- **Real-time updates** via IPFS pubsub (sub-second propagation)
- **Content-addressed storage** ensures integrity and deduplication

## Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **IPFS** ([Download](https://docs.ipfs.tech/install/))

### Installation

```bash
# Clone repository
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern

# Install dependencies
npm install

# Build all packages
npm run build

# Link CLI globally
cd apps/cli
npm link
```

### 5-Minute Tutorial

```bash
# 1. Start IPFS daemon (required)
ipfs daemon --enable-pubsub-experiment

# 2. Initialize FRW
frw init

# 3. Register your name (includes proof-of-work, may take 1-60 mins)
frw register myname

# 4. Create a simple website
mkdir mysite
echo "<h1>Hello FRW!</h1>" > mysite/index.html

# 5. Publish to the network
frw publish ./mysite --name myname

# Done! Your site is now at frw://myname/
```

### Using the Browser

```bash
# Start FRW browser
cd apps/browser
npm run dev

# Navigate to any frw:// URL
frw://myname/
```

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Creators                          │
│  (Users publishing sites via CLI or Browser)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Local IPFS Node                            │
│  • Stores content locally                                   │
│  • Publishes to IPFS DHT (distributed hash table)           │
│  • Announces updates via IPFS pubsub                        │
│  • Connects to global IPFS network                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ↓                             ↓
┌───────────────────┐        ┌────────────────────┐
│ Bootstrap Nodes   │        │  IPFS DHT Network  │
│ (Optional Speed)  │        │  (Always Works)    │
│                   │        │                    │
│ • HTTP API        │        │ • Pure P2P         │
│ • < 100ms lookup  │        │ • 2-5s lookup      │
│ • 99.9% uptime    │        │ • 100% uptime      │
│ • Global index    │        │ • Distributed      │
└───────────────────┘        └────────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Content Consumers                         │
│  (Browsers resolving and viewing frw:// sites)             │
└─────────────────────────────────────────────────────────────┘
```

### Core Packages

- **@frw/protocol** - URL parsing and `frw://` protocol handling
- **@frw/crypto** - Ed25519 key management, signing, and verification
- **@frw/ipfs** - IPFS integration with DHT, pubsub, and content storage
- **@frw/name-registry** - Distributed name resolution with proof-of-work
- **@frw/common** - Shared types and utilities
- **@frw/storage** - Local caching and persistence layer

### Applications

- **apps/cli** - Command-line interface for publishing and managing content
- **apps/browser** - Electron-based browser for viewing `frw://` sites
- **apps/bootstrap-node** - Optional HTTP index node for fast name resolution

### Name Registration & Proof-of-Work

FRW uses proof-of-work to prevent name squatting without requiring payments or central authority:

| Name Length | Difficulty | Est. Time | Purpose |
|------------|-----------|-----------|----------|
| 1-2 chars | 15 zeros | ~36,500 years | Reserved for protocol |
| 3 chars | 12 zeros | ~8.9 years | Premium names |
| 4 chars | 10 zeros | ~13 days | Very rare names |
| 5 chars | 9 zeros | ~19 hours | Rare names |
| 6 chars | 8 zeros | ~72 minutes | Short names |
| 7 chars | 7 zeros | ~4.5 minutes | Common names |
| 8 chars | 6 zeros | ~17 seconds | Standard names |
| 9-10 chars | 5 zeros | ~1 second | Long names |
| 11-15 chars | 4 zeros | ~0.06 seconds | Very long names |
| 16+ chars | 0 zeros | Instant | No POW required |

**Why proof-of-work?**
- No registration fees (free)
- No central authority needed
- Computationally expensive to squat many names
- Fair: anyone with a computer can register
- Environmentally reasonable: only run once per name

**How it works:**
The CLI generates a hash with the required leading zeros by trying different nonces. Bootstrap nodes verify the proof before accepting registrations, preventing spam even if someone modifies the CLI.

### Content Publishing Flow

1. **Prepare Content**
   - HTML/CSS/JS files in a directory
   - CLI validates structure and assets

2. **Generate Proof-of-Work**
   - Only needed once when registering name
   - Subsequent publishes skip this step

3. **Upload to IPFS**
   - Content is added to local IPFS node
   - Returns Content Identifier (CID)
   - Automatically propagates to IPFS network

4. **Sign & Publish Record**
   - Create name record with CID
   - Sign with Ed25519 private key
   - Publish to IPFS DHT
   - Announce via IPFS pubsub

5. **Propagation**
   - Bootstrap nodes receive via pubsub (instant)
   - DHT stores record (30-60 seconds)
   - Other IPFS nodes replicate content (automatic)

### Name Resolution Flow

FRW uses a multi-layer resolution strategy for speed and resilience:

```
frw://myname/ 
    ↓
1. L1 Cache (memory) ────────────────→ Instant (if cached)
    ↓ (miss)
2. L2 Cache (IPFS local) ─────────────→ < 10ms (if recently accessed)
    ↓ (miss)
3. Bootstrap Nodes HTTP API ──────────→ 50-100ms (if nodes available)
    ↓ (all fail or timeout)
4. IPFS DHT Query ───────────────────→ 2-5s (pure P2P, always works)
    ↓ (miss)
5. IPFS Pubsub Listen ────────────────→ Wait for announcement
    ↓
Record Found → Verify Signature → Fetch Content from IPFS
```

**Key Point:** If all bootstrap nodes are offline, resolution falls back to IPFS DHT. The system always works as long as IPFS is running.

**Content Loading:**
1. Resolve name to CID
2. Verify cryptographic signature
3. Fetch content from IPFS (via local gateway)
4. Render in sandbox with `frw://` protocol handler
5. All assets load via content-addressing (integrity guaranteed)

## Docker

```bash
# Run full stack
docker-compose up -d

# Use CLI
docker-compose exec frw-cli frw init
```

## Development

```bash
# Run tests
npm test

# Build all packages
npm run build

# Start dev browser
npm run dev:browser

# Start bootstrap node
npm run bootstrap
```

## Configuration

### User Configuration

User settings stored in `~/.frw/config.json`:

```json
{
  "defaultKeyPath": "~/.frw/keys/default.key",
  "ipfsHost": "localhost",
  "ipfsPort": 5001,
  "registeredNames": {
    "myname": "<your-public-key>"
  }
}
```

### Bootstrap Nodes

FRW uses multiple community-run bootstrap nodes for redundancy:

```typescript
// packages/ipfs/src/distributed-registry.ts
private readonly bootstrapNodes = [
  'http://83.228.214.189:3100',  // Switzerland #1
  'http://83.228.213.45:3100',   // Switzerland #2
  'http://83.228.213.240:3100',  // Switzerland #3
  'http://83.228.214.72:3100',   // Switzerland #4
  'http://localhost:3100'        // Local development
];
```

**Want to run your own bootstrap node?** See [apps/bootstrap-node/DEPLOY_SUCCESS.md](apps/bootstrap-node/DEPLOY_SUCCESS.md)

### IPFS Configuration

**Required:** Enable IPFS pubsub for real-time updates:

```bash
# Enable pubsub
ipfs config --json Experimental.Pubsub true

# Start daemon with pubsub
ipfs daemon --enable-pubsub-experiment
```

## Testing

```bash
# Run all tests
npm test

# Test specific package
cd packages/crypto
npm test

# E2E tests
npm run test:e2e
```

## Project Structure

```
frw-free-web-modern/
├── apps/
│   ├── browser/              # Electron browser for viewing frw:// sites
│   ├── cli/                  # Command-line tool for publishing
│   └── bootstrap-node/       # Optional HTTP index node
│       ├── DEPLOY_SUCCESS.md # Complete deployment guide
│       └── DEPLOY_QUICK.md   # Quick start deployment
├── packages/
│   ├── common/               # Shared TypeScript types
│   ├── crypto/               # Ed25519 key management
│   ├── protocol/             # frw:// protocol handler
│   ├── ipfs/                 # IPFS integration + distributed registry
│   ├── name-registry/        # POW generation and verification
│   └── storage/              # Local caching layer
├── docs/
│   ├── security/             # Security documentation
│   └── DEVELOPMENT_WORKFLOW.md  # Building new features
└── tests/
    └── e2e/                  # End-to-end integration tests
```

## Security

### Cryptographic Guarantees

- **Ed25519 Signatures** - All content signed with 256-bit keys
- **Proof-of-Work Verification** - Bootstrap nodes validate POW before accepting registrations
- **Content Addressing** - SHA-256 hashes ensure content integrity
- **Signature Verification** - Every resolution verifies the signature matches the registered public key
- **No Trust Required** - Cryptographic proof, not certificate authorities

### Attack Resistance

| Attack Vector | Mitigation |
|--------------|------------|
| Name squatting bots | Proof-of-work makes bulk registration computationally expensive |
| Fake content injection | Content-addressing and signature verification |
| Bootstrap node compromise | DHT fallback, signatures verified client-side |
| IPFS node poisoning | Content-addressed storage (wrong content = different CID) |
| DNS hijacking | No DNS involved, pure cryptographic resolution |
| MITM attacks | All content signed, tampered content fails verification |

### Sandbox Security

- Content rendered in isolated context
- No access to local filesystem
- No unrestricted network access
- CORS policies enforced
- CSP headers applied

### Threat Model

See [docs/security/POW_VERIFICATION.md](docs/security/POW_VERIFICATION.md) for detailed threat analysis and security guarantees.

## Contributing

We welcome contributions! Here's how to help:

### Ways to Contribute

1. **Run a Bootstrap Node** - Help decentralize the network ([Guide](apps/bootstrap-node/DEPLOY_SUCCESS.md))
2. **Report Bugs** - Open issues on GitHub
3. **Submit PRs** - Code improvements, bug fixes, documentation
4. **Test & Feedback** - Try publishing sites and report issues
5. **Spread the Word** - Tell others about decentralized web

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/frw-free-web-modern.git
cd frw-free-web-modern

# Install dependencies
npm install

# Run tests
npm test

# Build all packages
npm run build

# Start development
cd apps/browser
npm run dev
```

See [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) for detailed dev guide.

## Documentation

- **[CLI Usage](apps/cli/README.md)** - Publishing and managing content
- **[Bootstrap Node Deployment](apps/bootstrap-node/DEPLOY_SUCCESS.md)** - Running a network node
- **[Security Overview](docs/security/POW_VERIFICATION.md)** - Threat model and guarantees
- **[Development Workflow](docs/DEVELOPMENT_WORKFLOW.md)** - Building new features

## Community & Support

- **GitHub Issues** - [Report bugs](https://github.com/frw-community/frw-free-web-modern/issues)
- **GitHub Discussions** - [Ask questions, share ideas](https://github.com/frw-community/frw-free-web-modern/discussions)
- **Security Issues** - frw-community@proton.me (PGP key in repo)

## Roadmap

- [x] Core protocol implementation
- [x] Proof-of-work name registration
- [x] Bootstrap node architecture
- [x] CLI publishing tool
- [x] Electron browser
- [x] Multi-layer name resolution
- [ ] Browser extensions (Chrome, Firefox)
- [ ] Mobile apps (iOS, Android)
- [ ] Content moderation tools
- [ ] DHT-only mode (no bootstrap nodes)
- [ ] IPNS integration for mutable content
- [ ] WebRTC for direct peer connections

## License

MIT License - see [LICENSE](LICENSE) file

## Citation

If you use FRW in academic work, please cite:

```bibtex
@software{frw2025,
  title = {FRW: Free Resilient Web},
  author = {FRW Community},
  year = {2025},
  url = {https://github.com/frw-community/frw-free-web-modern}
}
```

---

**Built with ❤️ by the FRW Community**

*Censorship-resistant • Decentralized • Owned by users*
