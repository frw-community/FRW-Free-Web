# FRW Developer Guide

## Architecture Overview

FRW consists of four main components:

1. **Protocol Layer** - URL resolution, content addressing
2. **Crypto Layer** - Ed25519 signatures
3. **Network Layer** - IPFS/libp2p transport
4. **Client Layer** - Electron application, sandbox

## Development Setup

```bash
git clone https://github.com/your-org/frw-free-web-modern.git
cd frw-free-web-modern
npm install
```

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage
```

### Starting Development Client

```bash
npm run dev
```

## Core Modules

### Crypto Module (`src/crypto/signatures.js`)

Handles Ed25519 cryptographic operations.

```javascript
import { SignatureManager } from './crypto/signatures.js';

// Generate keypair
const { publicKey, privateKey } = SignatureManager.generateKeyPair();

// Sign content
const signature = SignatureManager.sign(content, privateKey);

// Verify signature
const valid = SignatureManager.verify(content, signature, publicKey);

// Sign HTML page
const signedHTML = SignatureManager.signPage(html, privateKey);

// Verify HTML page
const isValid = SignatureManager.verifyPage(html, publicKey);
```

### IPFS Module (`src/ipfs/client.js`)

Manages IPFS operations.

```javascript
import { IPFSClient } from './ipfs/client.js';

const ipfs = new IPFSClient();
await ipfs.init();

// Add content
const cid = await ipfs.add(content);

// Get content
const data = await ipfs.get(cid);

// Publish to IPNS
const ipnsName = await ipfs.publishName(cid);

// Resolve IPNS
const resolvedCid = await ipfs.resolveName(ipnsName);
```

### Protocol Module (`src/protocol/resolver.js`)

Resolves FRW URLs to content.

```javascript
import { FRWResolver } from './protocol/resolver.js';

const resolver = new FRWResolver(ipfsClient);

// Resolve FRW URL
const { content, verified } = await resolver.resolve('frw://key/page.frw');

// Parse URL
const { publicKey, path } = FRWResolver.parseURL('frw://key/path');
```

## Extending FRW

### Adding New Content Types

1. Define MIME type mapping
2. Implement renderer
3. Add signature support
4. Update specification

Example:

```javascript
// In src/protocol/resolver.js
const MIME_TYPES = {
  '.frw': 'text/html',
  '.frw.js': 'application/javascript',
  '.frw.md': 'text/markdown',  // New type
};
```

### Custom Sandbox APIs

Expose safe APIs to sandboxed scripts:

```javascript
// In src/client/sandbox.js
const sandboxAPIs = {
  ipfs: {
    cat: async (cid) => {
      // Verify permission
      if (!hasPermission('ipfs:read')) {
        throw new Error('Permission denied');
      }
      return await ipfsClient.get(cid);
    }
  }
};
```

### Protocol Extensions

Add custom metadata fields:

```html
<meta name="frw-x-custom" content="value">
```

Parse in resolver:

```javascript
const customField = extractMetadata(html, 'frw-x-custom');
```

## Testing

### Unit Tests

```javascript
// tests/crypto.test.js
import { SignatureManager } from '../src/crypto/signatures.js';

describe('SignatureManager', () => {
  test('signs and verifies content', () => {
    const { publicKey, privateKey } = SignatureManager.generateKeyPair();
    const content = 'test';
    const sig = SignatureManager.sign(content, privateKey);
    expect(SignatureManager.verify(content, sig, publicKey)).toBe(true);
  });
});
```

### Integration Tests

```javascript
// tests/integration/publish.test.js
describe('Publishing workflow', () => {
  test('publish and retrieve content', async () => {
    const ipfs = new IPFSClient();
    await ipfs.init();
    
    const content = '<html>test</html>';
    const cid = await ipfs.add(content);
    const retrieved = await ipfs.get(cid);
    
    expect(retrieved.toString()).toBe(content);
  });
});
```

### Security Tests

```javascript
// tests/security/sandbox.test.js
describe('Sandbox security', () => {
  test('blocks filesystem access', () => {
    const code = `const fs = require('fs'); fs.readFileSync('/etc/passwd');`;
    expect(() => sandbox.run(code)).toThrow();
  });
});
```

## Performance Optimization

### Content Caching

```javascript
class CachedResolver extends FRWResolver {
  constructor(ipfs, cacheSize = 100) {
    super(ipfs);
    this.cache = new LRU(cacheSize);
  }
  
  async resolve(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    const result = await super.resolve(url);
    this.cache.set(url, result);
    return result;
  }
}
```

### Lazy Loading

```javascript
// Load scripts only when needed
async function loadScript(url) {
  const { content } = await resolver.resolve(url);
  sandbox.run(content);
}
```

### Parallel Fetching

```javascript
// Fetch multiple resources concurrently
const [page, style, script] = await Promise.all([
  resolver.resolve('frw://key/index.frw'),
  resolver.resolve('frw://key/style.css'),
  resolver.resolve('frw://key/script.frw.js')
]);
```

## Security Considerations

### Input Validation

```javascript
function parseURL(url) {
  if (!url.startsWith('frw://')) {
    throw new Error('Invalid protocol');
  }
  
  const parts = url.match(/^frw:\/\/([a-zA-Z0-9]+)(\/.*)?$/);
  if (!parts) {
    throw new Error('Invalid URL format');
  }
  
  return { publicKey: parts[1], path: parts[2] || '/index.frw' };
}
```

### Signature Verification

Always verify before executing:

```javascript
async function loadContent(url) {
  const { content, verified } = await resolver.resolve(url);
  
  if (!verified) {
    throw new Error('Signature verification failed');
  }
  
  return content;
}
```

### Sandbox Escape Prevention

```javascript
const vm = new VM({
  timeout: 5000,
  sandbox: scopedContext,
  eval: false,        // Disable eval
  wasm: false,        // Disable WebAssembly
  fixAsync: true      // Fix async holes
});
```

## Contributing

### Code Style

- ESLint configuration enforced
- Prettier for formatting
- JSDoc comments for public APIs

```javascript
/**
 * Resolve FRW URL to content
 * @param {string} url - FRW URL (frw://key/path)
 * @returns {Promise<{content: Buffer, verified: boolean}>}
 * @throws {Error} If URL invalid or content not found
 */
async resolve(url) {
  // Implementation
}
```

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Write tests
4. Update documentation
5. Submit PR

### Commit Messages

Format:
```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`

Example:
```
feat(crypto): add key rotation support

- Add rotateKey method
- Update tests
- Document in API reference
```

## Debugging

### Enable Debug Logging

```javascript
// Set environment variable
DEBUG=frw:* npm run dev

// Or in code
import debug from 'debug';
const log = debug('frw:resolver');
log('Resolving URL:', url);
```

### IPFS Debugging

```bash
# Check IPFS status
ipfs id

# View connected peers
ipfs swarm peers

# Check pinned content
ipfs pin ls
```

### Client Debugging

Open DevTools in Electron:
```javascript
// In main.js
mainWindow.webContents.openDevTools();
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Build all platforms
5. Tag release
6. Publish binaries

```bash
npm version patch
npm run test
npm run build
git push --tags
```
