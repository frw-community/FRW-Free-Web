# FRW V2: Quantum-Resistant Protocol

Post-quantum cryptography upgrade for long-term security.

## Overview

FRW V2 adds quantum-resistant signatures using ML-DSA-65 (Dilithium3) alongside Ed25519 for backward compatibility. This provides protection against future quantum computing threats while maintaining interoperability with V1.

**Status**: Production Ready  
**Security**: NIST Level 3 Post-Quantum

## Key Features

### Quantum-Resistant Cryptography
- **Primary**: ML-DSA-65 (Dilithium3) - NIST-approved post-quantum signature scheme
- **Legacy**: Ed25519 for backward compatibility
- **Hashing**: SHA3-256 for quantum resistance
- **PoW**: Argon2id memory-hard proof of work

### Password Protection
- **Encryption**: AES-256-GCM authenticated encryption
- **Key Derivation**: Scrypt (N=2^16, r=8, p=1)
- **Security**: Industry-standard key protection

### Migration Support
- Seamless V1 to V2 upgrade path
- Content and IPNS preservation
- Dual V1/V2 operation during transition
- Zero downtime migration

---

## Architecture

### Cryptographic Stack

```
┌─────────────────────────────────────┐
│     Hybrid Signature Scheme         │
├─────────────────────────────────────┤
│  ML-DSA-65 (Dilithium3)             │
│  + Ed25519 (Legacy)                 │
├─────────────────────────────────────┤
│  SHA3-256 Hashing                   │
├─────────────────────────────────────┤
│  Argon2id Proof of Work             │
├─────────────────────────────────────┤
│  AES-256-GCM Key Encryption         │
└─────────────────────────────────────┘
```

### Package Structure

```
packages/
├── crypto-pq/       # Post-quantum cryptography
├── pow-v2/          # Argon2id proof of work
└── protocol-v2/     # V2 protocol implementation

apps/
├── cli/             # CLI with V2 commands
└── bootstrap-node/  # V2-enabled bootstrap node
```

---

## Installation

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 8.0.0
```

### Install CLI

```bash
npm install -g frw-cli
```

### Build from Source

```bash
# Clone repository
git clone https://github.com/frw-community/FRW-Free-Web.git
cd FRW-Free-Web

# Build V2 packages
cd packages/crypto-pq && npm install && npm run build
cd ../pow-v2 && npm install && npm run build
cd ../protocol-v2 && npm install && npm run build

# Build CLI
cd ../../apps/cli && npm install && npm run build

# Install globally
npm install -g .
```

---

## Quick Start

### Create Quantum-Resistant Identity

```bash
frw init-v2
```

You'll be prompted to:
- Choose a key name (default: `default-v2`)
- Set a password (recommended)

Output:
```
Quantum-resistant keypair generated
V2 keypair saved (encrypted)

Your V2 DID: did:frw:v2:abc123...
Key file: ~/.frw/keys/default-v2.json
Security: 128-bit Post-Quantum
```

### Register a Name

```bash
frw register-v2 myname
```

For instant registration, use names 16+ characters long:
```bash
frw register-v2 my-quantum-secure-name
```

### Migrate from V1

If you have existing V1 names:

```bash
frw migrate myoldname
```

This preserves your content and creates a V2 record while keeping V1 active.

---

## CLI Commands

### V2 Identity Management

#### `frw init-v2`
Create a new quantum-resistant identity.

**Options:**
- `-f, --force` - Overwrite existing V2 keypair

**Example:**
```bash
frw init-v2
frw init-v2 --force
```

---

### V2 Name Registration

#### `frw register-v2 <name>`
Register a name with quantum-resistant signatures.

**Options:**
- `-k, --key <path>` - Path to V2 private key

**Example:**
```bash
frw register-v2 myname
frw register-v2 myname --key /path/to/v2-key.json
```

**Proof of Work Time Estimates:**
- 16+ characters: Instant (< 1 second)
- 11-15 characters: 1-5 seconds
- 8-10 characters: 5-10 minutes
- 3-7 characters: Hours to days

---

### V1 to V2 Migration

#### `frw migrate <name>`
Upgrade a V1 name to quantum-resistant V2.

**Options:**
- `--v1-key <path>` - Path to V1 private key
- `--v2-key <path>` - Path to V2 private key
- `-f, --force` - Force re-migration

**Example:**
```bash
frw migrate myoldname
frw migrate myoldname --v1-key ~/.frw/keys/default.json
```

**Features:**
- Preserves V1 content CID and IPNS
- Creates V2 record with same content
- Both V1 and V2 records remain active
- Zero downtime

---

## API Reference

### V2 Record Structure

```typescript
interface DistributedNameRecordV2 {
  version: 2;
  name: string;
  publicKey_ed25519: Uint8Array;      // 32 bytes
  publicKey_dilithium3: Uint8Array;   // 1952 bytes
  did: string;                         // did:frw:v2:...
  contentCID: string;
  ipnsKey: string;
  recordVersion: number;
  registered: number;
  expires: number;
  signature_ed25519: Uint8Array;      // 64 bytes
  signature_dilithium3: Uint8Array;   // 3309 bytes
  hash_sha256: Uint8Array;            // 32 bytes (legacy)
  hash_sha3: Uint8Array;              // 32 bytes
  proof_v2: ProofOfWorkV2;
  previousHash_sha3: Uint8Array | null;
  providers?: string[];
  dnslink?: string;
}
```

### Proof of Work V2

```typescript
interface ProofOfWorkV2 {
  nonce: bigint;
  hash: Uint8Array;          // SHA3-256
  timestamp: number;
  publicKey_pq: Uint8Array;  // Dilithium3 public key
  difficulty: {
    leading_zeros: number;   // 0-6
    memory_mib: number;      // 16-128
    iterations: number;      // 2-4
  };
}
```

---

## Bootstrap Node Setup

### Prerequisites

```bash
Node.js >= 18.0.0
IPFS daemon running
```

### Installation

```bash
cd apps/bootstrap-node
npm install
npm run build
```

### Configuration

Create `.env` file:

```bash
PORT=3100
IPFS_API=/ip4/127.0.0.1/tcp/5001
```

### Run

```bash
# Development
npm run dev

# Production
npm start

# With PM2
pm2 start dist/index.js --name frw-bootstrap
```

### V2 Features

The bootstrap node automatically:
- Maintains separate V1 and V2 indices
- Verifies V2 records before indexing
- Serves both V1 and V2 via unified API
- Subscribes to dual pubsub channels

### API Endpoints

**GET /health**
```json
{
  "status": "ok",
  "uptime": 86400,
  "v1IndexSize": 100,
  "v2IndexSize": 25,
  "pqSecureRecords": 25
}
```

**GET /api/resolve/:name**
```json
{
  "version": 2,
  "name": "example",
  "did": "did:frw:v2:...",
  "publicKey_dilithium3": "...",
  "pqSecure": true,
  "contentCID": "Qm...",
  ...
}
```

**POST /api/submit/v2**
Submit a V2 record for indexing.

---

## Security Specifications

### Post-Quantum Security

**NIST Security Level**: 3 (equivalent to AES-192)

**Dilithium3 (ML-DSA-65)**:
- Public key: 1952 bytes
- Private key: 4032 bytes
- Signature: 3309 bytes
- Security: Resistant to Grover's algorithm and Shor's algorithm

**Key Sizes Comparison**:
```
V1 (Ed25519):
  Public:  32 bytes
  Private: 64 bytes
  Sig:     64 bytes

V2 (Dilithium3):
  Public:  1952 bytes
  Private: 4032 bytes
  Sig:     3309 bytes
```

### Password Protection

**Algorithm**: AES-256-GCM  
**Key Derivation**: Scrypt  
**Parameters**:
- N: 2^16 (65536 iterations)
- r: 8 (block size)
- p: 1 (parallelization)
- dkLen: 32 (output length)

**Storage Format**:
```json
{
  "privateKey_ed25519": {
    "encrypted": "base64...",
    "salt": "base64...",
    "iv": "base64..."
  },
  "privateKey_dilithium3": {
    "encrypted": "base64...",
    "salt": "base64...",
    "iv": "base64..."
  }
}
```

### Proof of Work

**Algorithm**: Argon2id  
**Purpose**: Rate limiting and spam prevention

**Parameters by Name Length**:
```
16+ chars:  0 zeros, 16 MiB,  2 iterations (instant)
11-15:      1 zero,  16 MiB,  2 iterations (~1s)
8-10:       2 zeros, 32 MiB,  2 iterations (~5min)
6-7:        3 zeros, 64 MiB,  3 iterations (~1hr)
4-5:        4 zeros, 96 MiB,  3 iterations (~6hr)
3:          5 zeros, 128 MiB, 4 iterations (~24hr)
```

---

## Testing

### Run All V2 Tests

```bash
# Crypto tests
cd packages/crypto-pq
npm test

# PoW tests
cd ../pow-v2
npm test

# Protocol tests
cd ../protocol-v2
npm test
```

### Test Coverage

```
@frw/crypto-pq:    12/12 tests (100% coverage)
@frw/pow-v2:       16/16 tests (100% coverage)
@frw/protocol-v2:   5/5 tests (100% coverage)
Total:             33/33 tests passing
```

### Integration Testing

```bash
# Create test identity
frw init-v2

# Register test name
frw register-v2 test-quantum-name-$(date +%s)

# Verify via API
curl http://localhost:3100/api/resolve/test-quantum-name-*
```

---

## Performance

### Benchmarks

**Key Generation**:
- V2 keypair: 10-30 seconds (one-time cost)
- Encryption: < 1 second
- Decryption: < 1 second

**Proof of Work** (16+ character names):
- Generation: < 1 second
- Verification: < 100ms

**Network Operations**:
- Bootstrap query: 50-200ms
- V2 registration: 1-2 seconds
- Migration: 1-2 minutes

---

## Backward Compatibility

### V1 Interoperability

- V1 clients continue to work without changes
- V2 records include V1-compatible Ed25519 signatures
- Bootstrap nodes serve both V1 and V2
- Migrated names work in both versions

### Migration Strategy

1. **Dual Operation**: Run V1 and V2 simultaneously
2. **Gradual Rollout**: Migrate names at your own pace
3. **Zero Downtime**: V1 records remain active during migration
4. **Fallback**: V1 always available if V2 issues occur

---

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/frw-community/FRW-Free-Web.git
cd FRW-Free-Web

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### Code Style

- TypeScript strict mode enabled
- ESLint with recommended rules
- Prettier for formatting
- 100% test coverage for critical paths

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

---

## Troubleshooting

### Common Issues

**"Password required for encrypted keypair"**
```bash
# Solution: Provide password when prompted
# Or specify unencrypted key file
frw register-v2 myname --key /path/to/unencrypted-key.json
```

**"PoW generation timeout"**
```bash
# Solution: Use longer name for instant registration
frw register-v2 my-longer-quantum-name
```

**"Failed to publish to V2 network"**
```bash
# Solution: Ensure bootstrap nodes are accessible
curl http://localhost:3100/health

# Check network connectivity
ping 83.228.214.189
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=frw:* frw register-v2 myname
```

---

## FAQ

**Q: Is V2 required?**  
A: No, V1 continues to work. V2 provides future-proof quantum resistance.

**Q: Can I migrate back from V2 to V1?**  
A: V1 records remain active. Both versions coexist.

**Q: How long until quantum computers break V1?**  
A: Estimates range from 10-30 years. V2 provides long-term security.

**Q: What's the storage overhead of V2?**  
A: ~6KB per name vs ~200 bytes for V1, primarily due to larger signatures.

**Q: Can I use the same name in V1 and V2?**  
A: Yes, migration creates a V2 record while preserving V1.

---

## Resources

### Documentation
- [V2 Technical Specification](./SPECIFICATION.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [API Reference](./API.md)
- [Security Analysis](./SECURITY.md)

### External Resources
- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [ML-DSA (Dilithium) Specification](https://doi.org/10.6028/NIST.FIPS.204)
- [Argon2 Specification](https://github.com/P-H-C/phc-winner-argon2)

---

## License

MIT License - see [LICENSE](../../LICENSE) file for details

---

## Support

- **Issues**: [GitHub Issues](https://github.com/frw-community/FRW-Free-Web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/frw-community/FRW-Free-Web/discussions)
- **Security**: Report vulnerabilities to security@frw.community

---

*FRW V2 - Quantum-Resistant Distributed Naming*  
*Built with cryptographic excellence for long-term security*
