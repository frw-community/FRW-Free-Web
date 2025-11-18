# FRW Documentation

Complete documentation for the Free Resilient Web protocol.

## Getting Started

- **[Main README](../README.md)** - Overview, installation, quick start
- **[CHANGELOG](../CHANGELOG.md)** - Version history and release notes

## Core Documentation

### For Users

- **[V2 Quantum-Resistant Guide](v2/README.md)** - Using post-quantum cryptography
- **[V2 Migration Guide](v2/MIGRATION_GUIDE.md)** - Upgrading from V1 to V2

### For Developers

- **[Security Model](SECURITY.md)** - Cryptography, threat model, security guarantees

### For Node Operators

- **[Bootstrap Node Deployment](../apps/bootstrap-node/)** - Running a network node
  - [DEPLOY_SUCCESS.md](../apps/bootstrap-node/DEPLOY_SUCCESS.md)
  - [VERSION_SYNC.md](../apps/bootstrap-node/VERSION_SYNC.md)

## Application Documentation

### CLI Tool
- **[CLI Documentation](../apps/cli/README.md)** - Command-line interface guide
- Commands: `init`, `register`, `publish`, `domain`, `keys`
- V2 Commands: `init-v2`, `register-v2`, `migrate`

### Browser
- **[Electron Browser](../apps/browser/README.md)** - Desktop browser application
- **[Chrome Extension](../apps/chrome-extension/README.md)** - Extension for Chrome/Edge/Brave

## Package Documentation

### V1 Packages
- **[@frw/common](../packages/common/)** - Shared types and utilities
- **[@frw/crypto](../packages/crypto/)** - Ed25519 cryptography
- **[@frw/protocol](../packages/protocol/)** - Protocol implementation
- **[@frw/ipfs](../packages/ipfs/)** - IPFS integration
- **[@frw/name-registry](../packages/name-registry/)** - Name resolution and PoW

### V2 Packages (Quantum-Resistant)
- **[@frw/crypto-pq](../packages/crypto-pq/)** - Post-quantum cryptography (Dilithium3)
- **[@frw/pow-v2](../packages/pow-v2/)** - Argon2id proof of work
- **[@frw/protocol-v2](../packages/protocol-v2/)** - V2 protocol implementation

## Technical Specifications

### Protocol
- **frw://** URL scheme
- Ed25519 signatures (V1) or Dilithium3 signatures (V2)
- IPFS content addressing
- Multi-layer name resolution

### Cryptography
- **V1**: Ed25519 (256-bit), SHA-256
- **V2**: Dilithium3 (NIST Level 3), Ed25519 (legacy), SHA3-256
- **PoW V1**: SHA-256 based
- **PoW V2**: Argon2id memory-hard

### Network
- IPFS for content distribution
- Bootstrap nodes for fast resolution
- DHT for decentralized fallback
- Pubsub for real-time updates

## Community

- **[GitHub Issues](https://github.com/frw-community/frw-free-web-modern/issues)** - Bug reports
- **[GitHub Discussions](https://github.com/frw-community/frw-free-web-modern/discussions)** - Community support
- **Security**: frw-community@proton.me

## License

MIT License - See [LICENSE](../LICENSE)
