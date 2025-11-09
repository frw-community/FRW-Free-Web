# FRW Naming System

## Overview

FRW supports **human-readable names** instead of cryptographic keys, with full **WWW compatibility**.

---

## Name Resolution Hierarchy

### 1. Human-Readable Names (Primary)
```
frw://alice/index.frw
frw://mycompany/products.frw
frw://news.blog/article.frw
```

**Format:** `frw://[name]/[path]`
- Name: 3-63 characters, lowercase, alphanumeric + hyphens
- Registered and signed by owner
- Points to IPNS public key

### 2. Direct Public Key (Fallback)
```
frw://12D3KooWBc5T8nEkR.../index.frw
```

**Format:** `frw://[base58-pubkey]/[path]`
- Direct resolution, no lookup needed
- Always works, no dependencies
- Used when name unavailable

### 3. DNS Bridge (WWW Integration)
```
https://example.com
DNS TXT: frw-key=12D3KooWBc5T8nEkR...
```

**Dual hosting:**
- Traditional HTTPS on example.com
- FRW version via DNS TXT record
- Automatic discovery by FRW client

---

## Name Registry Architecture

### Decentralized Name Registry (DNR)

**Not blockchain-based** - uses IPFS + signatures:

```typescript
interface NameRecord {
  name: string;              // "alice"
  publicKey: string;         // Ed25519 public key
  ipnsName: string;          // IPNS address
  signature: string;         // Self-signed proof
  timestamp: number;         // Registration time
  expires?: number;          // Optional expiry
}
```

**Storage:**
- Published to IPFS as JSON
- Indexed by DHT
- Cached locally
- Peer-to-peer propagation

**No central authority** - first-come-first-served with proof of ownership.

---

## Registration Process

### CLI Command
```bash
frw register alice --key ~/.frw/keys/alice.key
```

**Steps:**
1. Check name availability (DHT query)
2. Create signed name record
3. Publish to IPFS
4. Announce to DHT network
5. Save local cache

### Name Record Creation
```typescript
{
  "name": "alice",
  "publicKey": "12D3KooWBc5T...",
  "ipnsName": "/ipns/12D3KooWBc5T...",
  "signature": "base64-signature",
  "timestamp": 1699564800000,
  "metadata": {
    "description": "Alice's Personal Site",
    "email": "alice@example.com"  // Optional
  }
}
```

**Signature proves:**
- Owner controls the private key
- Name registration is authentic
- Timestamp prevents replay attacks

---

## Resolution Process

### Name → Public Key Lookup

```typescript
async function resolveName(name: string): Promise<string> {
  // 1. Check local cache
  const cached = await cache.get(name);
  if (cached && !isExpired(cached)) {
    return cached.publicKey;
  }
  
  // 2. Query DHT for name record
  const record = await dht.findNameRecord(name);
  if (!record) {
    throw new Error(`Name not found: ${name}`);
  }
  
  // 3. Verify signature
  if (!verifyNameRecord(record)) {
    throw new Error(`Invalid signature for: ${name}`);
  }
  
  // 4. Cache and return
  await cache.set(name, record);
  return record.publicKey;
}
```

### Full Resolution Chain
```
frw://alice/blog/post.frw
    ↓
1. Parse URL → name="alice", path="/blog/post.frw"
2. Resolve name → publicKey="12D3KooW..."
3. Query IPNS → CID="Qm..."
4. Fetch from IPFS → content
5. Verify signature → display
```

---

## DNS Bridge for WWW Compatibility

### Setup for Website Owners

**1. Add DNS TXT Record:**
```
Type: TXT
Name: _frw or @
Value: frw-key=12D3KooWBc5T8nEkR...;frw-name=mysite
TTL: 3600
```

**2. Publish FRW Version:**
```bash
frw publish ./website --domain example.com
```

**3. Both URLs Work:**
- `https://example.com` - Traditional web
- `frw://mysite` or `frw://example.com` - FRW protocol

### Client Auto-Discovery

When user visits `example.com` in FRW client:
```typescript
async function discoverFRWVersion(domain: string): Promise<string | null> {
  // 1. Query DNS TXT records
  const records = await dns.resolveTxt(domain);
  
  // 2. Find FRW record
  const frwRecord = records.find(r => r.startsWith('frw-key='));
  if (!frwRecord) return null;
  
  // 3. Extract public key
  const publicKey = frwRecord.split('frw-key=')[1].split(';')[0];
  
  // 4. Return FRW URL
  return `frw://${publicKey}/`;
}
```

**Browser Extension:**
- Detects DNS TXT records
- Shows "FRW version available" badge
- One-click switch to decentralized version

---

## Name Squatting Prevention

### Strategies

**1. Proof of Ownership (Primary)**
- Name must be signed with corresponding public key
- Can't register "google" without Google's key
- Self-sovereign identity

**2. Trademark Protection (Secondary)**
```typescript
interface NameClaim {
  name: string;
  claimant: string;
  evidence: string;      // URL to proof
  verifiedBy: string[];  // Community verification
}
```

**3. Dispute Resolution**
- Community-driven verification
- Reputation system
- Multi-signature endorsements

**4. Cost (Optional Future)**
- Small registration fee in crypto
- Prevents mass squatting
- Redistributed to validators

---

## Examples

### Personal Site
```bash
# Register name
frw register alice

# Publish content
frw publish ./my-site

# Access
frw://alice/index.frw
```

### Business with WWW Bridge
```bash
# Register company name
frw register acmecorp

# Add DNS record
# TXT: frw-key=12D3KooW...;frw-name=acmecorp

# Both work:
https://acmecorp.com          # Traditional
frw://acmecorp/               # Decentralized
```

### Blog with Subdomain Style
```bash
# Register blog name
frw register tech-blog

# Publish posts
frw publish ./blog

# Access like:
frw://tech-blog/2024/11/my-post.frw
```

---

## Name Format Rules

### Valid Names
```
[x] alice
[x] my-website
[x] blog2024
[x] company-name
[x] user123
```

### Invalid Names
```
✗ ALICE           (uppercase)
✗ my_website      (underscore)
✗ -website        (leading hyphen)
✗ website-        (trailing hyphen)
✗ ab              (too short, min 3)
✗ very-long-name-that-exceeds-limit (too long, max 63)
```

**Regex:** `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$`

---

## Security Considerations

### Name Hijacking Prevention
- Private key required for registration
- Signature verification on every lookup
- No central authority can revoke
- Owner has full control

### Impersonation Protection
- Display public key fingerprint in UI
- Verified badge for known entities
- Community reputation system
- DNS cross-verification

### Cache Poisoning
- Always verify signatures
- TTL-based cache expiry
- Peer consensus for critical names
- Local cache + DHT fallback

---

## Migration from Key-Only

### Backward Compatibility

**Old URL:**
```
frw://12D3KooWBc5T.../index.frw
```

**New URL:**
```
frw://alice/index.frw
```

**Both supported:**
- Parser detects format automatically
- Direct keys always work
- Names are convenience layer
- No breaking changes

---

## Implementation Roadmap

### Phase 1: Parser Support (Week 1)
- [ ] Detect name vs key format
- [ ] Name validation regex
- [ ] Parser tests

### Phase 2: DHT Registry (Week 2-3)
- [ ] Name record structure
- [ ] Signature verification
- [ ] DHT storage/retrieval
- [ ] Local cache

### Phase 3: CLI Commands (Week 3)
- [ ] `frw register [name]`
- [ ] `frw lookup [name]`
- [ ] `frw list-names`

### Phase 4: DNS Bridge (Week 4)
- [ ] DNS TXT query
- [ ] Auto-discovery
- [ ] Browser extension

### Phase 5: Community Tools (Week 5+)
- [ ] Name explorer website
- [ ] Dispute resolution system
- [ ] Verification badges
- [ ] Reputation scoring

---

## Comparison with Other Systems

| Feature | FRW | ENS | Handshake | DNS |
|---------|-----|-----|-----------|-----|
| Decentralized | [DONE] | [DONE] | [DONE] | [FAILED] |
| Human names | [DONE] | [DONE] | [DONE] | [DONE] |
| No blockchain | [DONE] | [FAILED] | [FAILED] | [DONE] |
| Self-sovereign | [DONE] | [DONE] | [DONE] | [FAILED] |
| WWW compatible | [DONE] | [!]️ | [!]️ | [DONE] |
| Registration fee | [FAILED]* | [DONE] | [DONE] | [DONE] |
| Censorship-resistant | [DONE] | [DONE] | [DONE] | [FAILED] |

*Optional in future

---

## User Experience

### In FRW Browser

**Address Bar:**
```
┌─────────────────────────────────────────┐
│ frw://alice/blog ▼                  [SECURE]  │
└─────────────────────────────────────────┘
```

**First Visit:**
```
[!]️  Resolving name "alice"...
[x]  Found: 12D3KooW... (verified)
[x]  Loading content...
```

**Name Info Button:**
```
[PLANNED] Name: alice
🔑 Owner: 12D3KooWBc5T... (Show full)
[x]  Signature verified
📅 Registered: 2024-11-08
🌐 WWW: https://alice.com
```

### Browser Extension (Chrome/Firefox)

**On Traditional Website:**
```
┌──────────────────────────┐
│ ⚡ FRW version available │
│                          │
│ View decentralized copy  │
│ [Switch to FRW] [Info]   │
└──────────────────────────┘
```

---

## FAQ

**Q: What if two people claim the same name?**  
A: First valid registration wins. Timestamp + signature prove ownership.

**Q: Can I transfer my name?**  
A: Yes, sign a transfer record with your private key.

**Q: What if I lose my private key?**  
A: Name is permanently lost. Backup keys securely.

**Q: Are names permanent?**  
A: Yes, unless you set an expiry date or transfer ownership.

**Q: Can names be revoked?**  
A: No central authority can revoke. Only owner with private key.

**Q: How to verify a name is legitimate?**  
A: Check public key, DNS cross-reference, community verification badges.

---

## Summary

**FRW naming combines:**
- Human-readable addresses (UX)
- Cryptographic ownership (security)
- DNS compatibility (adoption)
- No central authority (decentralization)
- Self-sovereign identity (freedom)

**Result:**  
Best of both worlds - friendly names + verifiable ownership + WWW integration.
