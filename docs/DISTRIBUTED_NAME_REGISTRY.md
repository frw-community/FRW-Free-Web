# Distributed Name Registry - Technical Specification

**Status:** Implementation Required  
**Priority:** Critical for Launch  
**Timeline:** 2 days (Sunday-Monday)

---

## Problem Statement

**Current state:** Name resolution is local-only. User A registers `pouet`, but User B cannot resolve `frw://pouet/`.

**Required state:** Global, decentralized name resolution. Anyone can register a name and anyone can resolve it.

---

## Architecture

### Two-Layer System

1. **DHT (Primary)** - Distributed Hash Table via IPFS
   - Fast, decentralized, no central authority
   - Direct key-value storage across IPFS network
   - Used for name → publicKey resolution

2. **IPNS Registry (Fallback)** - Backup registry
   - Single IPNS key maintained by community
   - JSON file with all names
   - Used if DHT fails or for batch queries

---

## Data Structure

### DHT Record Format

```typescript
interface NameRecord {
  name: string;                    // e.g., "pouet"
  publicKey: string;               // Base58 encoded Ed25519 public key
  ipnsKey: string;                 // IPNS key for content
  timestamp: number;               // Unix timestamp
  signature: string;               // Signature of (name + publicKey + timestamp)
  proof: ProofOfWork;              // PoW to prevent spam
}
```

### DHT Key Format

```
/frw/name/<name>
```

Example:
```
/frw/name/pouet → NameRecord JSON
```

### IPNS Registry Format

```typescript
interface Registry {
  version: number;                 // Schema version
  updated: number;                 // Last update timestamp
  names: {
    [name: string]: {
      publicKey: string;
      ipnsKey: string;
      registered: number;
      lastUpdate: number;
    }
  }
}
```

---

## Implementation Plan

### Part 1: DHT Publishing (CLI)

**File:** `packages/ipfs/src/dht.ts` (new)

```typescript
export class DHTNameRegistry {
  constructor(private ipfs: IPFSClient);

  /**
   * Publish a name record to DHT
   */
  async publishName(record: NameRecord): Promise<void> {
    const key = `/frw/name/${record.name}`;
    const value = JSON.stringify(record);
    
    // Publish to DHT
    await this.ipfs.dht.put(
      Buffer.from(key),
      Buffer.from(value)
    );
    
    // Also announce to network
    await this.ipfs.dht.provide(
      Buffer.from(key)
    );
  }

  /**
   * Resolve a name from DHT
   */
  async resolveName(name: string): Promise<NameRecord | null> {
    const key = `/frw/name/${name}`;
    
    try {
      const result = await this.ipfs.dht.get(
        Buffer.from(key),
        { timeout: 5000 } // 5s timeout
      );
      
      const record = JSON.parse(result.value.toString());
      
      // Verify signature
      if (!this.verifyRecord(record)) {
        throw new Error('Invalid signature');
      }
      
      return record;
    } catch (error) {
      return null; // Not found or timeout
    }
  }

  /**
   * Verify record signature
   */
  private verifyRecord(record: NameRecord): boolean {
    const message = `${record.name}:${record.publicKey}:${record.timestamp}`;
    return SignatureManager.verify(
      message,
      record.signature,
      record.publicKey
    );
  }
}
```

**Update:** `apps/cli/src/commands/register.ts`

```typescript
// After successful PoW and signature
const record: NameRecord = {
  name,
  publicKey: keypair.publicKey,
  ipnsKey: ipnsKey,
  timestamp: Date.now(),
  signature: signature,
  proof: proof
};

// Publish to DHT
const dht = new DHTNameRegistry(ipfs);
await dht.publishName(record);

console.log('✓ Published to IPFS DHT (global)');
```

---

### Part 2: DHT Resolution (Browser)

**File:** `packages/protocol/src/resolver.ts` (new)

```typescript
export class NameResolver {
  constructor(
    private ipfs: IPFSClient,
    private dht: DHTNameRegistry,
    private cache: Map<string, NameRecord> = new Map()
  ) {}

  /**
   * Resolve frw://name/ to content
   */
  async resolve(url: string): Promise<ResolvedContent> {
    const parsed = FRWUrl.parse(url);
    
    // If already a public key, skip resolution
    if (this.isPublicKey(parsed.name)) {
      return this.fetchByPublicKey(parsed.name, parsed.path);
    }
    
    // Resolve name → publicKey
    const record = await this.resolveName(parsed.name);
    
    if (!record) {
      throw new Error(`Name "${parsed.name}" not found`);
    }
    
    // Fetch content
    return this.fetchByPublicKey(record.publicKey, parsed.path);
  }

  /**
   * Resolve name to NameRecord
   */
  private async resolveName(name: string): Promise<NameRecord | null> {
    // 1. Check cache (1 hour TTL)
    const cached = this.cache.get(name);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached;
    }
    
    // 2. Try DHT (primary)
    try {
      const record = await this.dht.resolveName(name);
      if (record) {
        this.cache.set(name, record);
        return record;
      }
    } catch (error) {
      console.warn('DHT resolution failed:', error);
    }
    
    // 3. Try IPNS registry (fallback)
    try {
      const record = await this.resolveFromIPNSRegistry(name);
      if (record) {
        this.cache.set(name, record);
        return record;
      }
    } catch (error) {
      console.warn('IPNS registry resolution failed:', error);
    }
    
    return null;
  }

  /**
   * Fallback: resolve from IPNS registry
   */
  private async resolveFromIPNSRegistry(name: string): Promise<NameRecord | null> {
    // Hardcoded IPNS key of central registry
    const REGISTRY_IPNS = 'k51qzi5uqu5dl...'; // TODO: Set actual key
    
    const registry = await this.ipfs.name.resolve(REGISTRY_IPNS);
    const content = await this.ipfs.cat(registry);
    const data = JSON.parse(content.toString());
    
    const entry = data.names[name];
    if (!entry) return null;
    
    return {
      name,
      publicKey: entry.publicKey,
      ipnsKey: entry.ipnsKey,
      timestamp: entry.registered,
      signature: '', // Registry doesn't store individual signatures
      proof: {} as ProofOfWork
    };
  }
}
```

**Update:** `apps/browser/src/protocol/handler.ts`

```typescript
// Replace local config lookup with DHT resolution
const resolver = new NameResolver(ipfs, dht);
const content = await resolver.resolve(request.url);
```

---

### Part 3: IPNS Registry Manager

**File:** `packages/name-registry/src/ipns-registry.ts` (new)

```typescript
export class IPNSRegistryManager {
  private registryKey: string;
  
  constructor(
    private ipfs: IPFSClient,
    private keypair: KeyPair // Admin keypair for registry
  ) {
    this.registryKey = this.keypair.publicKey;
  }

  /**
   * Add name to IPNS registry
   */
  async addName(name: string, record: NameRecord): Promise<void> {
    // 1. Download current registry
    const registry = await this.downloadRegistry();
    
    // 2. Add new name
    registry.names[name] = {
      publicKey: record.publicKey,
      ipnsKey: record.ipnsKey,
      registered: record.timestamp,
      lastUpdate: Date.now()
    };
    
    registry.updated = Date.now();
    
    // 3. Upload to IPFS
    const content = JSON.stringify(registry, null, 2);
    const result = await this.ipfs.add(content);
    
    // 4. Publish to IPNS
    await this.ipfs.name.publish(result.cid, {
      key: this.keypair.privateKey
    });
    
    console.log(`Registry updated: ${result.cid}`);
  }

  /**
   * Download current registry
   */
  private async downloadRegistry(): Promise<Registry> {
    try {
      const resolved = await this.ipfs.name.resolve(this.registryKey);
      const content = await this.ipfs.cat(resolved);
      return JSON.parse(content.toString());
    } catch (error) {
      // First time - create new registry
      return {
        version: 1,
        updated: Date.now(),
        names: {}
      };
    }
  }
}
```

---

## Testing Plan

### Test 1: Single Machine

```bash
# Terminal 1: IPFS daemon
ipfs daemon

# Terminal 2: Register name
frw register testname
frw publish ./site

# Terminal 3: New browser instance (clear cache)
# Navigate to frw://testname/
# Should resolve and load content
```

### Test 2: Two Machines (Real Test)

**Machine A (Your PC):**
```bash
frw register pouet
frw publish ./site
```

**Machine B (Different PC/VM):**
```bash
# Fresh install, no local config
npm install -g @frw/cli
# Launch browser
frw-browser
# Navigate to frw://pouet/
# Should resolve via DHT!
```

### Test 3: DHT Propagation Time

```bash
# Measure time for name to propagate
time1 = register_name()
time2 = other_machine_resolves_name()
propagation_time = time2 - time1

# Target: < 10 seconds
# Acceptable: < 30 seconds
```

---

## Performance Considerations

### DHT Query Time

- **First query:** ~2-5 seconds (DHT lookup)
- **Cached:** <100ms (memory cache)
- **Fallback IPNS:** ~5-10 seconds

### Optimization

1. **Aggressive caching** (1 hour TTL)
2. **Parallel queries** (DHT + IPNS simultaneously)
3. **Preloading** common names at startup
4. **Local cache** persisted to disk

---

## Security Considerations

### Preventing Attacks

1. **Signature verification** - Every record must be signed by the public key it claims
2. **PoW requirement** - Spam prevention
3. **Timestamp validation** - Reject old records
4. **DHT security** - IPFS DHT has built-in Sybil resistance

### Name Conflicts

**First-come-first-served:**
- Earliest timestamp wins
- Signature proves ownership
- Cannot overwrite without private key

---

## Migration Plan

### Step 1: Implement DHT (Sunday)
- Create `dht.ts`
- Update `register` command
- Test publishing

### Step 2: Implement Resolution (Monday)
- Create `resolver.ts`
- Update browser protocol handler
- Test resolution

### Step 3: IPNS Fallback (Monday)
- Create `ipns-registry.ts`
- Setup registry key
- Test fallback

### Step 4: Integration Testing (Tuesday)
- Two machine test
- Performance testing
- Edge case testing

### Step 5: Documentation (Wednesday)
- Update README
- Create DISTRIBUTED_NAMES.md
- Update launch posts

### Step 6: Launch (Thursday)
- With fully functional distributed names! [LAUNCH]

---

## Success Criteria

[OK] User A registers `pouet` on Machine A  
[OK] User B can resolve `frw://pouet/` on Machine B  
[OK] Resolution time < 30 seconds  
[OK] No central server required  
[OK] Works with >2 IPFS peers connected  

---

## Fallback Plan

If DHT doesn't work reliably by Tuesday:
- Use IPNS-only (single registry)
- Document as "temporary centralization"
- DHT comes in next release

But let's make DHT work! [STRONG]

---

## Next Steps (NOW)

1. Create `packages/ipfs/src/dht.ts`
2. Implement `DHTNameRegistry` class
3. Update `apps/cli/src/commands/register.ts`
4. Test publishing to DHT
5. Verify can query DHT from different terminal

**Let's start coding!**
