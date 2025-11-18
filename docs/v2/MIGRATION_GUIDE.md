# V2 Migration Guide

Complete guide for upgrading from FRW V1 to V2 quantum-resistant protocol.

---

## Overview

This guide covers migrating existing V1 names to V2 while preserving all content and maintaining backward compatibility.

---

## Prerequisites

### Required
- Existing V1 name registration
- V1 private key (with password if encrypted)
- FRW CLI v1.0.1 or higher

### Recommended
- V2 identity already created (`frw init-v2`)
- Backup of V1 keys
- Understanding of V2 changes

---

## Migration Process

### Step 1: Backup V1 Keys

```bash
# Backup your V1 keys
cp ~/.frw/keys/default.json ~/.frw/keys/default.json.backup

# Verify backup
cat ~/.frw/keys/default.json.backup
```

### Step 2: Create V2 Identity (if needed)

```bash
frw init-v2
```

This creates:
- V2 keypair (Ed25519 + Dilithium3)
- DID (Decentralized Identifier)
- Password-protected key file

### Step 3: Migrate Name

```bash
frw migrate yourname
```

The migration process:
1. Loads your V1 keypair
2. Fetches V1 record from network
3. Preserves content CID and IPNS
4. Loads or generates V2 keypair
5. Generates V2 proof of work
6. Creates V2 record
7. Publishes to network
8. Saves migration record

### Step 4: Verify Migration

```bash
# Check via bootstrap API
curl http://localhost:3100/api/resolve/yourname

# Expected response:
{
  "version": 2,
  "name": "yourname",
  "did": "did:frw:v2:...",
  "pqSecure": true,
  ...
}
```

---

## Migration Options

### Use Specific Keys

```bash
# Migrate with custom key paths
frw migrate yourname \
  --v1-key ~/.frw/keys/old-key.json \
  --v2-key ~/.frw/keys/my-v2-key.json
```

### Force Re-migration

```bash
# Re-migrate already migrated name
frw migrate yourname --force
```

---

## What Gets Migrated

### Preserved
- ✅ Content CID
- ✅ IPNS key
- ✅ Name ownership
- ✅ Historical records

### Created New
- ✅ V2 keypair (Dilithium3 + Ed25519)
- ✅ V2 signatures
- ✅ V2 proof of work
- ✅ DID identifier
- ✅ V2 record

### Not Changed
- ✅ V1 record (remains active)
- ✅ V1 keys (still work)
- ✅ V1 clients (unaffected)

---

## Dual Operation

After migration, your name works in **both** V1 and V2:

### V1 Clients
- Continue using Ed25519 signatures
- Resolve via V1 bootstrap nodes
- No changes required

### V2 Clients
- Use Dilithium3 signatures
- Resolve via V2-enabled nodes
- Get quantum-resistant security

---

## Migration Scenarios

### Scenario 1: Single Name Migration

**Use Case**: You have one V1 name and want V2 protection

```bash
# Create V2 identity
frw init-v2

# Migrate your name
frw migrate myname

# Verify
curl http://localhost:3100/api/resolve/myname
```

### Scenario 2: Multiple Names

**Use Case**: Migrate multiple names to same V2 identity

```bash
# Create V2 identity once
frw init-v2

# Migrate each name
frw migrate name1
frw migrate name2
frw migrate name3
```

### Scenario 3: Different V2 Keys per Name

**Use Case**: Each name gets its own V2 identity

```bash
# Create first V2 identity
frw init-v2
mv ~/.frw/keys/default-v2.json ~/.frw/keys/name1-v2.json

# Migrate first name
frw migrate name1 --v2-key ~/.frw/keys/name1-v2.json

# Create second V2 identity
frw init-v2
mv ~/.frw/keys/default-v2.json ~/.frw/keys/name2-v2.json

# Migrate second name
frw migrate name2 --v2-key ~/.frw/keys/name2-v2.json
```

---

## Password Handling

### V1 Password Protected

If your V1 key is encrypted:

```bash
frw migrate myname
# Enter V1 key password: ****
# Enter V2 key password: ****
```

### V2 Password Protection

Set password when creating V2 identity:

```bash
frw init-v2
# Password-protect private key? Yes
# Enter password: ****
# Confirm password: ****
```

---

## Rollback

### V1 Still Works

V2 migration doesn't affect V1:
- V1 record remains active
- V1 clients continue working
- No rollback needed

### Remove V2 Record

To remove V2 record (V1 unaffected):

```bash
# V2 record can be removed from config
# V1 record continues functioning
# Edit ~/.frw/config.json and remove from v2Registrations
```

---

## Performance

### Migration Time

Typical migration times:
- 16+ character names: 1-2 minutes
- 11-15 characters: 2-5 minutes
- 8-10 characters: 10-15 minutes
- Shorter names: Longer (not recommended)

### Bottlenecks

- **PoW Generation**: Argon2id computation
- **Network**: Bootstrap node availability
- **Key Loading**: Password decryption

---

## Troubleshooting

### "V1 record not found"

```bash
# Verify V1 name is registered
frw list

# Check bootstrap nodes
curl http://localhost:3100/api/resolve/yourname
```

**Solution**: Ensure name is registered in V1 first.

### "Failed to load V1 keypair"

```bash
# Check V1 key exists
cat ~/.frw/keys/default.json

# Verify password correct
frw register yourname  # Test V1 key
```

**Solution**: Verify V1 key path and password.

### "V2 keypair not found"

```bash
# Create V2 identity
frw init-v2

# Verify created
cat ~/.frw/keys/default-v2.json
```

**Solution**: Run `frw init-v2` before migration.

### "PoW generation timeout"

**Cause**: Name too short, PoW takes very long.

**Solution**: Names 16+ characters migrate instantly. Shorter names take longer.

```bash
# For short names, be patient or use --force
frw migrate shortname
# This may take 10+ minutes for 8-10 character names
```

---

## Best Practices

### 1. Test First

```bash
# Create test V1 name
frw init
frw register test-migration-$(date +%s)

# Migrate test name
frw migrate test-migration-*

# Verify works
curl http://localhost:3100/api/resolve/test-migration-*
```

### 2. Backup Keys

```bash
# Backup V1 and V2 keys
cp -r ~/.frw/keys ~/.frw/keys.backup
```

### 3. Document DIDs

```bash
# Save your V2 DIDs
frw init-v2 | grep DID > ~/.frw/v2-dids.txt
```

### 4. Use Long Names

Names 16+ characters:
- Instant PoW generation
- Fast migration
- Lower computational cost

### 5. Migrate Gradually

Don't migrate all names at once:
- Test with one name first
- Verify V1 still works
- Monitor for issues
- Then migrate remaining names

---

## Migration Checklist

### Pre-Migration
- [ ] Backup V1 keys
- [ ] Create V2 identity
- [ ] Test with one name
- [ ] Verify bootstrap nodes accessible

### During Migration
- [ ] Run `frw migrate <name>`
- [ ] Provide passwords when prompted
- [ ] Wait for PoW generation
- [ ] Confirm publication success

### Post-Migration
- [ ] Verify V2 record via API
- [ ] Test V1 still works
- [ ] Save V2 DID
- [ ] Update documentation
- [ ] Monitor for issues

---

## Advanced Topics

### Programmatic Migration

```typescript
import { KeyManagerV2 } from '@frw/crypto-pq';
import { RecordManagerV2 } from '@frw/protocol-v2';
import { generatePOWV2 } from '@frw/pow-v2';

// Load V1 record
const v1Record = await registry.resolveName('myname');

// Generate V2 keypair
const keyManager = new KeyManagerV2();
const v2KeyPair = keyManager.generateKeyPair();

// Generate V2 PoW
const proof = await generatePOWV2('myname', v2KeyPair.publicKey_dilithium3);

// Create V2 record
const recordManager = new RecordManagerV2();
const v2Record = recordManager.createRecord(
  'myname',
  v1Record.record.contentCID,
  v1Record.record.ipnsKey,
  v2KeyPair,
  proof
);

// Publish
await registryV2.registerV2(v2Record);
```

### Batch Migration Script

```bash
#!/bin/bash
# migrate-all.sh

# Read names from file
while read name; do
  echo "Migrating $name..."
  frw migrate "$name"
  
  # Wait between migrations
  sleep 10
done < names.txt
```

---

## Security Considerations

### Key Storage

- V2 keys are larger (4032 bytes vs 64 bytes)
- Use strong passwords for encryption
- Store backups securely

### Network Security

- Migration publishes to public network
- V2 records are permanently on-chain
- Cannot delete V2 records once published

### Quantum Resistance

- V2 provides post-quantum security
- V1 remains vulnerable to future quantum attacks
- Migrate important names to V2 for long-term protection

---

## FAQ

**Q: Can I migrate back to V1?**  
A: V1 records remain active. No need to migrate back.

**Q: How long does migration take?**  
A: 1-15 minutes depending on name length.

**Q: Will my content change?**  
A: No, content CID is preserved exactly.

**Q: Do I need new keys?**  
A: V2 requires new quantum-resistant keys, but V1 keys still work.

**Q: Can I migrate multiple times?**  
A: Yes, use `--force` to re-migrate.

**Q: What if migration fails?**  
A: V1 record is unaffected. Retry migration.

---

## Support

For migration assistance:
- **Issues**: [GitHub Issues](https://github.com/frw-community/FRW-Free-Web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/frw-community/FRW-Free-Web/discussions)

---

*Last Updated: V2.0.0*
