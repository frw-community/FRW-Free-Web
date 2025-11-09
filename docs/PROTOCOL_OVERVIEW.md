# FRW Protocol Overview

Technical overview of the Free Web Modern protocol architecture and implementation.

## Protocol Design

### Objectives

1. Decentralized content publishing without central authorities
2. Cryptographic verification of content authenticity
3. Human-readable naming system
4. Censorship-resistant content distribution
5. Compatibility bridge for traditional web access

### Core Components

**Content Layer:** IPFS for distributed storage and content addressing  
**Identity Layer:** Ed25519 keypairs for content signing and ownership  
**Naming Layer:** DHT-based registry for human-readable names  
**Transport Layer:** IPFS networking with libp2p  
**Verification Layer:** Signature verification on all content retrieval

## Architecture

### Publishing Flow

```
1. Content Creation
   └─> HTML/CSS/JS files prepared by user

2. Signature Generation
   └─> Ed25519 private key signs content hash
   └─> Signature embedded in HTML meta tags

3. IPFS Publication
   └─> Files added to IPFS
   └─> CID (Content Identifier) generated
   └─> IPNS record created with CID

4. Name Registration
   └─> Name mapped to public key
   └─> Record signed and published to DHT
   └─> Local cache updated
```

### Retrieval Flow

```
1. URL Parsing
   └─> frw://name/path extracted

2. Name Resolution
   └─> Query local cache for name → public key mapping
   └─> If cache miss, query DHT
   └─> Verify signature on name record

3. Content Resolution
   └─> IPNS lookup: public key → current CID
   └─> IPFS fetch: CID + path → content

4. Verification
   └─> Extract signature from content metadata
   └─> Verify signature against public key
   └─> Reject if verification fails

5. Rendering
   └─> Display content in browser
   └─> Show verification status to user
```

## Protocol Layers

### Layer 1: Storage (IPFS)

**Purpose:** Content-addressable storage and peer-to-peer distribution

**Implementation:**
- Files stored in IPFS as DAG (Directed Acyclic Graph)
- Content identified by cryptographic hash (CID)
- Distributed across network of peers
- Automatic deduplication of identical content

**Operations:**
- `ipfs.add()` - Add content to IPFS
- `ipfs.cat()` - Retrieve content by CID
- `ipfs.pin()` - Ensure content persistence

### Layer 2: Identity (IPNS)

**Purpose:** Mutable references to immutable content

**Implementation:**
- Each identity has Ed25519 keypair
- Public key becomes IPNS name
- Private key signs updates to IPNS record
- IPNS record points to current CID

**Operations:**
- `ipfs.name.publish()` - Update IPNS record
- `ipfs.name.resolve()` - Resolve IPNS to CID

### Layer 3: Naming (DHT Registry)

**Purpose:** Human-readable names mapped to public keys

**Implementation:**
- Distributed hash table stores name records
- Each record: `{name, publicKey, signature, timestamp}`
- Signature proves ownership of name
- First-come-first-served registration

**Operations:**
- `dht.put(name, record)` - Register name
- `dht.get(name)` - Resolve name to public key

### Layer 4: Verification (Signatures)

**Purpose:** Cryptographic proof of content authenticity

**Implementation:**
- Ed25519 signature algorithm
- Content hash signed with private key
- Signature embedded in HTML meta tags
- Verification performed on content retrieval

**Format:**
```html
<meta name="frw-signature" content="base64-encoded-signature">
<meta name="frw-public-key" content="base64-encoded-public-key">
<meta name="frw-date" content="ISO-8601-timestamp">
```

## URL Scheme

### Syntax

```
frw://[name]/[path]
frw://[public-key]/[path]
```

### Examples

```
frw://alice/                    # Root of alice's site
frw://alice/blog/post.html      # Specific page
frw://12D3KooW.../index.html    # Direct public key access
```

### Resolution

```javascript
function parseFRWURL(url) {
    const match = url.match(/^frw:\/\/([^\/]+)(\/.*)?$/);
    const identifier = match[1];  // name or public key
    const path = match[2] || '/';
    
    // Determine if identifier is name or key
    const isPublicKey = identifier.length > 40;
    
    if (isPublicKey) {
        return { publicKey: identifier, path };
    } else {
        const publicKey = await resolveName(identifier);
        return { publicKey, path };
    }
}
```

## Security Model

### Threat Model

**Protected Against:**
- Content tampering (cryptographic signatures)
- Identity impersonation (keypair ownership)
- Name hijacking (signature verification)
- Censorship (distributed storage)

**Not Protected Against:**
- Key compromise (user responsibility)
- Social engineering (out of scope)
- Client-side vulnerabilities (browser security)
- Network-level attacks (relies on IPFS security)

### Trust Model

**Trusted:**
- Cryptographic primitives (Ed25519, SHA-256)
- IPFS content addressing
- User's own keypair management

**Not Trusted:**
- DHT nodes (verify all responses)
- IPFS peers (content hash verified)
- Gateways (only for convenience, not security)
- DNS (only for traditional web bridge)

### Key Management

**Private Key Security:**
- Stored encrypted with user password
- Never transmitted over network
- Required for signing and name registration
- User responsible for backup and protection

**Public Key Distribution:**
- Published in name registry
- Embedded in content metadata
- Distributed via DHT
- No central directory required

## Gateway Bridge

### Purpose

Enable access to FRW content from standard browsers without requiring FRW client.

### Architecture

```
Standard Browser → HTTP Gateway → FRW Protocol → IPFS Network
```

### Implementation

HTTP server that:
1. Accepts HTTP requests
2. Translates to FRW protocol operations
3. Fetches content from IPFS
4. Returns as HTTP response

### Limitations

- Centralized trust in gateway operator
- No client-side verification
- Gateway can modify/censor content
- Single point of failure

### Use Case

Adoption bridge during transition period, not intended as permanent solution.

## DNS Integration

### Purpose

Allow traditional domain names to point to FRW content.

### Mechanism

DNS TXT record contains:
```
frw-key=<public-key>;frw-name=<frw-name>
```

Gateway resolves domain → FRW name → content.

### Trust Implications

- Adds DNS as trust dependency
- Domain owner can change mapping
- Certificate authority trust required for HTTPS
- Reduces decentralization benefits

### Use Case

Business requirement for branded domains, marketing purposes.

## Performance Characteristics

### Latency

**Name Resolution:** 100-500ms (DHT lookup + verification)  
**Content Resolution:** 100-2000ms (IPNS lookup + IPFS fetch)  
**Total First Access:** 200-2500ms  
**Cached Access:** <100ms (local name cache)

### Bandwidth

**Publishing:** Upload content size to IPFS  
**Retrieval:** Download content size from peers  
**Overhead:** Minimal (signatures, metadata)

### Scalability

**Content:** Scales with IPFS network  
**Names:** Scales with DHT capacity  
**Verification:** Client-side, no bottleneck

## Protocol Evolution

### Version 1.0 (Current)

- Basic FRW protocol implementation
- Ed25519 signatures
- Manual name registration
- Local name cache
- HTTP gateway bridge

### Future Versions

**Version 1.1:**
- Automated DHT name registry
- Name expiration and renewal
- Multi-signature support

**Version 2.0:**
- Enhanced verification (content + metadata)
- Encrypted content support
- Improved caching strategies
- Mobile client protocol optimizations

## Comparison with Other Protocols

### vs. IPFS

FRW adds human-readable names and cryptographic signing on top of IPFS content addressing.

### vs. ENS

FRW uses DHT instead of blockchain, reducing cost and complexity while maintaining decentralization.

### vs. HTTP/HTTPS

FRW eliminates central servers and DNS dependencies for true decentralization.

### vs. Tor

FRW focuses on content authenticity and availability rather than anonymity.

## Implementation Requirements

### Client Requirements

- IPFS node (Kubo) for storage operations
- Ed25519 library for signature operations
- DHT client for name resolution
- Protocol handler for frw:// URLs

### Publisher Requirements

- Ed25519 keypair generation
- Content signing capability
- IPFS publishing capability
- Name registration to DHT

### Gateway Requirements

- HTTP server
- IPFS client
- FRW name resolution
- Content caching (optional)

## Conclusion

FRW protocol provides decentralized content publishing with cryptographic verification and human-readable naming. The protocol balances decentralization principles with practical adoption requirements through gateway and DNS bridges. Primary access method remains native FRW protocol for maximum security and decentralization benefits.
