# DNS Resolution in FRW Protocol

Technical specification for DNS TXT-based name resolution in FRW browser.

## Overview

FRW browser supports DNS TXT records as a resolution mechanism, allowing domains to map to FRW public keys while maintaining full cryptographic verification. This provides domain name convenience without sacrificing decentralization or security.

## DNS TXT Record Format

**Required format:**
```
frw-key=<base58-encoded-public-key>;frw-name=<optional-frw-name>
```

**Example:**
```
Type: TXT
Name: _frw or @
Value: frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite
TTL: 3600
```

**Field descriptions:**
- `frw-key`: Ed25519 public key (base58 encoded), required
- `frw-name`: Associated FRW name (optional, informational)

## Resolution Flow

### FRW Browser with Domain

```
User enters: frw://example.com/page.html

1. Parse URL
   └─> identifier: "example.com"
   └─> path: "/page.html"

2. Identify as domain
   └─> Contains dots
   └─> Matches domain pattern

3. Query DNS
   └─> DNS TXT query for example.com or _frw.example.com
   └─> Extract frw-key value from TXT record

4. Resolve to content
   └─> Public key from DNS
   └─> IPNS path: /ipns/<publickey>/page.html
   └─> Fetch from IPFS

5. Verify signature
   └─> Extract signature from content
   └─> Verify against public key
   └─> Display if valid, reject if invalid
```

## Security Model

### Trust Boundaries

**DNS role: Discovery only**
- Provides initial public key lookup
- Cannot modify content (IPFS content-addressed)
- Cannot forge signatures (no private key)
- Compromise affects discoverability, not authenticity

**Cryptographic verification: Content trust**
- All content verified against public key
- Signatures checked client-side
- IPFS ensures content integrity
- No trust in DNS for content validity

### Attack Scenarios

**DNS poisoning:**
- Attacker controls DNS response
- Can provide wrong public key
- Cannot sign content with wrong key
- Verification fails, content rejected
- User sees verification error

**Man-in-the-middle:**
- Cannot modify IPFS content (content-addressed)
- Cannot forge signatures without private key
- DNS provides public key only
- Content authenticity maintained

**DNS hijacking:**
- Domain ownership compromised
- TXT record changed to different key
- Old content still accessible via original key
- Users must verify domain ownership separately

### Security Properties Maintained

**Integrity:** Content hash verification via IPFS  
**Authenticity:** Signature verification via Ed25519  
**Non-repudiation:** Only private key holder can sign  
**Availability:** Distributed IPFS network  

**Not maintained:**
- Domain ownership verification (DNS trust required)
- Discovery reliability (DNS availability required)

## Implementation

### DNS Query Implementation

```typescript
import dns from 'dns/promises';

interface DNSResolutionResult {
    publicKey: string;
    frwName?: string;
    source: 'dns-root' | 'dns-frw';
}

async function resolveDomainToKey(domain: string): Promise<DNSResolutionResult | null> {
    // Try _frw subdomain first
    try {
        const records = await dns.resolveTxt(`_frw.${domain}`);
        const result = parseFRWRecord(records);
        if (result) {
            return { ...result, source: 'dns-frw' };
        }
    } catch {
        // _frw subdomain not found, continue
    }
    
    // Try root domain
    try {
        const records = await dns.resolveTxt(domain);
        const result = parseFRWRecord(records);
        if (result) {
            return { ...result, source: 'dns-root' };
        }
    } catch {
        // Root domain TXT not found
    }
    
    return null;
}

function parseFRWRecord(records: string[][]): { publicKey: string; frwName?: string } | null {
    const flatRecords = records.flat();
    const frwRecord = flatRecords.find(r => r.includes('frw-key='));
    
    if (!frwRecord) return null;
    
    const keyMatch = frwRecord.match(/frw-key=([^;]+)/);
    const nameMatch = frwRecord.match(/frw-name=([^;]+)/);
    
    if (!keyMatch) return null;
    
    return {
        publicKey: keyMatch[1],
        frwName: nameMatch ? nameMatch[1] : undefined
    };
}
```

### Caching Strategy

```typescript
interface CacheEntry {
    publicKey: string;
    source: 'cache' | 'dns' | 'dht';
    timestamp: number;
    ttl: number;
}

class NameCache {
    private cache: Map<string, CacheEntry> = new Map();
    
    get(identifier: string): string | null {
        const entry = this.cache.get(identifier);
        if (!entry) return null;
        
        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
            this.cache.delete(identifier);
            return null;
        }
        
        return entry.publicKey;
    }
    
    set(identifier: string, publicKey: string, source: 'dns' | 'dht', ttl: number = 3600000) {
        this.cache.set(identifier, {
            publicKey,
            source,
            timestamp: Date.now(),
            ttl
        });
    }
}
```

### Complete Resolution Function

```typescript
enum IdentifierType {
    PUBLIC_KEY,
    DOMAIN,
    FRW_NAME
}

function classifyIdentifier(identifier: string): IdentifierType {
    // Check if direct public key (base58, length > 40)
    if (/^[1-9A-HJ-NP-Za-km-z]{40,}$/.test(identifier)) {
        return IdentifierType.PUBLIC_KEY;
    }
    
    // Check if domain (contains dot and TLD)
    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(identifier)) {
        return IdentifierType.DOMAIN;
    }
    
    // Otherwise FRW name
    return IdentifierType.FRW_NAME;
}

async function resolveToPublicKey(identifier: string, cache: NameCache): Promise<string> {
    const type = classifyIdentifier(identifier);
    
    // Direct public key
    if (type === IdentifierType.PUBLIC_KEY) {
        return identifier;
    }
    
    // Check cache
    const cached = cache.get(identifier);
    if (cached) {
        return cached;
    }
    
    // Domain resolution
    if (type === IdentifierType.DOMAIN) {
        const dnsResult = await resolveDomainToKey(identifier);
        if (dnsResult) {
            cache.set(identifier, dnsResult.publicKey, 'dns');
            return dnsResult.publicKey;
        }
    }
    
    // DHT resolution for FRW names
    const dhtRecord = await queryDHT(identifier);
    if (!dhtRecord) {
        throw new Error(`Name not found: ${identifier}`);
    }
    
    if (!verifySignature(dhtRecord)) {
        throw new Error(`Invalid signature for: ${identifier}`);
    }
    
    cache.set(identifier, dhtRecord.publicKey, 'dht');
    return dhtRecord.publicKey;
}
```

## DNS Configuration Examples

### Cloudflare

```
Type: TXT
Name: _frw
Content: frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite
TTL: Auto
```

### AWS Route 53

```json
{
  "Name": "_frw.example.com",
  "Type": "TXT",
  "TTL": 3600,
  "ResourceRecords": [{
    "Value": "\"frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite\""
  }]
}
```

### Google Cloud DNS

```bash
gcloud dns record-sets create _frw.example.com \
  --type=TXT \
  --ttl=3600 \
  --rrdatas="frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite"
```

### Namecheap

```
Type: TXT Record
Host: _frw
Value: frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite
TTL: Automatic
```

## Verification Testing

### Command Line Test

```bash
# Query DNS TXT record
dig _frw.example.com TXT +short
# or
nslookup -type=TXT _frw.example.com

# Expected output:
"frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite"
```

### Browser Test

```javascript
// In FRW browser console
const result = await resolveToPublicKey('example.com', cache);
console.log('Public key:', result);
```

## Performance Considerations

### DNS Lookup Timing

- First lookup: 50-200ms (DNS query)
- Cached: <1ms (local cache)
- TTL: 3600 seconds typical

### Optimization Strategies

1. **Aggressive caching:** Cache DNS results with TTL
2. **Parallel resolution:** Query DNS and DHT simultaneously
3. **Prefetching:** Resolve on page load, not on link click
4. **Background refresh:** Update cache before TTL expiry

## Error Handling

```typescript
class ResolutionError extends Error {
    constructor(
        message: string,
        public identifier: string,
        public type: 'not_found' | 'invalid_format' | 'dns_error' | 'verification_failed'
    ) {
        super(message);
    }
}

async function safeResolve(identifier: string): Promise<string> {
    try {
        return await resolveToPublicKey(identifier, cache);
    } catch (error) {
        if (error instanceof ResolutionError) {
            // Log specific error type
            logResolutionFailure(error);
            
            // User-friendly error message
            throw new Error(`Cannot resolve ${identifier}: ${error.type}`);
        }
        throw error;
    }
}
```

## Best Practices

### For Domain Owners

1. Use `_frw` subdomain for TXT record (cleaner)
2. Set TTL to 3600 (1 hour) minimum
3. Include both frw-key and frw-name
4. Test resolution before announcing
5. Monitor DNS propagation
6. Keep backup of public key

### For FRW Browser Implementation

1. Implement resolution priority: cache → DNS → DHT
2. Validate DNS responses before caching
3. Log resolution source for debugging
4. Implement timeout on DNS queries
5. Fallback to DHT if DNS fails
6. Cache negative results briefly

### For Users

1. Verify domain ownership separately
2. Check signature verification status
3. Compare public key with known values
4. Report suspicious resolution failures
5. Use direct public key URLs for maximum security

## Limitations

### Not Provided

- **Domain ownership verification:** Users must verify separately
- **DNS security:** No DNSSEC enforcement (implementation-dependent)
- **Automatic updates:** Domain owner can change key silently
- **Revocation:** No mechanism to invalidate old keys

### Mitigations

- Display resolution source to user (DNS vs DHT)
- Show public key fingerprint in browser
- Allow pinning specific public keys
- Warn on public key changes
- Implement reputation system

## Comparison with Other Methods

| Aspect | DNS Resolution | DHT Resolution | Direct Key |
|--------|---------------|----------------|------------|
| Setup | Domain + TXT record | Name registration | None |
| Speed | 50-200ms | 100-500ms | 0ms |
| Decentralization | DNS-dependent | Fully decentralized | Fully decentralized |
| User Experience | Familiar domains | FRW-specific names | Unfriendly |
| Attack Surface | DNS compromise | DHT attacks | None |
| Censorship Resistance | Low | High | Highest |

## Migration Path

### From HTTP to FRW with DNS

```
1. Current: https://example.com (HTTP server)
2. Add: TXT record with frw-key
3. Transition: Users can access via frw://example.com
4. Promote: Educate users about native client
5. Maintain: Keep HTTP server for compatibility
```

## Conclusion

DNS TXT resolution provides familiar domain names in FRW browser while maintaining cryptographic verification. DNS serves discovery role only; content authenticity guaranteed via signatures. Suitable for corporate deployments and user adoption, not intended to replace DHT-based resolution.
