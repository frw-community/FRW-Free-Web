# FRW Access Methods

Technical reference for accessing FRW content through different protocols and methods.

## Protocol Hierarchy

### 1. FRW Protocol (Primary)

**URL Format:** 
- `frw://name/path` - FRW name resolution
- `frw://domain.com/path` - DNS TXT resolution
- `frw://publickey/path` - Direct public key

**Architecture:**
```
Client → FRW Browser → Name Resolution → IPFS Network → Content Retrieval
         (Native)      (Cache/DNS/DHT)   (P2P)           (Verified)
```

**Characteristics:**
- Full decentralization at all layers
- Cryptographic signature verification
- Direct IPFS access via IPNS
- No gateway dependencies
- Censorship-resistant by design
- End-to-end encrypted transport

**Implementation:**
- Electron-based browser with custom protocol handler
- Ed25519 signature verification on all content
- Local name cache with DHT fallback
- IPFS HTTP client for content retrieval

**Configuration:**
```json
{
  "registeredNames": {
    "name": "publicKey"
  }
}
```

**Access Flow:**
1. Parse URL: `frw://identifier/path`
2. Resolve identifier to public key:
   - If direct public key format: use directly
   - If cached: retrieve from local cache
   - If domain (contains dots): query DNS TXT record
   - If FRW name: query DHT
3. Construct IPNS path: `/ipns/{publicKey}/path`
4. Fetch content from IPFS
5. Verify signature against public key
6. Render content if valid

**Security Properties:**
- Content authenticity via Ed25519 signatures
- Name ownership via keypair possession
- Transport security via IPFS encryption
- No trusted third parties required

### 2. HTTP Gateway (Secondary)

**URL Format:** `http://gateway:3000/frw/name/path`

**Architecture:**
```
Client → Browser → Gateway Server → Name Resolution → IPFS → Content
         (Any)     (Centralized)    (Gateway)         (P2P)
```

**Characteristics:**
- Partial decentralization (centralized gateway)
- Browser compatibility (no special client)
- Gateway-dependent verification
- HTTP transport security optional
- Single point of failure at gateway

**Implementation:**
- Node.js HTTP server
- Reads FRW configuration from volume
- Translates HTTP requests to IPFS paths
- Returns content with appropriate MIME types

**Configuration:**
```javascript
// Gateway resolves names from config
const config = JSON.parse(fs.readFileSync('/root/.frw/config.json'));
const publicKey = config.registeredNames[name];
const ipfsPath = `/ipns/${publicKey}${path}`;
```

**Access Flow:**
1. HTTP request: `GET /frw/name/path`
2. Extract name from URL path
3. Resolve name to public key (gateway config)
4. Fetch content from IPFS
5. Return with HTTP headers
6. Client verifies nothing (trust gateway)

**Security Considerations:**
- Gateway can modify content
- Gateway can log requests
- Gateway can censor content
- No cryptographic verification client-side
- Requires trust in gateway operator

**Use Cases:**
- Initial adoption phase
- Standard browser access
- Mobile device compatibility
- API integrations
- Development/testing

### 3. Custom Domain (Tertiary)

**URL Format:** `https://domain.com/path`

**Architecture:**
```
Client → Browser → DNS → Reverse Proxy → Gateway → IPFS → Content
         (Any)     (Central) (Central)    (Central) (P2P)
```

**Characteristics:**
- Minimal decentralization (multiple central points)
- Maximum familiarity for traditional web users
- Highest infrastructure requirements
- SSL/TLS encryption for transport
- DNS as trust anchor

**Implementation:**

DNS TXT record:
```
Type: TXT
Name: _frw
Value: frw-key=publicKey;frw-name=name
TTL: 3600
```

Nginx reverse proxy:
```nginx
server {
    listen 443 ssl;
    server_name domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

Gateway domain resolution:
```javascript
const domainMapping = config.domainMappings[host];
if (domainMapping && domainMapping.verified) {
    const name = domainMapping.frwName;
    // Resolve to content
}
```

**Access Flow:**
1. DNS query: `domain.com → IP`
2. TLS handshake with reverse proxy
3. HTTP request to gateway
4. Gateway checks domain mapping
5. Resolves domain to FRW name
6. Resolves name to public key
7. Fetches from IPFS
8. Returns content via reverse proxy

**Security Considerations:**
- DNS can be hijacked
- Certificate authority trust required
- Reverse proxy is single point of failure
- Gateway remains trust dependency
- Multiple attack surfaces
- Centralized at every layer except IPFS

**Use Cases:**
- Marketing and adoption
- Traditional web integration
- Business requirements for domains
- SEO considerations
- Non-technical user access

## Comparison Matrix

| Property | FRW (Name) | FRW (Domain) | HTTP Gateway | Custom Domain |
|----------|-----------|--------------|--------------|---------------|
| URL Format | `frw://name/` | `frw://domain.com/` | `http://gw/frw/name/` | `https://domain.com` |
| Decentralization | Full | Full | Partial | Minimal |
| Cryptographic Verification | Yes | Yes | No | No |
| Gateway Dependency | None | None | Required | Required |
| DNS Dependency | None | Yes (discovery) | None | Yes (routing) |
| DNS Trust Required | No | No | No | Yes |
| Client Requirements | FRW Browser | FRW Browser | Any Browser | Any Browser |
| Censorship Resistance | High | High | Low | Very Low |
| Setup Complexity | Low | Medium | Medium | High |
| Infrastructure Cost | None | Domain only | Low | Medium |
| Performance | Direct | Direct | 1 hop | 2+ hops |
| Attack Surface | Minimal | Small | Medium | Large |

## Technical Specifications

### FRW Protocol Handler

Protocol registration (Electron):
```javascript
protocol.registerHttpProtocol('frw', (request, callback) => {
    const url = request.url;
    // Parse and resolve
    const content = await resolveAndFetch(url);
    callback({ data: content });
});
```

### Gateway Implementation

Request handler:
```javascript
async function handleRequest(req, res) {
    const url = req.url;
    const host = req.headers.host;
    
    // Domain resolution
    if (host !== 'localhost') {
        const mapping = domainMappings[host];
        if (mapping) {
            return serveDomainContent(mapping, url, res);
        }
    }
    
    // FRW URL resolution
    if (url.startsWith('/frw/')) {
        const frwUrl = url.replace(/^\/frw\//, 'frw://');
        return serveFRWContent(frwUrl, res);
    }
    
    // IPFS direct
    if (url.startsWith('/ipfs/') || url.startsWith('/ipns/')) {
        return serveIPFSContent(url, res);
    }
}
```

### Name Resolution

Complete resolution chain:
```javascript
async function resolveIdentifier(identifier) {
    // 1. Direct public key
    if (isPublicKey(identifier)) {
        return identifier;
    }
    
    // 2. Check local cache
    const cached = cache.get(identifier);
    if (cached && !isExpired(cached)) {
        return cached.publicKey;
    }
    
    // 3. DNS TXT lookup for domains
    if (isDomain(identifier)) {
        const dnsKey = await queryDNSTXT(identifier);
        if (dnsKey) {
            cache.set(identifier, { publicKey: dnsKey });
            return dnsKey;
        }
    }
    
    // 4. Query DHT for FRW names
    const record = await dht.get(identifier);
    if (!record) {
        throw new Error('Name not found');
    }
    
    // 5. Verify signature
    if (!verifySignature(record)) {
        throw new Error('Invalid signature');
    }
    
    // Cache and return
    cache.set(identifier, record);
    return record.publicKey;
}

function isDomain(identifier) {
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(identifier);
}

function isPublicKey(identifier) {
    return identifier.length > 40 && /^[A-Za-z0-9]+$/.test(identifier);
}

async function queryDNSTXT(domain) {
    try {
        const records = await dns.resolveTxt(domain);
        const frwRecord = records.flat().find(r => r.includes('frw-key='));
        if (!frwRecord) return null;
        
        const match = frwRecord.match(/frw-key=([^;]+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}
```

## Deployment Recommendations

### Development
- Use FRW protocol for testing features
- Use HTTP gateway for cross-browser testing
- Skip domain setup unless specifically testing

### Staging
- Primary: FRW protocol
- Secondary: HTTP gateway for QA
- Optional: Test domain for integration testing

### Production
- Primary: FRW protocol (target end-state)
- Required: HTTP gateway (adoption bridge)
- Optional: Custom domains (business requirement)

## Migration Path

### Phase 1: HTTP Gateway Only
Users access via `http://gateway/frw/name/`

### Phase 2: Add Custom Domains
Marketing and business domains point to gateway

### Phase 3: Promote FRW Protocol
Educate users about native client benefits

### Phase 4: FRW Protocol Primary
Most users on native client, gateway maintained for compatibility

## Performance Characteristics

### FRW Protocol
- Latency: DHT lookup (100-500ms) + IPFS fetch
- Bandwidth: Direct P2P, no gateway overhead
- Scalability: Distributed, no central bottleneck

### HTTP Gateway
- Latency: Gateway processing + IPFS fetch
- Bandwidth: Gateway → Client, centralized
- Scalability: Limited by gateway capacity

### Custom Domain
- Latency: DNS + TLS + Proxy + Gateway + IPFS
- Bandwidth: Multiple hops, highest overhead
- Scalability: Limited by weakest link

## Monitoring and Operations

### FRW Protocol
Monitor: Local client errors, DHT connectivity, IPFS node health

### HTTP Gateway
Monitor: Request rate, response time, error rate, IPFS connectivity

### Custom Domain
Monitor: DNS resolution, TLS certificate validity, reverse proxy health, gateway availability

## Security Guidelines

### FRW Protocol
- Verify signatures on all content
- Validate public keys against trusted sources
- Keep local name cache updated
- Report suspicious signature failures

### HTTP Gateway
- Run behind TLS in production
- Implement rate limiting
- Log access for security analysis
- Restrict API port access

### Custom Domain
- Use DNSSEC if available
- Automate certificate renewal
- Implement DDoS protection
- Monitor for domain hijacking

## Conclusion

FRW protocol access provides full decentralization and cryptographic security. HTTP gateway and custom domains serve as adoption bridges with reduced security guarantees. Deploy all three methods based on user requirements and migration strategy, always emphasizing FRW protocol as the target state.
