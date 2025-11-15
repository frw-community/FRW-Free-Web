# FRW - Free Resilient Web

A decentralized web protocol using IPFS for content distribution and Ed25519 signatures for authentication. Implements a distributed name registry with proof-of-work anti-squatting.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![IPFS](https://img.shields.io/badge/IPFS-Powered-blueviolet.svg)](https://ipfs.tech)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)

## Features

- Content-addressed storage via IPFS
- Cryptographic signatures using Ed25519
- Proof-of-work name registration system
- Distributed bootstrap node architecture
- Custom `frw://` protocol handler
- Electron-based browser

## Installation

```bash
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern
npm install
npm run build

# Link CLI globally
cd apps/cli
npm link
```

## Usage

```bash
# Generate Ed25519 keypair
frw keygen

# Register a name (requires proof-of-work)
frw register myname

# Publish content to IPFS
frw publish ./my-site --name myname

# Start browser
npm run browser
```

## Architecture

### Core Components

- **@frw/protocol** - URL parsing and validation
- **@frw/crypto** - Ed25519 key management and signing
- **@frw/ipfs** - IPFS node integration
- **@frw/name-registry** - Distributed name resolution
- **@frw/sandbox** - Secure content execution
- **@frw/storage** - Cache and persistence layer

### Name Registration

Names are registered using proof-of-work to prevent squatting:
- 3-char names: 12 leading zeros (~8.9 years) - effectively reserved
- 4-char names: 10 leading zeros (~13 days)
- 5-char names: 9 leading zeros (~19 hours)
- 6-char names: 8 leading zeros (~72 minutes)
- 7-char names: 7 leading zeros (~4.5 minutes)
- 8-char names: 6 leading zeros (~17 seconds)
- 9-10 char names: 5 leading zeros (~1 second)
- 11-15 char names: 4 leading zeros (~0.06 seconds)
- 16+ char names: No POW required

### Content Publishing

1. Content is hashed and uploaded to IPFS
2. Publisher signs the CID with their Ed25519 private key
3. Name-to-CID mapping is published to distributed registry
4. Bootstrap nodes propagate updates via pubsub

### Resolution

1. Browser parses `frw://name/path` URL
2. Query bootstrap nodes for name-to-CID mapping
3. Fetch content from IPFS gateway using CID
4. Verify signature matches registered public key
5. Browser loads content via iframe from IPFS gateway
6. Assets (images, CSS, JS) load via relative URLs through `frw://` protocol

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

Bootstrap nodes are configured in `packages/ipfs/src/distributed-registry.ts`:

```typescript
private readonly bootstrapNodes = [
  'http://83.228.214.189:3100',
  'http://83.228.213.45:3100',
  'http://83.228.213.240:3100',
  'http://83.228.214.72:3100',
  'http://localhost:3100'  // Local development
];
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
│   ├── browser/          # Electron browser app
│   ├── cli/              # Command-line tool
│   └── bootstrap-node/   # Registry bootstrap server
├── packages/
│   ├── common/           # Shared types and utilities
│   ├── crypto/           # Ed25519 implementation
│   ├── protocol/         # Protocol handling
│   ├── ipfs/             # IPFS integration
│   ├── name-registry/    # Name resolution
│   ├── sandbox/          # Execution sandbox
│   └── storage/          # Persistence layer
└── tests/
    └── e2e/              # End-to-end tests
```

## Security

- All content is verified using Ed25519 signatures
- JavaScript execution in VM2 sandbox
- No filesystem or network access for untrusted code
- Content addressed by SHA-256 hash

## License

MIT License - see [LICENSE](LICENSE) file

## Links

Repository: https://github.com/frw-community/frw-free-web-modern  
Security: frw-community@proton.me
