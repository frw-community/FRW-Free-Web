# FRW Security Model

> How FRW protects against attacks, forks, and malicious actors

## Table of Contents
- [Threat Model](#threat-model)
- [Cryptographic Foundations](#cryptographic-foundations)
- [Fork Protection](#fork-protection)
- [Bootstrap Node Security](#bootstrap-node-security)
- [Attack Scenarios & Mitigations](#attack-scenarios--mitigations)
- [Version Synchronization](#version-synchronization)
- [Trust Model](#trust-model)
- [Known Limitations](#known-limitations)

---

## Threat Model

### What FRW Protects Against

| Threat | Protection Mechanism |
|--------|---------------------|
| **Name squatting bots** | Proof-of-work makes bulk registration computationally expensive |
| **Content tampering** | Content-addressed storage + signature verification |
| **Fake name ownership** | Ed25519 cryptographic signatures |
| **Forked/modified clients** | Server-side validation at bootstrap nodes |
| **Sybil attacks** | POW requirement per name, not per identity |
| **Bootstrap node compromise** | DHT fallback, client-side signature verification |
| **DNS hijacking** | No DNS involved, pure cryptographic resolution |
| **MITM attacks** | All content signed, tampering detected |

### What FRW Does NOT Protect Against

| Limitation | Explanation |
|-----------|-------------|
| **Private key theft** | If attacker gets your keys, they control your names |
| **Social engineering** | Users must verify public keys out-of-band |
| **Compromised IPFS network** | Relies on IPFS security model |
| **Quantum computers** | Ed25519 vulnerable to quantum attacks (future) |
| **Legal coercion** | Bootstrap node operators could be legally forced offline |

---

## Cryptographic Foundations

### Ed25519 Signatures

**Every piece of content is signed:**

```typescript
// Content creation
const signature = signatureManager.sign(contentHash, privateKey);

// Content verification (by everyone)
const isValid = signatureManager.verify(contentHash, signature, publicKey);
if (!isValid) throw new Error("Content has been tampered with!");
```

**Properties:**
- 256-bit security
- Public key = 32 bytes
- Signature = 64 bytes
- Unforgeable (without private key)
- Verifiable by anyone (with public key)

### Proof-of-Work

**Every name registration requires computational work:**

```typescript
// Registration requires finding hash with N leading zeros
const proof = {
  nonce: 12345678,
  hash: "000000abc123...",  // 6 leading zeros for 8-char name
  difficulty: 6,
  timestamp: Date.now()
};

// Verification is instant
const isValid = verifyProof(name, publicKey, proof);
```

**Properties:**
- Expensive to generate (seconds to days)
- Instant to verify (milliseconds)
- Difficulty scales with name length
- Cannot be reused or forged

### Content Addressing

**Content is identified by its hash (CID):**

```
Content → SHA-256 Hash → IPFS CID
"Hello World" → Qm... (unique identifier)

If content changes, CID changes!
```

**Properties:**
- Integrity guaranteed
- Deduplication automatic
- No need to trust storage provider
- Tampered content = different CID

---

## Fork Protection

### Question: "What if someone forks the repo and removes POW/signature validation?"

**Answer: It doesn't matter. The network rejects invalid submissions.**

### Attack Scenario 1: Modified CLI

**Attacker's plan:**
```typescript
// Fork the CLI and modify register command
// Skip POW generation entirely
const proof = { nonce: 0, hash: "fake", difficulty: 0 };
await registry.registerName(record); // Try to register without work
```

**What happens:**
```
User's Modified CLI
    ↓ (publishes to network)
Bootstrap Node
    ├─ verifyProofOfWork() → false
    ├─ console.log("Invalid POW, rejected")
    └─ Doesn't add to index

IPFS DHT
    ├─ Record gets published (DHT doesn't validate)
    └─ But: Other clients verify before accepting!

FRW Browser (resolving name)
    ├─ Fetches record from DHT
    ├─ verifyProofOfWork() → false
    ├─ console.log("Invalid POW, ignoring")
    └─ Name not found (from user perspective)
```

**Result: Attack fails. Invalid names are ignored by the entire network.**

### Attack Scenario 2: Spam Bootstrap Node

**Attacker's plan:**
- Set up malicious bootstrap node
- Accept names without POW validation
- Try to pollute the network index

**What happens:**
```
Legitimate User's Client
    ├─ Queries multiple bootstrap nodes
    ├─ Node 1 (legit): returns valid names
    ├─ Node 2 (malicious): returns spam names with invalid POW
    └─ Client verifies POW for each result
        ├─ Valid names: accepted
        └─ Invalid names: rejected

Result: Malicious node's spam is filtered out client-side
```

**Why this works:**
- Clients don't trust bootstrap nodes
- Every result is verified cryptographically
- Bootstrap nodes are an index, not an authority

### Attack Scenario 3: Fake Content

**Attacker's plan:**
- Register name "amazon" (after doing POW)
- Point to phishing site content
- Wait for users to visit

**What happens:**
```
User visits frw://amazon/
    ↓
Browser resolves "amazon"
    ├─ Gets CID: QmMalicious123...
    ├─ Gets publicKey: AttackerKey123...
    └─ Gets signature: ...

User sees:
    WARNING: This site is NOT verified
    PublicKey: AttackerKey123...
    Expected: AmazonOfficialKey...
    
User decision:
    - Trust out-of-band verification (Amazon's Twitter)
    - Or reject and close
```

**Protection:**
- Users must verify public keys independently
- Real Amazon would publish their public key on official channels
- Similar to SSH key fingerprints or HTTPS certificate pinning

---

## Bootstrap Node Security

### What Bootstrap Nodes Validate

```typescript
// apps/bootstrap-node/index.ts
async handlePubsubMessage(msg: any) {
  const record: DistributedNameRecord = JSON.parse(msg.data);
  
  // 1. Validate proof-of-work
  const requiredDifficulty = getRequiredDifficulty(record.name);
  const powValid = verifyProof(
    record.name,
    record.publicKey,
    record.proof,
    requiredDifficulty
  );
  if (!powValid) {
    console.log(`[Bootstrap] REJECTED: Invalid POW for ${record.name}`);
    return;
  }
  
  // 2. Validate signature
  const signatureValid = signatureManager.verify(
    record.name,
    record.signature,
    record.publicKey
  );
  if (!signatureValid) {
    console.log(`[Bootstrap] REJECTED: Invalid signature for ${record.name}`);
    return;
  }
  
  // 3. Check POW timestamp (prevent replay of old POW)
  if (Date.now() - record.proof.timestamp > 3600000) { // 1 hour
    console.log(`[Bootstrap] REJECTED: POW too old for ${record.name}`);
    return;
  }
  
  // 4. All checks passed - add to index
  this.index.set(record.name, record);
  console.log(`[Bootstrap] Added ${record.name}`);
}
```

### Bootstrap Node Role

**Bootstrap nodes are VALIDATORS, not CONTROLLERS:**

```
┌─────────────────────────────────────────┐
│ What Bootstrap Nodes DO                 │
├─────────────────────────────────────────┤
│ + Verify POW meets difficulty          │
│ + Verify cryptographic signatures      │
│ + Check POW timestamp (anti-replay)    │
│ + Reject spam and invalid submissions  │
│ + Provide fast HTTP index (optional)   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ What Bootstrap Nodes DON'T DO           │
├─────────────────────────────────────────┤
│ - Control who can register names       │
│ - Prevent DHT access                   │
│ - Store private keys                   │
│ - Modify or censor content             │
│ - Act as certificate authority         │
└─────────────────────────────────────────┘
```

---

## Attack Scenarios & Mitigations

### 1. Mass Name Squatting

**Attack:** Register thousands of valuable names

**Mitigation:**
- Short names require days/years of computation
- "amazon" (6 chars) = 72 minutes per registration
- "a" (1 char) = 36,500 years (effectively impossible)
- Economically infeasible to squat at scale

**Economic analysis:**
```
Cost to squat 1000 names (8 characters each):
- POW time: 1000 × 17 seconds = 4.7 hours
- Electricity: ~$0.50 (rough estimate)

Cost to squat 1000 names (6 characters each):
- POW time: 1000 × 72 minutes = 1,200 hours (50 days)
- Electricity: ~$120
- Opportunity cost of compute: significant

Cost to squat 1000 names (4 characters each):
- POW time: 1000 × 13 days = 35 years
- Completely infeasible
```

### 2. Compromised Bootstrap Node

**Attack:** Hacker gains control of bootstrap node server

**What attacker CAN do:**
- Take node offline (denial of service)
- Log IP addresses of users querying names
- Return incorrect/outdated name records

**What attacker CANNOT do:**
- Register names without valid POW
- Forge signatures for existing names
- Modify content on IPFS
- Prevent DHT resolution

**Mitigation:**
- Multiple bootstrap nodes provide redundancy
- Clients verify signatures on all responses
- Network falls back to DHT if all bootstraps fail
- Bootstrap nodes are stateless (no valuable data to steal)

### 3. 51% Attack on Bootstrap Nodes

**Attack:** Control majority of bootstrap nodes

**Impact:**
- Could coordinate to reject valid names
- Could provide stale data
- Could log more user queries

**Mitigation:**
- Users can bypass bootstrap entirely (use DHT-only mode)
- Community can fork and run new bootstrap nodes
- No way to prevent direct IPFS access
- Anyone can run a bootstrap node

### 4. Malicious IPFS Gateway

**Attack:** Run malicious IPFS gateway, serve fake content

**Mitigation:**
- Content is identified by CID (content-addressed)
- Wrong content = different CID = detected
- Clients can verify content hash
- Users can run their own IPFS nodes

---

## Version Synchronization

### Current Approach

**All bootstrap nodes use shared validation library:**

```typescript
// Shared code (packages/name-registry)
export function getRequiredDifficulty(name: string): number {
  if (name.length <= 3) return 12;
  if (name.length === 4) return 10;
  if (name.length === 5) return 9;
  // ... hardcoded logic
}

// Bootstrap node (apps/bootstrap-node)
import { getRequiredDifficulty } from '@frw/name-registry';
// All nodes use identical validation logic
```

**Benefits:**
- Consistent validation across all nodes
- Updates happen via package updates
- No need for protocol negotiation

**Risks:**
- Node operators must update in sync
- Outdated nodes might accept/reject differently
- Version skew could cause inconsistencies

### Recommended Update Process

1. **Announce update** - GitHub release + mailing list
2. **Grace period** - 1 week for node operators to update
3. **Coordinated update** - All update at specific time
4. **Monitor** - Check all nodes return same results
5. **Rollback plan** - If issues, revert quickly

### Future: Version Negotiation

**Could implement protocol versioning:**

```typescript
{
  "status": "ok",
  "nodeId": "switzerland-1",
  "protocolVersion": "1.0.0",  // Add this
  "minCompatible": "1.0.0",    // Add this
  "validation": {
    "powEnabled": true,
    "signatureRequired": true,
    "difficulties": { ... }
  }
}
```

**Clients could:**
- Check version compatibility
- Warn if nodes are out of sync
- Only query compatible nodes

---

## Trust Model

### FRW's Trust Assumptions

**What you MUST trust:**
1. **Mathematics** - Ed25519 and SHA-256 are secure
2. **Your own machine** - Not compromised
3. **IPFS network** - Content propagation works
4. **Your key security** - Keep private keys safe

**What you DON'T need to trust:**
1. **Bootstrap nodes** - Can be compromised, network still works
2. **Other users** - Can't affect your names
3. **Central authority** - Doesn't exist
4. **GitHub/repo owner** - Code is open source, forkable

### Comparison to Traditional Web

| Traditional Web | FRW |
|----------------|-----|
| Trust DNS servers | Trust your IPFS node |
| Trust hosting provider | Trust IPFS network |
| Trust certificate authority | Trust Ed25519 math |
| Trust domain registrar | Trust proof-of-work |
| Single point of failure | Multiple fallbacks |

---

## Known Limitations

### 1. Key Management

**Problem:** If user loses private key, they lose their name forever

**Mitigation:**
- Clear warnings in CLI/browser
- Key backup instructions
- Future: Multi-sig or recovery mechanisms

### 2. Name Disputes

**Problem:** No central authority to resolve disputes

**Example:**
- Attacker registers "amazon" before real Amazon
- Real Amazon has no recourse

**Mitigation:**
- Users must verify public keys out-of-band
- Real companies publish keys on official channels
- Community reputation systems (future)
- Legal names could require POW + DNS verification

### 3. Initial Bootstrap Node Trust

**Problem:** New users must trust initial bootstrap node list

**Mitigation:**
- Hardcoded in source code (transparent)
- User can modify or add their own nodes
- Can skip bootstraps entirely (DHT-only mode)
- Multiple independent bootstrap operators

### 4. Spam Names (With Valid POW)

**Problem:** Someone could register offensive/spam names with valid POW

**Mitigation:**
- Bootstrap nodes could implement optional filters
- Users can run their own filtered nodes
- Browser could have content warnings
- Future: Reputation/block lists (opt-in)

### 5. Quantum Computing

**Problem:** Quantum computers could break Ed25519

**Mitigation:**
- Post-quantum crypto algorithms exist
- Protocol can be upgraded
- Keys can be migrated
- Probably decades away

---

## Best Practices for Node Operators

### Security Checklist

- [ ] Keep server OS updated
- [ ] Run bootstrap node as non-root user
- [ ] Enable firewall (only ports 3100, 22)
- [ ] Use SSH key authentication (disable passwords)
- [ ] Monitor logs for attacks
- [ ] Keep dependencies updated
- [ ] Join node operator mailing list
- [ ] Have emergency contacts

### Update Protocol

1. Subscribe to FRW security announcements
2. Update within 7 days of security releases
3. Test updates on staging before production
4. Monitor after update for issues
5. Report any problems to community

---

## Security Audit Wishlist

**Areas that need professional review:**

1. **Cryptographic implementation** - Verify Ed25519 usage is correct
2. **POW difficulty tuning** - Ensure optimal security/usability balance
3. **Signature verification** - Check for timing attacks or bypasses
4. **Bootstrap node code** - Look for injection or DoS vulnerabilities
5. **IPFS integration** - Verify proper use of IPFS security features

**If you're a security researcher, we welcome reviews!**

---

## Responsible Disclosure

**Found a security vulnerability?**

1. **DO NOT** open a public GitHub issue
2. **DO** email: frw-community@proton.me
3. **Include:**
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
4. **We will:**
   - Acknowledge within 48 hours
   - Provide updates every 7 days
   - Credit you in security advisory (unless you prefer anonymity)
   - Fix critical issues within 30 days

---

## Conclusion

**FRW's security is based on cryptographic verification, not trust.**

- Forking the code doesn't break the network
- Bootstrap nodes validate everything server-side
- Clients verify everything client-side
- No single point of failure or control
- Users must protect their own private keys

**The protocol is as secure as the cryptography it uses: Ed25519 + SHA-256 + Proof-of-Work**

Anyone can verify, no one can fake.

---

*Last updated: November 15, 2025*
