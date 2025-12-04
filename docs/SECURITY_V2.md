# FRW Security Model (V2)

> How the Free Resilient Web protects against quantum threats, censorship, and malicious actors.

## Table of Contents
- [Threat Model](#threat-model)
- [Cryptographic Foundations](#cryptographic-foundations)
- [Fork Protection](#fork-protection)
- [Bootstrap Node Security](#bootstrap-node-security)
- [Attack Scenarios & Mitigations](#attack-scenarios--mitigations)
- [Trust Model](#trust-model)
- [Best Practices for Node Operators](#best-practices-for-node-operators)
- [Security Audit Wishlist](#security-audit-wishlist)

---

## Threat Model

### What FRW V2 Protects Against

| Threat | Protection Mechanism |
|--------|---------------------|
| **Quantum Computers (Shor's Alg)** | **Hybrid Cryptography:** ML-DSA-65 (Dilithium3) + Ed25519 signatures. |
| **Quantum Computers (Grover's Alg)** | **Memory-Hard PoW:** Argon2id reduces quantum search speedup. |
| **Name Squatting Bots** | **Memory-Bound Cost:** Registration requires GBs of RAM, not just CPU. |
| **High-Value Domain Spoofing** | **DNS Verification:** Reserved names (e.g., "google") require DNS TXT proof. |
| **Sybil Attacks** | **Adaptive Rate Limiting:** Throughput limited by Reputation Score. |
| **Content Tampering** | **Signed IPFS CIDs:** Content is immutable and cryptographically verified. |
| **Bootstrap Node Compromise** | **Client-Side Verification:** Users validate every record locally. |

### What FRW V2 Does NOT Protect Against

| Limitation | Explanation |
|-----------|-------------|
| **Private Key Theft** | If an attacker gets your hybrid key, they control your identity forever. |
| **Social Engineering** | Users must verify DIDs/Keys via out-of-band channels (e.g., social media). |
| **Legal Coercion** | Bootstrap node operators are subject to local laws (but the network persists). |

---

## Cryptographic Foundations

FRW V2 employs a defense-in-depth strategy using **Hybrid Cryptography**.

### Hybrid Signatures

Every record requires **two** valid signatures to be accepted.

```typescript
// Verification Logic (Simplified)
async function verifyRecord(record: DistributedNameRecordV2) {
  // 1. Classical Check (Fast)
  const edValid = await ed25519.verify(
    record.canonicalBytes, 
    record.signature_ed25519, 
    record.publicKey_ed25519
  );
  
  // 2. Post-Quantum Check (Secure against CRQC)
  const pqValid = await dilithium3.verify(
    record.canonicalBytes, 
    record.signature_dilithium3, 
    record.publicKey_dilithium3
  );

  if (!edValid || !pqValid) {
    throw new Error("Invalid Hybrid Signature");
  }
}
```

### Memory-Hard Proof of Work

V2 replaces SHA-256 PoW with **Argon2id** to resist ASIC and Quantum mining.

```typescript
// PoW Generation
const proof = await argon2.hash({
  pass: nonce + timestamp,
  salt: sha3(name + publicKey),
  timeCost: 10,       // Iterations
  memoryCost: 8192,   // 8 GB RAM (for 1-char name)
  parallelism: 4
});
```

**Properties:**
*   **Memory-Bound:** Requires massive RAM for short names, making "bot farms" prohibitively expensive.
*   **Quantum-Resistant:** Memory requirements negate the quadratic speedup of Grover's Algorithm.

---

## Fork Protection

### Question: "What if someone forks the repo and removes PoW validation?"

**Answer: It doesn't matter. The network rejects invalid submissions.**

### Attack Scenario: The "Lazy Miner" Client

**Attacker's Plan:**
1.  Fork `@frw/cli`.
2.  Disable `Argon2id` calculation.
3.  Submit thousands of records with `nonce: 0` to the network.

**What Happens:**
```
Attacker's Client
    ↓ (Publishes invalid records)
Bootstrap Node (Gateway)
    ├─ verifyPoW(record) → FALSE
    ├─ console.log("REJECTED: Invalid PoW")
    └─ Drops connection.

Other Clients (P2P)
    ├─ Receive GossipSub message
    ├─ verifyPoW(record) → FALSE
    └─ Ban peer for spamming.
```

**Result:** The attack is filtered at the edge. No valid node accepts the garbage data.

---

## Bootstrap Node Security

Bootstrap nodes are **Validators**, not **Authorities**.

### What Bootstrap Nodes Validate (V2)

```typescript
// apps/bootstrap-node/src/validator.ts
async function validateSubmission(record: DistributedNameRecordV2) {
  // 1. Check if name is Reserved
  if (isReserved(record.name)) {
    await verifyDNSLink(record.name, record.publicKey);
  }

  // 2. Verify Hybrid Signatures
  await verifyHybridSignatures(record);

  // 3. Verify Memory-Hard PoW
  const requiredDifficulty = getDifficulty(record.name.length);
  await verifyArgon2id(record, requiredDifficulty);

  // 4. Check Rate Limits
  if (rateLimiter.isRateLimited(record.did)) {
    throw new Error("Rate limit exceeded");
  }
}
```

---

## Attack Scenarios & Mitigations

### 1. Quantum "Harvest Now, Decrypt Later"

**Attack:**
*   Attacker records all V1 (Ed25519-only) traffic today.
*   In 10 years, a Quantum Computer breaks Ed25519 keys.
*   Attacker forges signatures for old names.

**Mitigation (V2):**
*   V2 records require a **Dilithium3** signature.
*   Dilithium3 is based on lattice cryptography, which is currently believed to be secure against Quantum Computers.
*   Even if the Ed25519 key is broken, the attacker cannot forge the Dilithium3 signature.

### 2. High-Value Domain Spoofing

**Attack:**
*   Attacker generates a valid PoW for "google".
*   Registers `frw://google` before Google does.

**Mitigation (V2):**
*   **DNS Verification:** The registry checks for a TXT record at `_frw.google.com` containing the registrant's DID.
*   **Result:** The attacker cannot modify Google's DNS, so the registration is rejected by the network.

### 3. Sybil Spamming

**Attack:**
*   Attacker creates 1,000,000 identities.
*   Registers 1 random name per identity to bypass per-key rate limits.

**Mitigation (V2):**
*   **Cost of Entry:** Each identity requires generating a PoW.
*   **Reputation:** New identities have a "Standard" reputation score (limit: 10 names/day).
*   **Adaptive Limits:** To reach higher throughput, an identity must "age" and build history, making disposable Sybils ineffective.

---

## Trust Model

**FRW V2 is Trust-Minimized:**

1.  **Trust Math:** You trust SHA-3, Argon2id, and Lattice Cryptography.
2.  **Trust Consensus:** You trust the longest valid chain of records.
3.  **Don't Trust Nodes:** You verify everything locally.

---

## Best Practices for Node Operators

### Security Checklist

- [ ] **Memory:** Ensure server has at least 16GB RAM (to validate heavy PoW).
- [ ] **Firewall:** Allow ports 4001 (IPFS) and 3100 (HTTP API), block all others.
- [ ] **Updates:** Auto-update `@frw/protocol-v2` weekly.
- [ ] **Monitoring:** Track CPU/RAM spikes (potential DoS via PoW validation).

---

## Security Audit Wishlist

**Areas for Professional Review:**

1.  **Argon2id Parameters:** Are the memory costs (8GB for 1-char) sufficient?
2.  **Dilithium3 Implementation:** Verify constant-time execution to prevent side-channel attacks.
3.  **DNS Resolver:** Ensure no re-binding vulnerabilities in the DNS verification step.

---

## Responsible Disclosure

**Found a vulnerability?**

1.  **DO NOT** open a GitHub issue.
2.  **DO** email: `security@frw.org`
3.  **We pledge:**
    *   Response within 48 hours.
    *   Fix within 30 days.
    *   Bounty for critical bugs.

---

*Last Updated: December 2025 (Protocol V2)*
