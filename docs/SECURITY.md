# FRW Security Model

## Overview

FRW security is built on three pillars:
1. **Cryptographic Signatures** - Content authenticity
2. **JavaScript Sandbox** - Execution isolation
3. **Decentralized Trust** - No single authority

## Threat Model

### Threats Addressed

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Content tampering | High | Ed25519 signatures |
| Identity spoofing | High | Public key authentication |
| Malicious scripts | Critical | JavaScript sandbox |
| Data exfiltration | High | Network isolation |
| DDoS attacks | Medium | P2P distribution |
| Censorship | High | Decentralization |
| Tracking/surveillance | High | No central servers |

### Threats Not Addressed

| Threat | Rationale |
|--------|-----------|
| End-to-end encryption | Out of scope for v1.0 (future enhancement) |
| Anonymity | Use Tor/I2P overlay |
| Sybil attacks | Reputation system (future) |
| Content legality | User responsibility |

## Cryptographic System

### Ed25519 Signatures

**Key Generation**
```javascript
// Generate keypair
const {publicKey, privateKey} = ed25519.generateKeyPair();

// Export for storage
const publicKeyBase58 = base58.encode(publicKey);
const privateKeyEncrypted = encrypt(privateKey, userPassword);
```

**Signing Process**
```javascript
// 1. Canonicalize content (remove signature metadata)
const canonical = canonicalize(content);

// 2. Hash content
const hash = sha256(canonical);

// 3. Sign hash
const signature = ed25519.sign(hash, privateKey);

// 4. Encode signature
const signatureBase64 = base64.encode(signature);

// 5. Embed in metadata
content.metadata['frw-signature'] = signatureBase64;
```

**Verification Process**
```javascript
// 1. Extract signature
const signature = base64.decode(content.metadata['frw-signature']);

// 2. Extract public key
const publicKey = base58.decode(content.metadata['frw-author']);

// 3. Remove signature from content
const canonical = canonicalize(content);

// 4. Hash content
const hash = sha256(canonical);

// 5. Verify signature
const valid = ed25519.verify(signature, hash, publicKey);

if (!valid) {
  throw new SecurityError('Invalid signature');
}
```

### Key Management

**Storage**
- Private keys: Encrypted with user password, stored locally
- Public keys: Plaintext, distributed via content
- Key derivation: PBKDF2 (100k iterations, SHA-256)

**Rotation**
- Keys rotatable via signed migration message
- Old key signs pointer to new key
- Grace period for propagation

**Backup**
- Mnemonic phrase (BIP39)
- Encrypted export
- Paper wallet option

## JavaScript Sandbox

### Isolation Boundaries

```
┌─────────────────────────────────────┐
│      Sandbox (Untrusted Code)      │
├─────────────────────────────────────┤
│                                     │
│  [x] DOM manipulation (scoped)       │
│  [x] Event handlers                  │
│  [x] localStorage (origin-scoped)    │
│  [x] IPFS API (read-only, approved)  │
│                                     │
│  ✗ Node APIs (fs, net, child_proc) │
│  ✗ Eval / Function constructor      │
│  ✗ External network access          │
│  ✗ System calls                     │
│  ✗ WebAssembly (optional disable)  │
│                                     │
└─────────────────────────────────────┘
```

### Implementation

**vm2 (Node.js)**
```javascript
const {VM} = require('vm2');

const vm = new VM({
  timeout: 5000,
  sandbox: {
    document: scopedDocument,
    window: scopedWindow,
    console: safeConsole,
    ipfs: readOnlyIPFSAPI
  },
  eval: false,
  wasm: false
});

try {
  vm.run(scriptCode);
} catch (err) {
  console.error('Sandbox violation:', err);
}
```

**Deno (Alternative)**
```typescript
const worker = new Worker(
  new URL("./sandbox-worker.ts", import.meta.url).href,
  {
    type: "module",
    deno: {
      permissions: {
        net: false,
        read: false,
        write: false,
        run: false,
        env: false,
      },
    },
  }
);

worker.postMessage({code: scriptCode});
```

### Permission System

**Requested Permissions**
```html
<meta name="frw-permissions" content="ipfs:read, storage:local">
```

**Permission Dialog**
```
┌─────────────────────────────────────────┐
│  Permission Request                     │
├─────────────────────────────────────────┤
│                                         │
│  frw://alice/app.frw wants to:         │
│                                         │
│  ☐ Read content from IPFS               │
│  ☐ Store data locally (5MB limit)      │
│                                         │
│  [Allow Once]  [Allow Always]  [Deny]  │
│                                         │
└─────────────────────────────────────────┘
```

## Network Security

### IPFS Security

**Content Verification**
- All content retrieved by CID (content-addressed)
- CID computed via SHA-256 hash
- Impossible to serve different content for same CID

**Transport Security**
- libp2p provides encrypted channels (secio/noise)
- Peer authentication via public keys
- No plaintext transmission

### DHT Security

**Sybil Resistance**
- Proof-of-work for peer IDs (future)
- Rate limiting on queries
- Reputation scoring (future)

**Eclipse Attacks**
- Multiple bootstrap nodes
- Peer diversity requirements
- Monitoring for anomalous behavior

## Content Security Policy

### Default CSP

```
Content-Security-Policy:
  default-src 'self' frw:;
  script-src 'self' frw: 'unsafe-eval';
  style-src 'self' frw: 'unsafe-inline';
  img-src 'self' frw: data:;
  connect-src 'self' ipfs:;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self' frw:;
```

### Custom CSP

Pages can specify stricter CSP:
```html
<meta name="frw-csp" content="script-src 'none'; style-src 'self'">
```

## Privacy

### No Tracking
- No cookies sent to external servers
- No analytics by default
- No user profiling
- No centralized logs

### Local Data
- All user data stored locally
- No cloud sync (unless explicitly enabled)
- SQLite database encrypted at rest

### Network Privacy
- DHT queries reveal interest in content
- Use Tor/I2P for anonymity
- Content requests visible to IPFS peers

## Vulnerability Disclosure

### Process
1. Report to security@frw.io (PGP encrypted)
2. Acknowledgment within 48 hours
3. Investigation and patch development
4. Coordinated disclosure after fix
5. Security advisory published

### Bug Bounty
- Critical: $500-2000
- High: $200-500
- Medium: $50-200
- Low: Recognition

## Security Checklist

### For Content Authors
- [ ] Keep private key secure and encrypted
- [ ] Never share private key
- [ ] Verify all scripts are signed
- [ ] Review permissions requested
- [ ] Use strong password for key encryption
- [ ] Backup private key securely

### For Users
- [ ] Verify signatures before trusting content
- [ ] Review permission requests
- [ ] Keep client software updated
- [ ] Use strong password for local database
- [ ] Be cautious with interactive content
- [ ] Report suspicious content

### For Developers
- [ ] All inputs validated
- [ ] No eval/Function usage in trusted code
- [ ] Dependency audits regular
- [ ] Security tests in CI/CD
- [ ] Code reviews mandatory
- [ ] Secrets never committed

## Incident Response

### Detection
- Automated signature verification failures
- Sandbox violation logs
- User reports
- Security scanner alerts

### Response
1. Isolate affected systems
2. Assess scope and impact
3. Patch vulnerability
4. Notify affected users
5. Post-mortem analysis
6. Update security measures

### Communication
- Security advisory via website
- Email to registered users
- Client software update notification
- Public disclosure (after 90 days or patch)
