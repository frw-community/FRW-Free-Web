# FRW - Free Resilient Web

<div align="center">

**A decentralized web protocol built on IPFS with human-readable names, proof-of-work registration, and DNS integration.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![IPFS](https://img.shields.io/badge/IPFS-Powered-blueviolet.svg)](https://ipfs.tech)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](CHANGELOG.md)
[![Quantum Safe](https://img.shields.io/badge/Quantum-Resistant-purple.svg)](docs/v2/README.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Download Distribution](DISTRIBUTION.md) • [Documentation](docs/) • [V2 Quantum-Resistant](docs/v2/) • [Community](https://github.com/frw-community/frw-free-web-modern/discussions) • [Roadmap](#roadmap)

</div>

---

## Table of Contents

- [What is FRW?](#what-is-frw)
- [Why FRW?](#why-frw)
- [V2 Quantum-Resistant Upgrade](#v2-quantum-resistant-upgrade)
- [Key Features](#key-features)
- [Use Cases](#use-cases)
- [Comparison with Alternatives](#comparison-with-alternatives)
- [Installation](#installation)
  - [Windows](#windows)
  - [Linux / macOS](#linux--macos)
- [Quick Start](#quick-start)
- [DNS Domain Linking](#dns-domain-linking)
- [Performance](#performance)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## What is FRW?

FRW is a decentralized web platform where content is stored on IPFS, names are registered via distributed consensus with proof-of-work anti-spam protection, and everything is cryptographically verified.

The system operates without central servers or gatekeepers. Content distribution is handled through IPFS, name resolution uses a multi-layer approach (bootstrap nodes + DHT + pubsub), and all operations are verified using quantum-resistant cryptography (V2) or Ed25519 signatures (V1).

### Key Metrics

- Zero central servers required
- 95 protected brand names
- <100ms name resolution (with bootstrap nodes)
- 2-5s resolution via DHT fallback (pure P2P)
- No registration fees (proof-of-work based)
- Distributed network architecture

### Design Goals

FRW addresses several limitations of traditional web infrastructure:

- **Decentralization** - No single point of failure or control
- **Censorship Resistance** - Content remains accessible via IPFS
- **Cost Efficiency** - No hosting fees or domain renewals
- **Performance** - Sub-second updates through IPFS pubsub
- **Resilience** - Content survives network failures
- **True Ownership** - Cryptographic key-based control

## Why FRW?

**Problem:** Traditional web relies on centralized DNS, hosting providers, and certificate authorities. Any of these can censor, take down, or block your content.

**Solution:** FRW removes all central points of failure:
- **Content** stored on IPFS (distributed globally across thousands of nodes)
- **Names** registered via DHT + optional bootstrap nodes (pure peer-to-peer)
- **Updates** propagated via IPFS pubsub (real-time, censorship-resistant)
- **Security** via quantum-resistant Dilithium3 (V2) or Ed25519 (V1) signatures
- **Future-Proof** post-quantum cryptography protects against quantum computing threats

## V2 Quantum-Resistant Upgrade

FRW V2 introduces post-quantum cryptography for long-term security against future quantum computing threats.

### ✅ V2 Status: FULLY OPERATIONAL (November 2025)

**Successful end-to-end test completed:** `frw://quantumsafedemo2025/` - Live on production bootstrap nodes with complete quantum-resistant signature verification.

### What's New in V2

- **Quantum-Resistant Signatures** - ML-DSA-65 (Dilithium3) provides NIST Level 3 post-quantum security
- **Hybrid Cryptography** - Combines Dilithium3 + Ed25519 for maximum compatibility
- **Password Protection** - AES-256-GCM encryption for private keys
- **Seamless Migration** - Upgrade V1 names to V2 while preserving content
- **Backward Compatible** - V1 and V2 operate side-by-side
- **Memory-Hard PoW** - Argon2id replaces SHA-256 for spam resistance
- **Extended PoW Validity** - 30-day validity window (vs 1-hour in development)
- **Distributed Validation** - Multiple Swiss bootstrap nodes verify quantum-safe signatures

### V2 Quick Start

```bash
# Create quantum-resistant identity
frw init-v2

# Register with V2 (quantum-safe)
# For instant registration, use 16+ character names (no PoW required)
frw register-v2 myquantumsafename2025

# Publish content with V2 signatures
frw publish ./mysite --name myquantumsafename2025

# Migrate existing V1 name to V2
frw migrate myoldname
```

**💡 Tip:** Names with 16+ characters register instantly (0 seconds PoW). Shorter names require proof-of-work:
- 11-15 chars: ~1 second
- 8-10 chars: ~10-30 seconds  
- 5-7 chars: ~2-60 minutes
- 3-4 chars: ~days/months (premium names)

**Learn more:** [V2 Documentation](docs/v2/README.md) • [Migration Guide](docs/v2/MIGRATION_GUIDE.md)

---

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
- **Quantum-resistant cryptography (V2)** - Dilithium3 (ML-DSA-65) + Ed25519 hybrid
- **Ed25519 signatures (V1)** for legacy compatibility
- **Argon2id proof-of-work (V2)** - Memory-hard spam prevention
- **Password-protected keys** - AES-256-GCM encryption
- **DNS domain linking** with cryptographic verification via TXT records
- **Multi-layer resolution**: HTTP bootstrap → IPFS DHT → Pubsub
- **Works without bootstrap nodes** - Pure P2P fallback via IPFS DHT
- **Real-time updates** via IPFS pubsub (sub-second propagation)
- **Content-addressed storage** ensures integrity and deduplication

## Use Cases

### Journalists and Activists
Content published on FRW remains accessible even if traditional domains are seized. The frw:// protocol provides an alternative access method that bypasses DNS-based censorship.

### Application Developers
Build decentralized applications without depending on centralized hosting providers. The platform provides infrastructure ownership and data control without vendor lock-in.

### Content Publishers
Publish websites without recurring hosting fees or domain renewals. Content is stored on IPFS and accessible through cryptographic identifiers.

### Organizations
Implement censorship-resistant infrastructure for business continuity. Content remains accessible through the distributed network even if traditional web infrastructure fails.

## Comparison with Alternatives

| Feature | FRW | Traditional Web | IPFS Only | Blockchain DNS |
|---------|-----|----------------|-----------|----------------|
| **Decentralized Hosting** | Yes | No | Yes | Yes |
| **Human-Readable Names** | Yes | Yes | No | Yes |
| **No Registration Fees** | Yes | No | N/A | No |
| **DNS Domain Linking** | Yes | N/A | No | No |
| **Works Without Blockchain** | Yes | N/A | Yes | No |
| **Sub-second Updates** | Yes | Yes | No | No |
| **Censorship Resistant** | Yes | No | Yes | Yes |
| **No Mining/Staking** | Yes | N/A | Yes | No |
| **Offline Access** | Yes | No | Yes | No |

## Browser Options Comparison

FRW offers two ways to browse decentralized content:

| Feature | Chrome Extension | Electron Browser |
|---------|------------------|------------------|
| **Platforms** | Chrome, Edge, Brave, Opera | Windows, Linux, macOS |
| **Direct `frw://` URLs** | No (Chrome limitation) | Yes (Native support) |
| **How to Browse** | Click icon or `frw`+`Tab` | Type `frw://name` directly |
| **Installation** | Load unpacked extension | Install app |
| **Easy to Use** | Very easy | Very easy |
| **Recommended For** | Most users, quick access | Power users, native feel |
| **Auto-updates** | Manual reload | Via app installer |

**Bottom line**: Chrome extension is easiest for most users. Use Electron browser if you want to type `frw://` URLs directly.

## Installation

### Windows

#### Pre-built Binaries (Recommended)

**FRW Chrome Extension** (Easiest - Recommended for most users!)
- Browse FRW sites in Chrome, Edge, Brave, Opera, and all Chromium browsers
- **Note**: Due to Chrome security restrictions, you cannot type `frw://` URLs directly in the address bar
- **Use instead**: Click the extension icon OR type `frw` + `Tab` in address bar
- No installation required - Just load the extension
- See: [Chrome Extension Guide](apps/chrome-extension/README.md)

**FRW Electron Browser** (For native `frw://` protocol support)
- [FRW Browser Setup 1.0.0.exe](apps/browser/release/FRW%20Browser%20Setup%201.0.0.exe) - Installer with Start Menu integration
- [FRW Browser 1.0.0.exe](apps/browser/release/FRW%20Browser%201.0.0.exe) - Portable executable

**FRW CLI** (For publishing content)
- [frw-cli-windows.zip](apps/cli/release/) - Portable command-line tools

Extract and test the CLI:
```batch
cd frw-cli-windows
frw.bat --help
```

#### Build from Source (Windows)

**Prerequisites:**
- **Node.js** >= 20.0.0 - [Download](https://nodejs.org)
- **IPFS Desktop** - [Download](https://docs.ipfs.tech/install/ipfs-desktop/)

**Installation:**
```powershell
# Clone repository
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern

# Install dependencies
npm install

# Build all packages
npm run build

# Build Windows packages
cd apps/cli
npm run package:win

cd ..\browser
npm run build
```

### Linux / macOS

#### Build from Source

**Prerequisites:**
- **Node.js** >= 20.0.0
- **IPFS** - [Install Guide](https://docs.ipfs.tech/install/)

**Installation:**
```bash
# Clone repository
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern

# Install dependencies
npm install

# Build all packages
npm run build

# Link CLI globally (makes 'frw' command available)
cd apps/cli
npm link

# Verify installation
frw --version
```

## Quick Start

### Getting Started

**Step 1: Start IPFS**

<details>
<summary><b>Windows (IPFS Desktop)</b></summary>

- Launch IPFS Desktop application
- Wait for "Ready" status in system tray
- Or via command line:
```powershell
ipfs daemon --enable-pubsub-experiment
```
</details>

<details>
<summary><b>Linux/macOS</b></summary>

```bash
# Start IPFS daemon with pubsub enabled
ipfs daemon --enable-pubsub-experiment
```
</details>

**Step 2: Initialize FRW**

```bash
# Works on all platforms
frw init
```

**Step 3: Register Your Name**

```bash
# Includes proof-of-work (may take 1-60 mins depending on name length)
frw register myname
```

**Step 4: Create a Simple Website**

<details>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
# Create site directory
mkdir mysite
cd mysite

# Create homepage
echo "<h1>Hello FRW!</h1><p>My first decentralized website!</p>" > index.html

cd ..
```
</details>

<details>
<summary><b>Linux/macOS (Bash)</b></summary>

```bash
# Create site directory
mkdir mysite
cd mysite

# Create homepage
echo "<h1>Hello FRW!</h1><p>My first decentralized website!</p>" > index.html

cd ..
```
</details>

**Step 5: Publish to the Network**

```bash
# Publish your site (works on all platforms)
frw publish ./mysite --name myname

# Done! Your site is now at frw://myname/
```

### Browsing FRW Sites

**🌐 Chrome Extension (Easiest - Works on All Platforms!)**

1. Load the extension in Chrome/Edge/Brave/Opera:
   ```bash
   cd apps/chrome-extension
   npm install
   npm run build
   # Then: chrome://extensions → Load unpacked → Select 'dist' folder
   ```

2. **How to browse** (Chrome security prevents direct `frw://` URLs):
   
   **Method A - Extension Popup (Recommended):**
   - Click the FRW icon in toolbar (or press `Alt+F`)
   - Type a name (e.g., `frw`, `alice`)
   - Press Enter
   
   **Method B - Omnibox:**
   - Type `frw` in address bar
   - Press `Tab` (you'll see "Search FRW Protocol")
   - Type the name (e.g., `frw`)
   - Press `Enter`

**⚠️ Important**: You **cannot** type `frw://name` directly in Chrome's address bar. This is a Chrome security restriction that prevents extensions from registering custom protocols. Use Method A or B above instead.

**💡 For native `frw://` support**, use the Electron browser below.

See full guide: [Chrome Extension README](apps/chrome-extension/README.md)

---

<details>
<summary><b>Alternative: FRW Electron Browser (Native Protocol Support)</b></summary>

**Windows:**
- Launch "FRW Browser" from Start Menu
- Navigate to `frw://myname/` directly in address bar

**Development Mode:**
```powershell
cd apps\browser
npm run dev
```
</details>

<details>
<summary><b>Linux/macOS</b></summary>

```bash
# Start FRW browser in development mode
cd apps/browser
npm run dev

# Navigate to any frw:// URL
# Example: frw://myname/
```
</details>

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

**V1 (Ed25519):**
- **@frw/protocol** - URL parsing and `frw://` protocol handling
- **@frw/crypto** - Ed25519 key management, signing, and verification
- **@frw/ipfs** - IPFS integration with DHT, pubsub, and content storage
- **@frw/name-registry** - Distributed name resolution with proof-of-work
- **@frw/common** - Shared types and utilities
- **@frw/storage** - Local caching and persistence layer

**V2 (Quantum-Resistant):**
- **@frw/crypto-pq** - Dilithium3 + Ed25519 hybrid cryptography
- **@frw/pow-v2** - Argon2id memory-hard proof of work
- **@frw/protocol-v2** - V2 record format and verification

### Applications

- **apps/chrome-extension** - Chrome/Edge/Brave extension for browsing `frw://` sites (Recommended!)
- **apps/browser** - Electron-based browser for native `frw://` protocol support
- **apps/cli** - Command-line interface for publishing and managing content
- **apps/bootstrap-node** - Optional HTTP index node for fast name resolution

### Name Registration & Proof-of-Work

FRW uses proof-of-work to prevent name squatting without requiring payments or central authority:

**V1 (SHA-256):**

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

**V2 (Argon2id - Memory-Hard):**

| Name Length | Difficulty | Memory | Est. Time | Purpose |
|------------|-----------|---------|-----------|----------|
| 1-2 chars | 16 zeros | 8192 MiB | ~60+ years | Reserved |
| 3 chars | 13 zeros | 4096 MiB | ~2 years | Ultra-premium |
| 4 chars | 11 zeros | 2048 MiB | ~2 months | Premium |
| 5 chars | 10 zeros | 1024 MiB | ~5 days | Rare |
| 6-7 chars | 8-9 zeros | 256-512 MiB | ~6-90 min | Short |
| 8-10 chars | 6-7 zeros | 64-128 MiB | ~6-22 sec | Standard |
| 11-15 chars | 5 zeros | 32 MiB | ~1 second | Recommended |
| 16+ chars | 0 zeros | 16 MiB | Instant | Free |

**✅ Tested:** `quantumsafedemo2025` (19 chars) registered in 0 seconds with V2 quantum-resistant signatures.

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

## Performance

### Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| **Name Resolution** (L1 cache) | < 1ms | Memory cache hit |
| **Name Resolution** (L2 cache) | < 10ms | IPFS local storage |
| **Name Resolution** (Bootstrap) | 50-100ms | HTTP API query |
| **Name Resolution** (DHT only) | 2-5s | Pure P2P fallback |
| **Content Publishing** | 5-15s | IPFS upload + signing |
| **Real-time Updates** (pubsub) | < 1s | Network propagation |
| **POW Registration** (8 chars) | ~17s | One-time per name |
| **DNS Verification** | 5-10 min | DNS propagation time |

**Notes:**
- Multi-layer caching provides sub-millisecond lookups for frequently accessed names
- DHT fallback ensures functionality without bootstrap nodes
- Proof-of-work is computed once per name registration
- Pubsub updates are significantly faster than traditional DNS TTL (typically 48 hours)

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
│   ├── chrome-extension/     # Chrome extension for browsing (Recommended!)
│   ├── browser/              # Electron browser for native protocol support
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

**V2 (Quantum-Resistant):**
- **Dilithium3 (ML-DSA-65)** - NIST-approved post-quantum signatures (128-bit security)
- **Hybrid Signatures** - Dilithium3 + Ed25519 for compatibility
- **SHA3-256 Hashing** - Quantum-resistant hash function
- **Argon2id PoW** - Memory-hard proof of work
- **AES-256-GCM** - Password protection for private keys

**V1 (Classic):**
- **Ed25519 Signatures** - All content signed with 256-bit keys
- **SHA-256 Hashing** - Content integrity verification
- **Proof-of-Work Verification** - Bootstrap nodes validate POW before accepting registrations
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

**[Complete Documentation Index](docs/README.md)**

### Quick Links

**Getting Started:**
- [Installation & Quick Start](#installation) (see above)
- [CLI Commands](apps/cli/README.md)
- [Chrome Extension](apps/chrome-extension/README.md)

**V2 Quantum-Resistant:**
- [V2 Overview](docs/v2/README.md)
- [Migration Guide](docs/v2/MIGRATION_GUIDE.md)

**Node Operators:**
- [Bootstrap Node Setup](apps/bootstrap-node/DEPLOY_SUCCESS.md)
- [Version Sync](apps/bootstrap-node/VERSION_SYNC.md)

**Security:**
- [Security Model](docs/SECURITY.md)
- [Cryptography Details](docs/v2/README.md#security-specifications)

## Community & Support

- **GitHub Issues** - [Report bugs](https://github.com/frw-community/frw-free-web-modern/issues)
- **GitHub Discussions** - [Ask questions, share ideas](https://github.com/frw-community/frw-free-web-modern/discussions)
- **Security Issues** - frw-community@proton.me (PGP key in repo)

## Roadmap

**Completed:**
- [x] Core protocol implementation
- [x] Proof-of-work name registration
- [x] Bootstrap node architecture
- [x] CLI publishing tool
- [x] Electron browser
- [x] Chrome extension for browsing
- [x] Multi-layer name resolution
- [x] DNS domain linking and verification
- [x] V2 quantum-resistant upgrade **[NEW - Nov 2025]**
- [x] Password-protected keys
- [x] V1 to V2 migration tool
- [x] V2 content publishing support **[COMPLETE]**
- [x] V2 bootstrap node validation **[TESTED & WORKING]**
- [x] Argon2id memory-hard PoW **[OPERATIONAL]**
- [x] 30-day PoW validity window **[DEPLOYED]**

**In Progress:**
- [ ] Chrome extension V2 quantum-safe badge display
- [ ] Mobile apps (iOS, Android)

**Planned:**
- [ ] Firefox extension
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

## Contributing

FRW is an open source project. Contributions are welcome:

- **Bug reports** - Submit issues for bugs or unexpected behavior
- **Feature requests** - Propose new features or improvements
- **Documentation** - Help improve guides and tutorials
- **Code contributions** - Submit pull requests for new features or fixes
- **Bootstrap nodes** - Run a bootstrap node in your region
- **Community support** - Help answer questions in GitHub Discussions

See [GitHub Discussions](https://github.com/frw-community/frw-free-web-modern/discussions) for community discussion.

## Project Status

- **Version:** 2.0.0 (Quantum-Resistant)
- **Released:** November 2025
- **V2 Status:** ✅ FULLY OPERATIONAL - End-to-end tested November 19, 2025
- **Codebase:** ~8,500 lines (core) + ~6,000 lines (documentation)
- **Tests:** 73/73 passing (V1: 40/40, V2: 33/33)
- **Bootstrap Nodes:** 4 active (Switzerland) - V2 validated
- **Protected Names:** 95+ brands
- **Platforms:** Windows, Linux, macOS
- **Security:** NIST Level 3 Post-Quantum (ML-DSA-65)
- **Live V2 Test:** frw://quantumsafedemo2025/ (production)

---

<div align="center">

**Built with ❤️ by the FRW Community**

*Censorship-resistant • Decentralized • Owned by users*

[![Star on GitHub](https://img.shields.io/github/stars/frw-community/frw-free-web-modern?style=social)](https://github.com/frw-community/frw-free-web-modern)

</div>
