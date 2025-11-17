# FRW PROTOCOL V2: STATE MACHINE

## STATE_MACHINE_V2

### REGISTRATION FLOW

```
UNINITIALIZED
  ↓ init_user_keys_pq()
KEYS_GENERATED
  ↓ register_name_pq()
POW_COMPUTING
  ↓ [PoW complete]
RECORD_SIGNING
  ↓ [Signatures generated]
PUBLISHING
  ↓ [DHT + Pubsub + Bootstrap]
REGISTERED
```

### RESOLUTION FLOW

```
RESOLVING
  ↓ [Check caches]
CACHE_HIT | CACHE_MISS
  ↓ [Query DHT/Bootstrap]
QUERYING_DHT | QUERYING_BOOTSTRAP
  ↓ [Record retrieved]
VERIFYING
  ↓ [Crypto verification]
RESOLVED | ERROR_VERIFICATION
```

### UPDATE FLOW

```
REGISTERED
  ↓ update_content_pq()
UPDATING
  ↓ [Compute new PoW]
POW_COMPUTING
  ↓ [Sign with incremented version]
RECORD_SIGNING
  ↓ [Publish with hash chain]
PUBLISHING
  ↓ [Complete]
REGISTERED
```

### TRANSITION FUNCTIONS

#### init_user_keys_pq()
```
Precondition: UNINITIALIZED
Action:
  - Generate Ed25519 + Dilithium3 keypairs
  - Derive DID from Dilithium3 pubkey hash
  - Store encrypted keys
Postcondition: KEYS_GENERATED
```

#### register_name_pq(name, contentCID, keyPair)
```
Precondition: KEYS_GENERATED
Action:
  - Validate name format
  - Compute Argon2id PoW
  - Create and sign record (hybrid sigs)
  - Publish to DHT, pubsub, bootstrap nodes
Postcondition: REGISTERED
```

#### resolve_name_pq(name)
```
Precondition: ANY (read-only)
Action:
  - Check L1/L2 caches
  - Query DHT if cache miss
  - Query bootstrap nodes if DHT fails
  - Verify all cryptographic proofs
  - Cache valid record
Postcondition: RESOLVED or null
```

#### verify_record_pq(record, previousRecord?)
```
Precondition: record exists
Action:
  - Verify PoW (Argon2id + SHA3)
  - Verify hybrid signatures
  - Verify hash chain if update
  - Check expiration
Return: VerificationResultV2
```

#### update_content_pq(name, newCID, keyPair)
```
Precondition: REGISTERED + ownership
Action:
  - Resolve current record
  - Verify ownership (DID match)
  - Compute new PoW
  - Increment recordVersion
  - Link previousHash_sha3
  - Sign and publish
Postcondition: REGISTERED
```

---

END OF STATE MACHINE
