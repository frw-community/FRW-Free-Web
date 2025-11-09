# FRW Monorepo Migration Guide

## Structure Changes

### Old Structure (POC)
```
src/
  crypto/signatures.js
  ipfs/client.js
  protocol/resolver.js
  cli/index.js
  client/main.js
```

### New Structure (Production)
```
packages/              # Publishable npm packages
  common/             # @frw/common
  crypto/             # @frw/crypto
  ipfs/               # @frw/ipfs
  protocol/           # @frw/protocol
  sandbox/            # @frw/sandbox
  storage/            # @frw/storage

apps/                 # Applications
  client/             # Desktop browser
  cli/                # CLI tool
```

## Installation

```bash
# Install all dependencies
npm install

# Bootstrap monorepo (build all packages)
npm run bootstrap
```

## Development

```bash
# Watch all packages
npm run dev

# Work on specific package
npm run dev --workspace=@frw/protocol

# Run client
npm run dev --workspace=apps/client

# Run CLI
npm run dev:cli
```

## Testing

```bash
# Run all tests
npm test

# Test specific package
npm test --workspace=@frw/crypto

# E2E tests
npm run test:e2e
```

## Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@frw/protocol
```

## Package Dependencies

**@frw/common** (base layer)
- No dependencies
- Provides: errors, types, utilities

**@frw/crypto**
- Depends on: @frw/common
- Provides: signatures, key management

**@frw/ipfs**
- Depends on: @frw/common
- Provides: IPFS client, storage, discovery

**@frw/protocol**
- Depends on: @frw/common, @frw/crypto, @frw/ipfs
- Provides: URL resolution, validation

**@frw/sandbox**
- Depends on: @frw/common
- Provides: secure JS execution

**@frw/storage**
- Depends on: @frw/common
- Provides: local database, cache

**apps/client**
- Depends on: all @frw/* packages
- Electron-based browser

**apps/cli**
- Depends on: @frw/protocol, @frw/crypto, @frw/ipfs
- Command-line tool

## Import Changes

### Before
```javascript
import { SignatureManager } from '../crypto/signatures.js';
import { IPFSClient } from '../ipfs/client.js';
```

### After
```javascript
import { SignatureManager } from '@frw/crypto';
import { IPFSClient } from '@frw/ipfs';
```

## Publishing Packages

```bash
# Version all changed packages
npm run version

# Publish to npm
npm run publish
```

## Workspace Commands

```bash
# Add dependency to specific package
npm install package-name --workspace=@frw/protocol

# Run script in workspace
npm run test --workspace=@frw/crypto

# List all workspaces
npm ls --workspaces
```

## Benefits

1. **Modularity** - Each package has clear responsibility
2. **Independent Versioning** - Packages version separately
3. **Reusability** - Packages publishable to npm
4. **Testing** - Isolated unit tests per package
5. **Build Optimization** - Build only changed packages
6. **Type Safety** - Better TypeScript integration
7. **Documentation** - API docs per package
8. **Maintainability** - Clear boundaries

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm run bootstrap` to build all packages
3. Run `npm test` to verify everything works
4. Start developing with `npm run dev`
