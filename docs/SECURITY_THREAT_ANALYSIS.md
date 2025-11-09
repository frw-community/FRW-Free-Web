# FRW Security Threat Analysis

Comprehensive analysis of potential attack vectors and required mitigations.

**Date:** November 9, 2025  
**Status:** Critical issues identified, mitigations designed

---

## Critical Threats (Must Fix Before Launch)

### 1. ✅ Bot Mass Registration (FIXED)

**Threat:** Automated script registers all premium names

**Attack:**
```python
for name in generate_all_short_names():
    frw_register(name)  # 17,576 3-letter names in minutes
```

**Impact:** Network unusable, all good names squatted

**Mitigation Implemented:**
- ✅ Proof of Work (10+ minutes per short name)
- ✅ Registration Bonds (10M units for 3-letter names)
- ✅ Rate Limiting (1/minute, 20/day, 100/month)
- ✅ Progressive Pricing (exponential cost increase)

**Status:** MITIGATED

---

### 2. 🔴 Challenge Spam Attack

**Threat:** Flood system with fake challenges to DoS legitimate disputes

**Attack:**
```bash
# Spam 10,000 challenges
for name in all_registered_names:
    frw challenge create $name --reason squatting --bond 1000000
```

**Impact:**
- Legitimate challenges buried in noise
- Database exhaustion
- Processing overhead
- User confusion

**Required Mitigation:**
```typescript
// Challenge rate limiting
interface ChallengeRateLimits {
    perHour: 2,        // Max 2 challenges per hour
    perDay: 5,         // Max 5 per day
    perMonth: 20,      // Max 20 per month
    perName: 1,        // Only 1 active challenge per name
}

// Challenge bonds increase with spam behavior
function getChallengeBond(challenger: string): bigint {
    const recentChallenges = getRecentChallenges(challenger);
    const lostChallenges = getLostChallenges(challenger);
    
    let bond = 1_000_000n;  // Base
    
    // Lost challenges = higher future bonds
    bond *= BigInt(1 + lostChallenges.length);
    
    // Recent challenges = progressive cost
    bond *= BigInt(Math.pow(1.5, recentChallenges.length));
    
    return bond;
}
```

**Files to Create:**
- `packages/name-registry/src/challenge/spam-prevention.ts`

**Status:** NOT IMPLEMENTED - HIGH PRIORITY

---

### 3. 🔴 Database Storage Exhaustion

**Threat:** Fill database with junk data to crash system

**Attack:**
```bash
# Register 1M+ names with minimum bonds
# Create massive evidence files
# Flood metrics with fake data
```

**Impact:**
- Database grows to gigabytes
- Query performance degrades
- Disk space exhaustion
- System crashes

**Required Mitigation:**
```typescript
// Storage limits
interface StorageLimits {
    maxDatabaseSize: 1_000_000_000,      // 1GB limit
    maxRecordsPerUser: 1000,              // 1000 names max
    maxEvidenceSize: 10_000_000,          // 10MB per evidence
    maxMetricsHistory: 365 * 86400000,    // 1 year
    maxChallengesHistory: 180 * 86400000  // 6 months
}

// Automatic cleanup
async function cleanupDatabase() {
    // Delete resolved challenges older than 6 months
    await db.exec(`
        DELETE FROM challenges 
        WHERE status IN ('resolved_owner_wins', 'resolved_challenger_wins')
        AND resolved < ?
    `, [Date.now() - 180 * 86400000]);
    
    // Delete old metrics
    await db.exec(`
        DELETE FROM metrics 
        WHERE timestamp < ?
    `, [Date.now() - 365 * 86400000]);
    
    // Vacuum database
    await db.exec('VACUUM');
}
```

**Files to Create:**
- `packages/name-registry/src/storage/cleanup.ts`
- `packages/name-registry/src/storage/limits.ts`

**Status:** NOT IMPLEMENTED - HIGH PRIORITY

---

### 4. 🔴 IPFS DHT Poisoning

**Threat:** Flood IPFS DHT with fake name records

**Attack:**
```python
# Publish millions of fake records to DHT
for i in range(1000000):
    fake_record = create_fake_record()
    ipfs.dht.put(f"/frw/names/{i}", fake_record)
```

**Impact:**
- DHT queries return wrong data
- Legitimate records buried
- Network confusion
- Increased query time

**Required Mitigation:**
```typescript
// Cryptographic verification BEFORE trusting DHT data
async function resolveName(name: string): Promise<NameRecord | null> {
    // Query DHT
    const dhtRecords = await ipfs.dht.get(`/frw/names/${name}`);
    
    // CRITICAL: Verify signature
    for (const record of dhtRecords) {
        const valid = verifySignature(
            record.data,
            record.publicKey,
            record.signature
        );
        
        if (!valid) {
            // Reject invalid records
            console.warn('Invalid DHT record detected', name);
            continue;
        }
        
        // Verify timestamp is reasonable
        if (record.timestamp > Date.now()) {
            console.warn('Future-dated record', name);
            continue;
        }
        
        // First valid record wins
        return record;
    }
    
    return null;
}

// Local caching to reduce DHT dependency
class NameCache {
    private cache = new Map<string, {record: NameRecord; verified: Date}>();
    
    async resolve(name: string): Promise<NameRecord | null> {
        // Check cache first
        const cached = this.cache.get(name);
        if (cached && Date.now() - cached.verified.getTime() < 3600000) {
            return cached.record;
        }
        
        // Query DHT and verify
        const record = await resolveName(name);
        if (record) {
            this.cache.set(name, {record, verified: new Date()});
        }
        
        return record;
    }
}
```

**Status:** PARTIALLY IMPLEMENTED - Signature verification exists, caching needed

---

### 5. 🔴 Replay Attack

**Threat:** Reuse old valid signatures to perform unauthorized actions

**Attack:**
```typescript
// Capture legitimate registration
const oldRegistration = {
    name: "alice",
    publicKey: "12D3KooW...",
    signature: Buffer.from("..."),  // Valid signature from past
    timestamp: 1699000000000
};

// Replay months later with same signature
await registerName(oldRegistration);
```

**Impact:**
- Signatures used multiple times
- Timestamp manipulation
- Unauthorized registrations

**Required Mitigation:**
```typescript
// Nonce-based replay prevention
class NonceManager {
    private usedNonces = new Set<string>();
    
    async generateNonce(publicKey: string): Promise<string> {
        // Cryptographically random nonce
        const nonce = crypto.randomBytes(32).toString('hex');
        const nonceId = `${publicKey}:${nonce}`;
        
        // Store with expiration
        this.usedNonces.add(nonceId);
        
        // Cleanup old nonces after 1 hour
        setTimeout(() => {
            this.usedNonces.delete(nonceId);
        }, 3600000);
        
        return nonce;
    }
    
    verifyNonce(publicKey: string, nonce: string): boolean {
        const nonceId = `${publicKey}:${nonce}`;
        
        if (this.usedNonces.has(nonceId)) {
            return false;  // Already used
        }
        
        this.usedNonces.add(nonceId);
        return true;
    }
}

// Updated registration with nonce
interface NameRegistration {
    name: string;
    publicKey: string;
    nonce: string;        // NEW: Prevents replay
    timestamp: number;
    signature: Buffer;    // Signs: name:publicKey:nonce:timestamp
}

function verifyRegistration(reg: NameRegistration): boolean {
    // Check nonce hasn't been used
    if (!nonceManager.verifyNonce(reg.publicKey, reg.nonce)) {
        throw new Error('Nonce already used - replay attack detected');
    }
    
    // Check timestamp is recent (within 1 hour)
    if (Date.now() - reg.timestamp > 3600000) {
        throw new Error('Registration expired');
    }
    
    // Verify signature
    const message = `${reg.name}:${reg.publicKey}:${reg.nonce}:${reg.timestamp}`;
    return verifySignature(message, reg.publicKey, reg.signature);
}
```

**Files to Create:**
- `packages/name-registry/src/security/nonce-manager.ts`

**Status:** NOT IMPLEMENTED - CRITICAL

---

### 6. 🟡 DNS Hijacking for Verified Names

**Threat:** Attacker compromises DNS to steal verified name

**Attack:**
```bash
# Hacker gains access to example.com DNS
# Changes TXT record to their public key
# Re-registers frw://example.com with "proof"
```

**Impact:**
- Verified name stolen
- Users trust fake owner
- Content replaced

**Mitigation:**
```typescript
// DNS verification locking
interface DNSVerifiedName {
    name: string;
    publicKey: string;
    dnsVerified: Date;
    locked: boolean;      // NEW: Lock after first verification
    transferNonce?: string;  // Required for transfer
}

// Once DNS verified, require additional proof for transfer
async function transferDNSVerifiedName(
    name: string,
    newPublicKey: string,
    transferProof: {
        oldKeySignature: Buffer;    // Signed by OLD key
        dnsVerification: Buffer;     // Current DNS matches NEW key
        transferNonce: string;       // One-time transfer code
    }
): Promise<void> {
    const existing = await getName(name);
    
    if (!existing.dnsVerified) {
        throw new Error('Not DNS verified');
    }
    
    // Require BOTH old key signature AND DNS verification
    const oldKeyValid = verifySignature(
        `transfer:${name}:${newPublicKey}:${transferProof.transferNonce}`,
        existing.publicKey,
        transferProof.oldKeySignature
    );
    
    const dnsValid = await verifyDNS(name, newPublicKey);
    
    if (!oldKeyValid || !dnsValid) {
        throw new Error('Transfer verification failed');
    }
    
    // Perform transfer
    await updateName(name, newPublicKey);
}
```

**Status:** PARTIAL - DNS verification exists, transfer protection needed

---

### 7. 🟡 Front-Running Attack

**Threat:** See pending registration, register same name first

**Attack:**
```python
# Monitor DHT for new registrations
while True:
    pending = ipfs.dht.getPendingRecords()
    for record in pending:
        if is_valuable_name(record.name):
            # Register it first with higher gas/priority
            quick_register(record.name)
```

**Impact:**
- Valuable names sniped
- Race conditions
- Unfair registrations

**Mitigation:**
```typescript
// Commit-reveal scheme
class CommitRevealRegistration {
    // Phase 1: Commit (hide name)
    async commit(
        nameHash: string,  // SHA-256(name:secret:publicKey)
        bond: bigint
    ): Promise<string> {
        const commitId = generateId();
        
        await db.saveCommit({
            commitId,
            nameHash,
            publicKey,
            bond,
            timestamp: Date.now()
        });
        
        return commitId;
    }
    
    // Phase 2: Reveal (after delay)
    async reveal(
        commitId: string,
        name: string,
        secret: string,
        publicKey: string
    ): Promise<void> {
        const commit = await db.getCommit(commitId);
        
        // Must wait at least 10 minutes
        if (Date.now() - commit.timestamp < 600000) {
            throw new Error('Reveal period not reached');
        }
        
        // Verify hash matches
        const hash = sha256(`${name}:${secret}:${publicKey}`);
        if (hash !== commit.nameHash) {
            throw new Error('Invalid reveal');
        }
        
        // Register name
        await registerName(name, publicKey, commit.bond);
    }
}
```

**Status:** NOT IMPLEMENTED - MEDIUM PRIORITY

---

### 8. 🟡 Sybil Attack on Voting (Phase 2)

**Threat:** Create many fake accounts to manipulate votes

**Attack:**
```python
# Create 1000 fake accounts
for i in range(1000):
    account = create_account()
    vote(challenge_id, option=ATTACKER_CHOICE, account)
```

**Impact:**
- Voting outcomes manipulated
- Fake community consensus
- Unfair challenge resolutions

**Mitigation (Already Designed for Phase 2):**
```typescript
// Multiple layers of Sybil resistance
interface VoteEligibility {
    minReputation: 100,         // Must have SILVER tier
    minAccountAge: 30 * 86400000,  // 30 days old
    minActivity: {
        contentPublished: 5,     // At least 5 sites
        ipnsUpdates: 10,         // 10+ updates
        challengesParticipated: 2  // Participated in 2+ challenges
    },
    trustRequirement: {
        minTrustScore: 200,      // Some community trust
        minAttestations: 5       // 5+ attestations
    }
}

// Vote weight based on reputation (quadratic)
function calculateVoteWeight(reputation: number): number {
    return Math.sqrt(reputation);  // Quadratic scaling
}
```

**Status:** DESIGNED - Will implement in Phase 2

---

### 9. 🟡 Content Bombing

**Threat:** Register names then host illegal/harmful content

**Attack:**
```bash
# Register legitimate-looking name
frw register news

# Host illegal content
frw publish ./illegal-content/

# Damage FRW reputation
```

**Impact:**
- Legal liability
- Network reputation damage
- ISP blocks
- Government intervention

**Mitigation:**
```typescript
// Content reporting system
interface ContentReport {
    name: string;
    reporterPublicKey: string;
    category: 'illegal' | 'malware' | 'phishing' | 'spam';
    evidence: string;  // Description/proof
    timestamp: number;
}

// Emergency takedown for critical issues
async function emergencyTakedown(
    name: string,
    reason: string,
    evidence: ContentReport[]
): Promise<void> {
    // Require multiple independent reports (5+)
    if (evidence.length < 5) {
        throw new Error('Insufficient reports for takedown');
    }
    
    // Verify reporters are reputable (not Sybils)
    for (const report of evidence) {
        const reputation = await getReputation(report.reporterPublicKey);
        if (reputation < 500) {  // Must be GOLD tier+
            throw new Error('Reporter insufficient reputation');
        }
    }
    
    // Mark name as suspended
    await db.updateName(name, {
        status: 'suspended',
        suspensionReason: reason,
        suspensionDate: Date.now()
    });
    
    // Challenge system can still resolve ownership
    // But content not served until resolution
}

// Browser-level filtering
interface BrowserSafetyCheck {
    // Before loading content, check suspension status
    async beforeLoad(name: string): Promise<void> {
        const status = await checkSuspensionStatus(name);
        
        if (status.suspended) {
            showWarning({
                message: 'This site has been suspended',
                reason: status.reason,
                reports: status.reportCount,
                allowProceed: true  // User can override
            });
        }
    }
}
```

**Status:** NOT IMPLEMENTED - Community governance needed

---

### 10. 🟢 Eclipse Attack (Network Isolation)

**Threat:** Isolate node from legitimate network, show fake data

**Attack:**
```bash
# Control all peer connections to victim
# Show fake name registrations
# Victim thinks they own names they don't
```

**Impact:**
- Victim sees false reality
- Fake registrations
- Network confusion

**Mitigation:**
```typescript
// Diverse peer connections
class PeerDiversityManager {
    async ensureDiversity(): Promise<void> {
        const peers = await ipfs.swarm.peers();
        
        // Require peers from multiple ASNs
        const asns = new Set(peers.map(p => p.asn));
        if (asns.size < 5) {
            throw new Error('Insufficient peer diversity');
        }
        
        // Require geographic diversity
        const countries = new Set(peers.map(p => p.country));
        if (countries.size < 3) {
            throw new Error('Insufficient geographic diversity');
        }
        
        // Connect to known bootstrap nodes
        await this.connectBootstrap();
    }
    
    // Cross-verify critical data with multiple peers
    async crossVerify(name: string): Promise<NameRecord> {
        const results = await Promise.all([
            this.queryPeer(peer1, name),
            this.queryPeer(peer2, name),
            this.queryPeer(peer3, name)
        ]);
        
        // Require consensus (2 of 3 match)
        if (!this.hasConsensus(results)) {
            throw new Error('Peers disagree - possible eclipse attack');
        }
        
        return results[0];
    }
}
```

**Status:** IPFS handles most of this, additional checks recommended

---

## Priority Matrix

| Threat | Severity | Likelihood | Status | Priority |
|--------|----------|------------|--------|----------|
| Bot Mass Registration | CRITICAL | HIGH | ✅ FIXED | - |
| Challenge Spam | HIGH | HIGH | 🔴 NOT FIXED | **URGENT** |
| Database Exhaustion | HIGH | MEDIUM | 🔴 NOT FIXED | **URGENT** |
| DHT Poisoning | HIGH | MEDIUM | 🟡 PARTIAL | HIGH |
| Replay Attack | CRITICAL | MEDIUM | 🔴 NOT FIXED | **CRITICAL** |
| DNS Hijacking | MEDIUM | LOW | 🟡 PARTIAL | MEDIUM |
| Front-Running | MEDIUM | MEDIUM | 🔴 NOT FIXED | MEDIUM |
| Sybil Voting | HIGH | HIGH | 🟢 DESIGNED | Phase 2 |
| Content Bombing | MEDIUM | HIGH | 🔴 NOT FIXED | MEDIUM |
| Eclipse Attack | LOW | LOW | 🟡 PARTIAL | LOW |

---

## Implementation Checklist

### Before Launch (CRITICAL):

- [x] ✅ Bot registration prevention (PoW, bonds, rate limits)
- [ ] 🔴 Challenge spam prevention
- [ ] 🔴 Database storage limits and cleanup
- [ ] 🔴 Replay attack prevention (nonces)
- [ ] 🟡 DHT record caching
- [ ] 🟡 Signature verification on all DHT reads

### Phase 1 Hardening (HIGH):

- [ ] Front-running protection (commit-reveal)
- [ ] DNS transfer protection
- [ ] Content reporting system
- [ ] Monitoring and alerting

### Phase 2 (MEDIUM):

- [ ] Sybil-resistant voting
- [ ] Trust graph validation
- [ ] Community governance

---

## Testing Requirements

```typescript
// Security test suite
describe('Security Tests', () => {
    test('Prevent bot mass registration', async () => {
        // Try to register 100 names rapidly
        // Should be rate limited
    });
    
    test('Prevent replay attacks', async () => {
        // Capture and replay signature
        // Should be rejected
    });
    
    test('Prevent challenge spam', async () => {
        // Create 10 challenges rapidly
        // Should be rate limited
    });
    
    test('Verify all DHT records', async () => {
        // Insert fake DHT record
        // Should be rejected
    });
    
    test('Database storage limits', async () => {
        // Fill database to limit
        // Should reject new entries
    });
});
```

---

## Conclusion

**Critical issues identified:** 5  
**High priority issues:** 3  
**Medium priority issues:** 2  

**Before launch, must implement:**
1. Challenge spam prevention
2. Database limits and cleanup
3. Replay attack prevention
4. DHT caching and verification

**Estimated time:** 2-3 weeks additional security hardening

**Status:** Network NOT READY for public launch without these fixes
