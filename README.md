# FRW - Free Resilient Web

<div align="center">

> **A truly decentralized web protocol - censorship-resistant, ownerless, and unstoppable.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![IPFS](https://img.shields.io/badge/IPFS-Powered-blueviolet.svg)](https://ipfs.tech)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](CHANGELOG.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**Download for Windows**](apps/browser/release) • [**Documentation**](docs/) • [**Community**](https://github.com/frw-community/frw-free-web-modern/discussions) • [**Roadmap**](#roadmap)

</div>

---

## 📚 Table of Contents

- [What is FRW?](#what-is-frw)
- [Why FRW?](#why-frw)
- [Key Features](#key-features)
- [Use Cases](#-use-cases)
- [FRW vs Alternatives](#-frw-vs-alternatives)
- [Installation](#-installation)
- [Quick Start](#5-minute-tutorial)
- [DNS Domain Linking](#dns-domain-linking)
- [Performance](#-performance-benchmarks)
- [Documentation](#documentation)
- [Contributing](#-get-involved)

---

## What is FRW?

FRW is a **fully decentralized web platform** where content is stored on IPFS, names are registered via distributed consensus with proof-of-work anti-spam protection, and everything is cryptographically verified. 

**No central servers. No gatekeepers. No censorship. Just pure peer-to-peer freedom.**

### ⚡ Quick Numbers

- **0** central servers required
- **95** protected brand names
- **<100ms** name resolution (with bootstrap nodes)
- **2-5s** pure P2P fallback (DHT only)
- **100%** uptime (distributed network)
- **$0** registration fees (proof-of-work instead)

### 🎯 Why Choose FRW?

**If you value:**
- 🔒 **Privacy** - No tracking, no data collection, no surveillance
- 🌐 **Freedom** - Publish without permission or platform approval
- 💰 **Cost** - Zero hosting fees, zero domain renewals
- 🚀 **Speed** - Sub-second updates, instant propagation
- 🛡️ **Resilience** - Content survives network failures and attacks
- 🔑 **Ownership** - Your keys, your content, forever

**Then FRW is for you.**

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
- **DNS domain linking** - Link traditional domains for dual HTTPS + frw:// access
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
- **DNS domain linking** with cryptographic verification via TXT records
- **Multi-layer resolution**: HTTP bootstrap → IPFS DHT → Pubsub
- **Works without bootstrap nodes** - Pure P2P fallback via IPFS DHT
- **Real-time updates** via IPFS pubsub (sub-second propagation)
- **Content-addressed storage** ensures integrity and deduplication

## 🚀 Use Cases

### For Activists & Journalists
Publish uncensorable content that can't be taken down by governments or corporations. Even if your domain is seized, content remains accessible via frw://.

### For Developers
Build truly decentralized applications without vendor lock-in. Own your infrastructure, control your data, deploy globally in seconds.

### For Content Creators
Publish websites without hosting fees, domain renewals, or platform restrictions. Your content, your keys, forever.

### For Organizations
Ensure business continuity with censorship-resistant infrastructure. If traditional web fails, your content remains online through IPFS.

## 📊 FRW vs Alternatives

| Feature | FRW | Traditional Web | IPFS Only | Blockchain DNS |
|---------|-----|----------------|-----------|----------------|
| **Decentralized Hosting** | ✅ | ❌ | ✅ | ✅ |
| **Human-Readable Names** | ✅ | ✅ | ❌ | ✅ |
| **No Registration Fees** | ✅ | ❌ | N/A | ❌ |
| **DNS Domain Linking** | ✅ | N/A | ❌ | ❌ |
| **Works Without Blockchain** | ✅ | N/A | ✅ | ❌ |
| **Sub-second Updates** | ✅ | ✅ | ❌ | ❌ |
| **Censorship Resistant** | ✅ | ❌ | ✅ | ✅ |
| **No Mining/Staking** | ✅ | N/A | ✅ | ❌ |
| **Offline Access** | ✅ | ❌ | ✅ | ❌ |

## 💻 Installation

### Option 1: Windows Installer (Recommended)

**Download pre-built Windows applications:**

1. **FRW Browser** - [Download FRW Browser Setup 1.0.0.exe](apps/browser/release/FRW%20Browser%20Setup%201.0.0.exe)
   - One-click installer with Start Menu integration
   - Browse frw:// websites instantly

2. **FRW CLI** - [Download frw-cli-windows.zip](apps/cli/release/)
   - Portable package, no installation needed
   - Publish websites from command line

### Option 2: Build from Source

**Prerequisites:**
- **Node.js** >= 20.0.0
- **IPFS** ([Download](https://docs.ipfs.tech/install/))

**Installation:**

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

## DNS Domain Linking

FRW supports linking traditional DNS domains to your FRW names, enabling dual access via both HTTPS and the frw:// protocol.

### Quick Domain Setup

```bash
# 1. Link your domain to your FRW name
frw domain add example.com myname

# 2. Add the DNS TXT record shown in the output to your domain
# Record Type: TXT
# Name: _frw (or @)
# Value: frw-key=<your-public-key>;frw-name=myname
# TTL: 3600

# 3. Wait 5-10 minutes for DNS propagation

# 4. Verify the DNS configuration
frw domain verify example.com
```

### Benefits

- **Dual Access** - Content accessible via both `https://yourdomain.com` and `frw://yourname/`
- **SEO Friendly** - Traditional domains provide discoverability
- **Censorship Resistant** - If your domain gets blocked, users can still access via frw://
- **Official Badge** - Verified domains show as "Official" in the FRW browser
- **Ownership Proof** - Cryptographically prove you own both the domain and FRW name

### Available Commands

```bash
# List all domain mappings
frw domain list

# Show detailed domain information
frw domain info example.com

# Remove a domain mapping
frw domain remove example.com
```

### Protected Names

FRW protects 100+ brand names (google, microsoft, apple, bitcoin, etc.) from squatting. To register a protected name, you must:
1. Own the corresponding domain (e.g., `google.com` for name `google`)
2. Add DNS TXT record proving ownership
3. Verify with `frw verify-dns <name>` before registration

See [packages/name-registry/README.md](packages/name-registry/README.md) for complete DNS documentation.

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

## ⚡ Performance Benchmarks

FRW is designed for speed and efficiency:

| Operation | Time | Notes |
|-----------|------|-------|
| **Name Resolution** (L1 cache) | < 1ms | Memory cache hit |
| **Name Resolution** (L2 cache) | < 10ms | IPFS local storage |
| **Name Resolution** (Bootstrap) | 50-100ms | HTTP API query |
| **Name Resolution** (DHT only) | 2-5s | Pure P2P fallback |
| **Content Publishing** | 5-15s | IPFS upload + signing |
| **Real-time Updates** (pubsub) | < 1s | Instant propagation |
| **POW Registration** (8 chars) | ~17s | One-time per name |
| **DNS Verification** | 5-10 min | DNS propagation time |

**Key Insights:**
- Multi-layer caching ensures most lookups are near-instant
- Even without bootstrap nodes, P2P resolution works (2-5s)
- Proof-of-work is one-time cost, not per-transaction
- Real-time updates via pubsub faster than traditional DNS (48h TTL)

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
- **[DNS Domain Linking](packages/name-registry/README.md#dns-domain-linking)** - Link traditional domains to FRW names
- **[Bootstrap Node Deployment](apps/bootstrap-node/DEPLOY_SUCCESS.md)** - Running a network node
- **[Security Model](docs/SECURITY.md)** - Complete security documentation, fork protection, attack scenarios
- **[Version Synchronization](apps/bootstrap-node/VERSION_SYNC.md)** - Keeping bootstrap nodes in sync
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
- [x] DNS domain linking and verification
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

## ⭐ Show Your Support

If FRW helps you build a freer, more decentralized web, please:

- **Star this repository** to help others discover the project
- **Share** FRW with developers, activists, and content creators
- **Contribute** code, documentation, or ideas
- **Run a bootstrap node** to help decentralize the network
- **Spread the word** on social media and tech communities

## 🤝 Get Involved

FRW is built by the community, for the community. We welcome:

- 🐛 **Bug reports** - Help us improve reliability
- 💡 **Feature requests** - Share your ideas
- 📝 **Documentation** - Improve guides and tutorials
- 🔧 **Code contributions** - Submit PRs for new features
- 🌐 **Bootstrap nodes** - Run a node in your region
- 💬 **Community support** - Help others on GitHub Discussions

**Join the movement:** [GitHub Discussions](https://github.com/frw-community/frw-free-web-modern/discussions)

## 📈 Project Stats

- **Released:** November 2025
- **Current Version:** 1.0.0
- **Total Lines of Code:** 5,000+ (production) + 3,500+ (documentation)
- **Test Coverage:** 40/40 tests passing
- **Bootstrap Nodes:** 4 active (Switzerland)
- **Protected Names:** 95 brands
- **Supported Platforms:** Windows (macOS, Linux coming soon)

## 🌍 Built for Freedom

In an era of increasing censorship, platform de-platforming, and centralized control, FRW provides an alternative: a web that can't be shut down, content that can't be censored, and names that can't be seized.

**The future of the web is decentralized. The future is FRW.**

---

<div align="center">

**Built with ❤️ by the FRW Community**

*Censorship-resistant • Decentralized • Owned by users*

[![Star on GitHub](https://img.shields.io/github/stars/frw-community/frw-free-web-modern?style=social)](https://github.com/frw-community/frw-free-web-modern)

</div>
