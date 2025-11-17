# FRW PROTOCOL V2: QUANTUM-RESISTANT SPECIFICATION

## SPEC_V2

### PROTOCOL_VERSION
```
Version: 2.0
Status: QUANTUM-RESISTANT
Effective: 2025-Q1
Backward Compatible: YES (until 2035-01-01)
```

### THREAT_MODEL
```
Adversary Capabilities:
- Shor-capable: O(n³) quantum factorization
- Grover-capable: O(√n) quantum search
- SHA-256 collision: 2⁶⁴ operations (Grover)
- Ed25519 break: Polynomial time (Shor)
- Network visibility: Complete
- Bootstrap node spoofing: Arbitrary
- DHT poisoning: Byzantine (f < n/3)
```

### SECURITY_REQUIREMENTS
```
1. Name ownership: Unforgeable under quantum adversary
2. Content integrity: Collision-resistant under Grover
3. PoW: Memory-hard, ASIC-resistant, Grover-resistant
4. Bootstrap trust: Minimum (cryptographic verification only)
5. DHT consistency: Byzantine fault tolerant
6. Replay protection: Timestamp + nonce + hash chain
7. Downgrade attack: Cryptographically prevented
```

### CRYPTOGRAPHIC_PRIMITIVES

#### Signature Schemes (Hybrid)
```
Primary: Dilithium3 (NIST PQC Standard, ML-DSA)
  - Public key: 1952 bytes
  - Signature: 3293 bytes
  - Security: NIST Level 3 (≈AES-192)
  - Resistant: Shor's algorithm

Fallback: Falcon-512
  - Public key: 897 bytes
  - Signature: 666 bytes (avg)
  - Security: NIST Level 1 (≈AES-128)
  - Resistant: Shor's algorithm

Legacy Support: Ed25519 (until 2035-01-01)
  - Public key: 32 bytes
  - Signature: 64 bytes
  - Security: Classical only

Hybrid Mode (Default):
  sig_v2 = Ed25519(msg) || Dilithium3(msg)
  Valid ⟺ Ed25519_verify(sig_ed, msg, pk_ed) ∧ Dilithium3_verify(sig_pq, msg, pk_pq)
  
PQ-Only Mode (2035+):
  sig_v2 = Dilithium3(msg)
  Valid ⟺ Dilithium3_verify(sig_pq, msg, pk_pq)
```

#### Hash Functions (Hybrid)
```
Primary: SHA3-256 (Keccak, NIST FIPS 202)
  - Output: 256 bits
  - Security: 128-bit quantum (Grover)
  - Collision resistance: 2¹²⁸ quantum ops

Fallback: BLAKE3
  - Output: 256 bits
  - Security: 128-bit quantum
  - Performance: 3x faster than SHA3

Legacy Support: SHA-256 (until 2035-01-01)
  - Output: 256 bits
  - Security: 128-bit quantum (Grover)

Hybrid Mode (Default):
  hash_v2(x) = SHA-256(x) || SHA3-256(x)
  Collision ⟹ collision in SHA-256 ∧ collision in SHA3-256
  
PQ-Only Mode (2035+):
  hash_v2(x) = SHA3-256(x)
```

#### Key Derivation
```
Function: Argon2id
Parameters:
  - Memory: 64 MiB (65536 KiB)
  - Iterations: 3
  - Parallelism: 4
  - Output: 32 bytes
  
Quantum Resistance:
  - Memory-hard: Grover speedup limited to O(√n) with O(n) memory
  - Time-memory tradeoff: Exponential (Alwen-Blocki 2016)
```

### POW_V2_SPECIFICATION

#### Algorithm: Argon2id-SHA3
```
Input:
  - name: string
  - publicKey_pq: bytes
  - nonce: uint64
  - timestamp: uint64

Output:
  - proof: {nonce, timestamp, hash, difficulty, memory_cost, time_cost}

Computation:
  salt = SHA3-256(name || publicKey_pq)
  challenge = Argon2id(
    password = nonce || timestamp,
    salt = salt,
    memory = difficulty_to_memory(name),
    iterations = difficulty_to_iterations(name),
    parallelism = 4,
    output_length = 32
  )
  hash = SHA3-256(challenge)

Verification:
  Valid ⟺ hash starts with difficulty_to_zeros(name) zeros
```

#### Difficulty Function
```
D(name) = {memory_MiB, iterations, leading_zeros}

mapping:
  len(name) == 1: {8192, 10, 16}  // ~1000 years
  len(name) == 2: {8192, 10, 15}  // ~62 years
  len(name) == 3: {4096, 8, 13}   // ~2 years
  len(name) == 4: {2048, 6, 11}   // ~2 months
  len(name) == 5: {1024, 5, 10}   // ~5 days
  len(name) == 6: {512, 4, 9}     // ~12 hours
  len(name) == 7: {256, 3, 8}     // ~90 minutes
  len(name) == 8: {128, 3, 7}     // ~6 minutes
  len(name) == 9-10: {64, 3, 6}   // ~22 seconds
  len(name) == 11-15: {32, 2, 5}  // ~1 second
  len(name) >= 16: {16, 1, 0}     // instant

Grover Resistance:
  Classical time: T_classical = 2^(4×zeros) × memory × iterations
  Quantum time: T_quantum = 2^(2×zeros) × √(memory × iterations)
  Memory requirement prevents full Grover speedup
```

#### Verification Rules
```
1. Recompute: proof_hash = POW_v2(name, pubkey, nonce, timestamp)
2. Check: proof_hash == declared_hash
3. Check: leading_zeros(proof_hash) >= required_difficulty(name)
4. Check: memory_cost >= required_memory(name)
5. Check: time_cost >= required_iterations(name)
6. Check: age(proof) < 1 hour
7. Check: timestamp > 2025-01-01 (no pre-computation)
```

### RECORD_FORMAT_V2

#### DistributedNameRecordV2
```typescript
interface DistributedNameRecordV2 {
  // Protocol
  version: 2;
  
  // Identity
  name: string;
  publicKey_ed25519: Uint8Array;      // 32 bytes (legacy)
  publicKey_dilithium3: Uint8Array;   // 1952 bytes
  did: string;                         // did:frw:v2:<pq_key_hash>
  
  // Content
  contentCID: string;
  ipnsKey: string;
  
  // Metadata
  recordVersion: number;
  registered: number;
  expires: number;
  
  // Cryptography (Hybrid)
  signature_ed25519: Uint8Array;       // 64 bytes (legacy)
  signature_dilithium3: Uint8Array;    // 3293 bytes
  hash_sha256: Uint8Array;             // 32 bytes (legacy)
  hash_sha3: Uint8Array;               // 32 bytes
  
  // Proof of Work (Quantum-Resistant)
  proof_v2: {
    nonce: bigint;
    timestamp: number;
    hash: Uint8Array;                  // SHA3-256
    difficulty: number;
    memory_cost_mib: number;
    time_cost: number;
  };
  
  // Chain
  previousHash_sha3: Uint8Array | null;  // 32 bytes
  
  // Discovery
  providers: string[];
  dnslink?: string;
}
```

#### Canonical Serialization
```
Deterministic encoding for signatures:
  canonical = CBOR_encode({
    version: 2,
    name: string,
    publicKey_dilithium3: bytes,
    contentCID: string,
    recordVersion: uint,
    registered: uint,
    expires: uint,
    previousHash_sha3: bytes | null
  })

Signature input:
  message = SHA3-256(canonical)
  
Hybrid signature:
  sig_ed = Ed25519_sign(message, sk_ed)
  sig_pq = Dilithium3_sign(message, sk_pq)
```

#### Hash Chain
```
Genesis record:
  previousHash_sha3 = null
  
Update record:
  previousHash_sha3 = SHA3-256(canonical(previous_record))
  
Verification:
  Follow chain from current to genesis
  Verify each link: hash(record_i) == record_{i+1}.previousHash
```

### STATE_MACHINE_V2

#### States
```
UNINITIALIZED
  ↓ init_user_keys_pq
KEYS_GENERATED
  ↓ register_name_pq
POW_COMPUTING
  ↓ pow_complete
RECORD_SIGNING
  ↓ signatures_complete
PUBLISHING
  ↓ dht_confirmed
REGISTERED
  ↓ update_content_pq
UPDATING
  ↓ dht_confirmed
REGISTERED

Resolve states:
RESOLVING
  ↓ cache_hit
RESOLVED
  ↓ cache_miss + dht_query
QUERYING_DHT
  ↓ dht_response
VERIFYING_SIGNATURES
  ↓ signatures_valid
RESOLVED
```

#### Transitions
```
init_user_keys_pq():
  Precondition: state == UNINITIALIZED
  Action:
    sk_ed, pk_ed ← Ed25519.keygen()
    sk_pq, pk_pq ← Dilithium3.keygen()
    did ← "did:frw:v2:" + base58(SHA3-256(pk_pq))
    store_secure(sk_ed, sk_pq)
  Postcondition: state == KEYS_GENERATED

register_name_pq(name, contentCID):
  Precondition: state == KEYS_GENERATED
  Action:
    difficulty ← get_difficulty(name)
    proof ← compute_pow_v2(name, pk_pq, difficulty)
    record ← create_record(name, pk_pq, contentCID, proof)
    sig_ed ← Ed25519_sign(canonical(record), sk_ed)
    sig_pq ← Dilithium3_sign(canonical(record), sk_pq)
    record.signature_ed25519 ← sig_ed
    record.signature_dilithium3 ← sig_pq
    publish_to_dht(record)
    broadcast_pubsub(record)
  Postcondition: state == REGISTERED

resolve_name_pq(name):
  Precondition: always
  Action:
    if cache.has(name):
      record ← cache.get(name)
      return verify_record(record)
    record ← query_dht(name)
    if record == null:
      record ← query_bootstrap(name)
    if record != null:
      verify_pow_v2(record.proof_v2)
      verify_hybrid_signature(record)
      cache.set(name, record)
      return record
    return null
  Postcondition: state unchanged

verify_domain_pq(record):
  Precondition: record != null
  Action:
    canonical ← serialize(record)
    message ← SHA3-256(canonical)
    
    // Verify hybrid signature
    if year < 2035:
      valid_ed ← Ed25519_verify(record.sig_ed, message, record.pk_ed)
      valid_pq ← Dilithium3_verify(record.sig_pq, message, record.pk_pq)
      valid ← valid_ed AND valid_pq
    else:
      valid ← Dilithium3_verify(record.sig_pq, message, record.pk_pq)
    
    // Verify PoW
    valid ← valid AND verify_pow_v2(record.proof_v2)
    
    // Verify hash chain
    if record.previousHash_sha3 != null:
      prev ← fetch_previous_record(record.name, record.recordVersion - 1)
      valid ← valid AND (SHA3-256(canonical(prev)) == record.previousHash_sha3)
    
    return valid
  Postcondition: returns boolean
```

### RESOLUTION_PROTOCOL_V2

#### Multi-Layer Resolution
```
resolve_name(name) → record:
  
  Layer 1: L1 Cache (in-memory, 5 min TTL)
    if L1_cache.has(name) AND not_expired:
      record ← L1_cache.get(name)
      verify_pq_signatures(record)
      return record
  
  Layer 2: L2 Cache (disk, 1 hour TTL)
    if L2_cache.has(name) AND not_expired:
      record ← L2_cache.get(name)
      verify_pq_signatures(record)
      promote_to_L1(record)
      return record
  
  Layer 3: Local IPFS (DHT query)
    dht_key ← "/frw/names/v2/" + name
    for event in ipfs.dht.get(dht_key):
      if event.name == "VALUE":
        record ← parse_record_v2(event.value)
        if verify_record_pq(record):
          cache_record(record)
          return record
  
  Layer 4: Bootstrap Nodes (parallel HTTP)
    results ← parallel_map(bootstrap_nodes, λ node:
      response ← http_get(node + "/api/resolve/" + name)
      if response.ok:
        record ← parse_record_v2(response.body)
        if verify_record_pq(record):
          return record
      return null
    )
    record ← first_valid(results)
    if record != null:
      cache_record(record)
      publish_to_dht(record)  // seed DHT
      return record
  
  Layer 5: Pubsub Long-Poll (real-time)
    subscribe("frw/names/v2/" + name)
    wait_timeout(10_seconds)
    if message_received:
      record ← parse_record_v2(message)
      if verify_record_pq(record):
        cache_record(record)
        return record
  
  return null
```

#### Bootstrap Node Verification
```
verify_bootstrap_response(response, name):
  record ← parse_record_v2(response)
  
  // Independent verification (zero trust)
  1. verify_pow_v2(record.proof_v2)
  2. verify_hybrid_signature(record)
  3. verify_hash_chain(record)
  4. verify_expiration(record)
  5. verify_name_match(record.name, name)
  
  // Quorum verification (Byzantine resistance)
  quorum_size ← ceil(2/3 × bootstrap_nodes.length)
  matching_records ← 0
  for node in bootstrap_nodes:
    other_record ← query_node(node, name)
    if records_equivalent(record, other_record):
      matching_records++
  
  return matching_records >= quorum_size
```

### BOOTSTRAP_NODE_V2_API

```
GET /api/resolve/:name
  Response: DistributedNameRecordV2 (JSON)
  Verification: Client MUST verify all cryptographic proofs
  
POST /api/submit
  Body: DistributedNameRecordV2
  Verification: Server MUST verify:
    - PoW (Argon2id-based)
    - Hybrid signatures
    - Hash chain
    - Expiration
  Response: {accepted: boolean, reason?: string}

GET /api/index/cid
  Response: {cid: string, version: number, timestamp: number}
  Description: Latest global index CID

GET /health
  Response: {status: "ok", version: 2, pq_enabled: true}
```

### PUBSUB_PROTOCOL_V2

```
Topics:
  - frw/names/v2/updates
  - frw/names/v2/index_updates

Message Format:
{
  type: "register" | "update" | "revoke",
  name: string,
  record: DistributedNameRecordV2,
  timestamp: number,
  publisher_did: string,
  signature_pq: Uint8Array
}

Verification (Byzantine Resistance):
  1. Verify message signature (Dilithium3)
  2. Verify record PoW (Argon2id)
  3. Verify record hybrid signatures
  4. Check timestamp freshness (< 1 hour old)
  5. Verify publisher_did matches record.did
  6. Rate limit: max 10 updates per name per hour
```

### VERSION_NEGOTIATION

```
Handshake:
  Client → Bootstrap: GET /api/version
  Bootstrap → Client: {version: 2, legacy_support: true, cutoff: "2035-01-01"}

Record Compatibility:
  - V2 clients MUST verify V1 records if present
  - V1 clients MUST reject V2 records (unknown version)
  - Hybrid mode: Both V1 and V2 records coexist until 2035

Resolution Strategy:
  resolve(name):
    v2_record ← resolve_v2(name)
    v1_record ← resolve_v1(name)
    
    if v2_record AND v1_record:
      if v2_record.registered >= v1_record.registered:
        return v2_record
      else:
        return v1_record
    else if v2_record:
      return v2_record
    else:
      return v1_record
```

### SECURITY_ANALYSIS

#### Threat Resistance

```
1. Quantum Signature Forgery
   Attack: Shor's algorithm on Ed25519
   Defense: Dilithium3 signature (lattice-based, Shor-resistant)
   Complexity: 2^128 classical, >2^128 quantum

2. Quantum Hash Collision
   Attack: Grover on SHA-256
   Defense: SHA3-256 with 256-bit output
   Complexity: 2^128 quantum operations

3. Quantum PoW Break
   Attack: Grover on Argon2id
   Defense: Memory-hardness limits Grover to √speedup
   Complexity: 2^(2×zeros) × √(memory×iterations)

4. Bootstrap Node Compromise
   Attack: Malicious nodes return forged records
   Defense: Client-side cryptographic verification + quorum
   Resistance: Byzantine fault tolerant (< 1/3 malicious)

5. DHT Poisoning
   Attack: Inject invalid records into DHT
   Defense: PoW + signature verification at every node
   Resistance: Computational cost = PoW difficulty

6. Replay Attack
   Attack: Re-broadcast old valid records
   Defense: Timestamp verification + hash chain
   Resistance: Records expire after 1 year + chain validation

7. Downgrade Attack
   Attack: Force client to use V1 (quantum-vulnerable)
   Defense: Version pinning + explicit V2 requirement flag
   Resistance: Client enforces minimum version policy
```

#### Formal Security Properties

```
Property 1: Unforgeability
  ∀ adversary A, ∀ name, contentCID:
    Pr[A.forge(name, contentCID) succeeds] ≤ negl(λ)
  where λ = security parameter (128 bits quantum)

Property 2: Collision Resistance
  ∀ adversary A:
    Pr[A.find_collision(hash_v2) succeeds] ≤ 2^(-128)

Property 3: PoW Completeness
  ∀ name, difficulty:
    ∃ nonce: verify_pow_v2(compute_pow_v2(name, nonce, difficulty)) = true

Property 4: PoW Soundness
  ∀ name, nonce, invalid_proof:
    verify_pow_v2(invalid_proof) = false

Property 5: Byzantine Consensus
  ∀ bootstrap_quorum Q where |Q| = n, |malicious| < n/3:
    resolve_name(name) returns correct record OR null

Property 6: Forward Security
  compromise(sk_ed_old) ∧ secure(sk_pq) ⟹ records_remain_valid
  (V2 records valid even if Ed25519 keys compromised)
```

### PERFORMANCE_TARGETS

```
Operation Latencies (V2):
  - Key generation: < 500 ms
  - Sign (hybrid): < 100 ms
  - Verify (hybrid): < 50 ms
  - PoW (8-char name): < 6 minutes
  - Resolution (cached): < 1 ms
  - Resolution (DHT): < 2 seconds
  - Resolution (bootstrap): < 200 ms

Size Overhead (V2 vs V1):
  - Public key: +1920 bytes (32 → 1984 total)
  - Signature: +3229 bytes (64 → 3357 total)
  - Record size: +5150 bytes total
  - Bandwidth: 5KB → 10KB per record

Storage Requirements:
  - Keypair: ~4 KB (Ed25519 + Dilithium3)
  - Record: ~10 KB (with PQ signatures)
  - Index (10k names): ~100 MB

Computational Costs:
  - Dilithium3 keygen: ~2M cycles
  - Dilithium3 sign: ~5M cycles
  - Dilithium3 verify: ~2M cycles
  - Argon2id PoW: Configurable (name-dependent)
```

### COMPATIBILITY_MATRIX

```
Client V1 → Bootstrap V1: ✓ Full support
Client V1 → Bootstrap V2: ✓ Legacy mode
Client V2 → Bootstrap V1: ✓ Fallback mode
Client V2 → Bootstrap V2: ✓ Full PQ support

Record V1 readable by V2: ✓ Yes (with warning)
Record V2 readable by V1: ✗ No (unknown version)

Migration path:
  2025: V2 launch, hybrid mode
  2030: V2 default, V1 deprecated
  2035: V2 only, V1 sunset
```

### IMPLEMENTATION_REQUIREMENTS

```
Required Dependencies:
  - @noble/post-quantum (Dilithium3, Falcon)
  - @noble/hashes (SHA3, BLAKE3)
  - argon2 (Argon2id)
  - multiformats (CBOR, CID)

Minimum System Requirements:
  - RAM: 256 MB (for Argon2id PoW)
  - CPU: 2 cores (for parallel Argon2id)
  - Storage: 1 GB (for IPFS + cache)

Browser Compatibility:
  - Chrome 90+ (WebAssembly, Crypto API)
  - Firefox 88+ (WebAssembly)
  - Safari 14+ (WebAssembly)
  - Node.js 18+ (native crypto)
```
