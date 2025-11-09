# FRW Protocol Specification v1.0

## Abstract

FRW is a decentralized communication protocol for creating a parallel web based on IPFS transport, Ed25519 authentication, and sandboxed JavaScript execution.

## Protocol Stack

```
Application:  HTML/CSS/JS
Protocol:     FRW (routing, signatures, sandbox)
Discovery:    IPNS/OrbitDB/DHT
Transport:    IPFS/libp2p
```

## URL Format

```
frw://<public-key>/<resource-path>

Examples:
frw://9ac8f22a4b1c/index.frw
frw://alice/blog/post.frw
frw://bob/assets/script.frw.js
```

## Content Format

### HTML Pages (.frw)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Page Title</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@public-key">
  <meta name="frw-date" content="2025-11-08T22:30:00Z">
  <meta name="frw-signature" content="ed25519-sig-base64">
</head>
<body>
  <h1>Content</h1>
  <a href="frw://other-key/page.frw">Link</a>
  <script src="frw://key/script.frw.js"></script>
</body>
</html>
```

### JavaScript Files (.frw.js)

```javascript
/**
 * @frw-version 1.0
 * @frw-author @public-key
 * @frw-date 2025-11-08T22:30:00Z
 * @frw-signature ed25519-sig-base64
 */
// Code
```

## Signatures

All content signed with Ed25519:

1. Canonicalize content (remove signature metadata)
2. Hash with SHA-256
3. Sign with private key
4. Embed signature in metadata
5. Distribute via IPFS

Verification:
1. Extract signature from metadata
2. Remove signature from content
3. Hash content
4. Verify signature with public key
5. Accept/reject content

## JavaScript Sandbox

Execution rules:
- No filesystem access
- No network access (except IPFS via API)
- No process execution
- DOM manipulation allowed
- localStorage restricted to origin
- No eval/Function constructor
- Permissions requested explicitly

Implementation: vm2 (Node.js) or Deno sandbox

## Discovery Mechanisms

### IPNS
- Maps public key to current IPFS CID
- Updated by author
- Cached by nodes

### OrbitDB
- Distributed database for registries
- Webring memberships
- Directory entries

### DHT
- Content discovery
- Peer discovery
- Bootstrap nodes

## Security Model

### Threat Model
- Malicious scripts
- Content tampering
- Identity spoofing
- Network surveillance
- DDoS attacks

### Mitigations
- Signature verification (tampering, spoofing)
- Sandbox execution (malicious scripts)
- P2P distribution (DDoS resistance)
- No centralized tracking (surveillance)

## Wire Protocol

### Content Request
```
GET frw://key/resource
→ Resolve key via IPNS
→ Retrieve CID from IPFS
→ Verify signature
→ Return content
```

### Content Publish
```
POST content
→ Sign with private key
→ Add to IPFS (get CID)
→ Update IPNS record
→ Propagate to DHT
```

## Error Handling

| Error | Code | Description |
|-------|------|-------------|
| InvalidSignature | 401 | Signature verification failed |
| ContentNotFound | 404 | CID not available |
| KeyNotResolved | 404 | Public key not in IPNS |
| SandboxViolation | 403 | Script exceeded permissions |
| MalformedContent | 400 | Invalid FRW format |

## Versioning

Protocol version in metadata. Breaking changes increment major version. Clients must support version negotiation.

## Extension Points

- Custom metadata fields (frw-x-*)
- MIME type registration
- Plugin system for clients
- Custom discovery mechanisms
