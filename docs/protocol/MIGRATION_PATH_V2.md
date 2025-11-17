# FRW PROTOCOL V2: MIGRATION PATH

## MIGRATION_PATH

### MIGRATION_STRATEGY

```
Timeline:
  2025-Q1: V2 Launch (Hybrid Mode)
  2025-Q2: V2 Adoption Phase
  2026-Q1: V1 Deprecation Notice
  2030-Q1: V1 Sunset Warning
  2035-Q1: V2-Only Mode (V1 end-of-life)
```

### PHASE 1: COEXISTENCE (2025-2030)

#### Client Behavior

```typescript
// V2 Client (Hybrid Mode)
function resolve(name: string): Record {
  // Try V2 first
  const v2Record = await resolveV2(name);
  if (v2Record) {
    const verification = await verifyRecordV2(v2Record);
    if (verification.valid) {
      return {
        record: v2Record,
        version: 2,
        pqSecure: verification.pqSecure
      };
    }
  }
  
  // Fallback to V1
  const v1Record = await resolveV1(name);
  if (v1Record) {
    const verification = await verifyRecordV1(v1Record);
    if (verification.valid) {
      console.warn(`Name "${name}" using legacy V1 protocol`);
      return {
        record: v1Record,
        version: 1,
        pqSecure: false
      };
    }
  }
  
  return null;
}
```

#### Bootstrap Node Behavior

```typescript
// Bootstrap Node (Dual Support)
app.get('/api/resolve/:name', async (req, res) => {
  const name = req.params.name;
  
  // Check V2 index first
  const v2Record = await registry_v2.get(name);
  if (v2Record) {
    res.json({
      version: 2,
      record: v2Record,
      pqSecure: true
    });
    return;
  }
  
  // Fallback to V1 index
  const v1Record = await registry_v1.get(name);
  if (v1Record) {
    res.json({
      version: 1,
      record: v1Record,
      pqSecure: false,
      deprecated: true
    });
    return;
  }
  
  res.status(404).json({error: 'Name not found'});
});
```

### PHASE 2: MIGRATION (2025-2026)

#### User Migration Flow

```
Step 1: Generate V2 Keypair
  $ frw init-v2
  Generating quantum-resistant keypair...
  Ed25519 keypair: [generated]
  Dilithium3 keypair: [generated]
  DID: did:frw:v2:5FHnEj2kE7W9pxjXYzPx2YQJbpZxGvwDx
  
  Keypair saved to ~/.frw/keys-v2.json

Step 2: Register Name with V2
  $ frw register-v2 myname
  Computing quantum-resistant PoW (Argon2id)...
  Name: myname (6 chars)
  Difficulty: 9 leading zeros, 512 MiB, 4 iterations
  Estimated time: ~12 hours
  
  [████████████████████████████████] 100%
  PoW complete: 3,847,291 attempts
  
  Signing with hybrid signatures...
  Publishing to DHT...
  Submitting to bootstrap nodes...
  
  ✓ Name "myname" registered with V2 protocol
  ✓ Quantum-secure: YES
  ✓ CID: bafybei...

Step 3: Publish Content
  $ frw publish myname ./my-website
  Bundling website...
  Adding to IPFS...
  CID: bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
  
  Updating V2 record...
  Computing PoW for update...
  ✓ Content published
  
  Access: frw://myname

Step 4: Verify Migration
  $ frw verify myname
  Resolving "myname"...
  Protocol: V2
  Quantum-secure: YES ✓
  Signatures: Ed25519 + Dilithium3 ✓
  PoW: Valid ✓
  Hash chain: Valid ✓
  Expiration: 364 days ✓
```

#### Automated Migration Tool

```typescript
// packages/migration/src/migrate-v1-to-v2.ts

export async function migrateNameToV2(
  name: string,
  v1Keys: FRWKeyPair,
  contentCID: string
): Promise<MigrationResult> {
  console.log(`Migrating "${name}" from V1 to V2...`);
  
  // Step 1: Generate V2 keypair
  const v2Keys = generateKeyPairV2();
  console.log(`Generated V2 keypair: ${v2Keys.did}`);
  
  // Step 2: Compute PoW
  const difficulty = getRequiredDifficulty(name);
  console.log(`Computing PoW: ${difficulty.leading_zeros} zeros...`);
  
  const pow = await generatePOWV2(
    name,
    v2Keys.publicKey_dilithium3,
    (progress) => {
      console.log(`Progress: ${progress.attempts} attempts`);
    }
  );
  
  // Step 3: Create V2 record
  const v2Record = createRecordV2(
    name,
    contentCID,
    generateIPNSKey(),
    v2Keys,
    pow
  );
  
  // Step 4: Sign ownership proof
  // Prove ownership of V1 name by signing with V1 key
  const ownershipProof = signV1(
    `migrate:${name}:${v2Keys.did}`,
    v1Keys.privateKey
  );
  
  // Step 5: Publish V2 record
  await publishToRegistry(v2Record);
  
  // Step 6: Deprecate V1 record (mark as migrated)
  await deprecateV1Record(name, v2Keys.did, ownershipProof);
  
  return {
    success: true,
    name,
    v1Keys: exportKeyPairV1(v1Keys),
    v2Keys: exportKeyPairV2(v2Keys),
    v2Record,
    did: v2Keys.did
  };
}
```

### PHASE 3: DEPRECATION (2026-2030)

#### Deprecation Notices

```
Bootstrap Node Responses (V1):
{
  "version": 1,
  "record": {...},
  "deprecated": true,
  "deprecationNotice": "V1 protocol will be sunset in 2035. Please migrate to V2.",
  "migrationGuide": "https://frw.community/docs/migration",
  "v2_did": "did:frw:v2:..." // If migrated
}

Client Warnings:
⚠️  Warning: Name "example" uses deprecated V1 protocol
⚠️  V1 will be sunset on 2035-01-01
⚠️  Migrate now: frw migrate example
```

#### Automatic Migration Prompt

```typescript
// CLI Auto-Migration
if (record.version === 1 && !hasSeenWarning(name)) {
  console.warn('');
  console.warn('⚠️  DEPRECATION WARNING');
  console.warn(`   Name "${name}" uses V1 protocol`);
  console.warn('   V1 will be sunset in 2035');
  console.warn('');
  console.warn('   Migrate to V2 for quantum security:');
  console.warn(`   $ frw migrate ${name}`);
  console.warn('');
  
  markWarningShown(name);
}
```

### PHASE 4: SUNSET (2030-2035)

#### V1 End-of-Life Countdown

```
2030-Q1: Final warning, 5 years remaining
2031-Q1: Aggressive warnings, 4 years remaining
2032-Q1: V1 marked as insecure, 3 years remaining
2033-Q1: V1 registration disabled, 2 years remaining
2034-Q1: V1 resolution warnings, 1 year remaining
2035-Q1: V1 resolution disabled, V2-only mode
```

#### Bootstrap Node Sunset

```typescript
// 2033+: Disable V1 registration
app.post('/api/submit', async (req, res) => {
  const record = req.body;
  
  if (record.version === 1) {
    res.status(410).json({
      error: 'V1 registration disabled',
      reason: 'Protocol sunset in progress',
      sunsetDate: '2035-01-01',
      message: 'Please migrate to V2'
    });
    return;
  }
  
  // Process V2 record
  await processV2Record(record);
  res.json({success: true});
});

// 2035+: Disable V1 resolution
app.get('/api/resolve/:name', async (req, res) => {
  const name = req.params.name;
  const v2Record = await registry_v2.get(name);
  
  if (v2Record) {
    res.json(v2Record);
    return;
  }
  
  // V1 lookup disabled
  const v1Record = await registry_v1.get(name);
  if (v1Record) {
    res.status(410).json({
      error: 'V1 protocol sunset',
      reason: 'V1 no longer supported as of 2035-01-01',
      message: 'Name must be migrated to V2',
      migrationGuide: 'https://frw.community/docs/migration'
    });
    return;
  }
  
  res.status(404).json({error: 'Name not found'});
});
```

### PHASE 5: V2-ONLY (2035+)

#### Pure V2 Mode

```typescript
// Client Configuration
const config = {
  protocolVersion: 2,
  allowV1: false,  // Hard disable V1
  requirePQ: true,  // Require quantum-secure signatures
  legacyCutoff: new Date('2035-01-01')
};

// Resolution (V2-only)
async function resolve(name: string): Promise<RecordV2 | null> {
  const record = await resolveV2(name);
  
  if (!record) {
    return null;
  }
  
  // Strict V2 verification
  const verification = await verifyRecordV2(record);
  
  if (!verification.valid) {
    throw new ProtocolError('Invalid V2 record');
  }
  
  if (!verification.pqSecure) {
    throw new ProtocolError('Record not quantum-secure');
  }
  
  return record;
}
```

#### Legacy Support Removal

```
Code Removal Checklist:
  [ ] Remove V1 verification code
  [ ] Remove V1 record types
  [ ] Remove V1 PoW generator
  [ ] Remove Ed25519-only mode
  [ ] Remove SHA-256-only hashing
  [ ] Remove V1 serialization
  [ ] Remove V1 bootstrap API
  [ ] Remove migration tools (no longer needed)
  
Remaining:
  [✓] V2 full implementation
  [✓] Dilithium3 signatures
  [✓] SHA3-256 hashing
  [✓] Argon2id PoW
  [✓] CBOR serialization
  [✓] Hybrid mode (for key compromise)
```

### BACKWARD COMPATIBILITY TABLE

```
┌─────────┬──────────┬────────────┬────────────┐
│ Client  │ Bootstrap│ V1 Record  │ V2 Record  │
├─────────┼──────────┼────────────┼────────────┤
│ V1      │ V1       │ ✓ Accept   │ ✗ Reject   │
│ V1      │ V2       │ ✓ Accept   │ ✗ Reject   │
│ V2 (2025)│ V1      │ ⚠ Accept   │ ✓ Accept   │
│ V2 (2025)│ V2      │ ⚠ Accept   │ ✓ Accept   │
│ V2 (2035)│ V1      │ ✗ Reject   │ ✓ Accept   │
│ V2 (2035)│ V2      │ ✗ Reject   │ ✓ Accept   │
└─────────┴──────────┴────────────┴────────────┘

Legend:
  ✓ Fully supported
  ⚠ Supported with deprecation warning
  ✗ Not supported
```

### MIGRATION CHECKLIST

#### For Users

```
[ ] Backup V1 keys
[ ] Install V2-compatible client (frw-cli@2.0+)
[ ] Generate V2 keypair: frw init-v2
[ ] For each owned name:
    [ ] Run: frw migrate <name>
    [ ] Verify: frw verify <name>
    [ ] Test access: frw://name
[ ] Update documentation/links
[ ] Notify users of new DID
[ ] Monitor migration status
```

#### For Developers

```
[ ] Update FRW client library to V2
[ ] Add V2 verification to application
[ ] Test with both V1 and V2 records
[ ] Implement fallback logic
[ ] Add deprecation warnings
[ ] Update documentation
[ ] Plan for V2-only mode (2035)
```

#### For Bootstrap Node Operators

```
[ ] Deploy V2 bootstrap node software
[ ] Run dual V1/V2 indexes (2025-2035)
[ ] Monitor migration progress
[ ] Send deprecation notices
[ ] Plan V1 sunset timeline
[ ] Update API documentation
[ ] Test V2 verification
[ ] Prepare for V2-only mode
```

### ROLLBACK PLAN

```
Scenario: Critical V2 vulnerability discovered

Step 1: Immediate Response
  - Announce vulnerability
  - Pause V2 registrations
  - Continue V1 support

Step 2: Fix Deployment
  - Develop patch
  - Test extensively
  - Deploy V2.1 with fix

Step 3: Resume Migration
  - Resume V2 registrations
  - Extended timeline if needed
  - Communicate to users

Fallback: If unfixable
  - Revert to V1-only
  - Research alternative PQ schemes
  - Design V3 protocol
```

### MIGRATION METRICS

```
Track:
  - V2 adoption rate (% of names)
  - V2 bootstrap node coverage
  - V2 client deployment
  - Migration tool usage
  - User feedback
  - Performance metrics
  - Security incidents

Target (2030):
  - 80%+ names migrated to V2
  - 100% bootstrap nodes V2-capable
  - 90%+ clients V2-capable
```

### SUPPORT RESOURCES

```
Documentation:
  - Migration guide: /docs/migration
  - V2 specification: /docs/protocol/v2
  - API reference: /docs/api/v2
  - FAQ: /docs/faq/migration

Tools:
  - Migration CLI: frw migrate
  - Verification tool: frw verify
  - Key converter: frw convert-keys
  - Batch migrator: frw migrate-batch

Community:
  - Forum: https://community.frw.network
  - Discord: https://discord.gg/frw
  - GitHub: https://github.com/frw/protocol-v2
```

---

END OF MIGRATION PATH
