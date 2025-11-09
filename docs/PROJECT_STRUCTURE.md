# FRW - Production-Ready Architecture

## Monorepo Structure

```
frw-free-web-modern/
├── packages/                      # Core libraries (publishable)
│   ├── protocol/                  # @frw/protocol
│   │   ├── src/
│   │   │   ├── parser.js         # URL parsing
│   │   │   ├── resolver.js       # Content resolution
│   │   │   ├── validator.js      # Content validation
│   │   │   └── index.js
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── crypto/                    # @frw/crypto
│   │   ├── src/
│   │   │   ├── signatures.js     # Ed25519 operations
│   │   │   ├── keys.js           # Key management
│   │   │   ├── encryption.js     # Optional encryption
│   │   │   └── index.js
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── ipfs/                      # @frw/ipfs
│   │   ├── src/
│   │   │   ├── client.js         # IPFS client wrapper
│   │   │   ├── storage.js        # Content storage
│   │   │   ├── discovery.js      # DHT/IPNS
│   │   │   └── index.js
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── sandbox/                   # @frw/sandbox
│   │   ├── src/
│   │   │   ├── vm.js             # VM execution
│   │   │   ├── permissions.js    # Permission system
│   │   │   ├── api.js            # Exposed APIs
│   │   │   └── index.js
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── storage/                   # @frw/storage
│   │   ├── src/
│   │   │   ├── database.js       # SQLite wrapper
│   │   │   ├── cache.js          # Content cache
│   │   │   ├── history.js        # Browsing history
│   │   │   └── index.js
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── common/                    # @frw/common
│       ├── src/
│       │   ├── types.js          # TypeScript types/JSDoc
│       │   ├── errors.js         # Custom errors
│       │   ├── utils.js          # Shared utilities
│       │   └── index.js
│       ├── tests/
│       └── package.json
│
├── apps/                          # Applications
│   ├── client/                    # Desktop browser
│   │   ├── src/
│   │   │   ├── main/             # Electron main process
│   │   │   │   ├── main.js
│   │   │   │   ├── protocol.js   # Protocol handler
│   │   │   │   ├── ipc.js        # IPC handlers
│   │   │   │   └── menu.js
│   │   │   ├── renderer/         # UI
│   │   │   │   ├── index.html
│   │   │   │   ├── app.js
│   │   │   │   ├── components/
│   │   │   │   └── styles/
│   │   │   └── preload/
│   │   │       └── preload.js
│   │   ├── tests/
│   │   ├── assets/
│   │   └── package.json
│   │
│   ├── cli/                       # CLI tool
│   │   ├── src/
│   │   │   ├── index.js          # Entry point
│   │   │   ├── commands/
│   │   │   │   ├── init.js
│   │   │   │   ├── publish.js
│   │   │   │   ├── verify.js
│   │   │   │   └── serve.js
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── gateway/                   # HTTP gateway (optional)
│       ├── src/
│       │   ├── server.js
│       │   ├── routes/
│       │   └── middleware/
│       ├── tests/
│       └── package.json
│
├── tools/                         # Development tools
│   ├── builder/                   # Build scripts
│   ├── generator/                 # Code generators
│   └── scripts/                   # Utility scripts
│
├── docs/                          # Documentation
│   ├── protocol/
│   │   ├── specification.md
│   │   ├── extensions.md
│   │   └── changelog.md
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── security.md
│   │   └── performance.md
│   ├── guides/
│   │   ├── user-guide.md
│   │   ├── developer-guide.md
│   │   └── quickstart.md
│   └── api/
│       ├── protocol.md
│       ├── crypto.md
│       └── ipfs.md
│
├── examples/                      # Example implementations
│   ├── basic-site/
│   ├── blog/
│   ├── forum/
│   └── webring/
│
├── tests/                         # Integration tests
│   ├── e2e/
│   ├── integration/
│   └── fixtures/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── release.yml
│   │   └── publish.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── package.json                   # Root package (workspace)
├── lerna.json                     # Monorepo management
├── tsconfig.json                  # TypeScript config
├── jest.config.js                 # Test config
├── .eslintrc.js                   # Lint config
├── .prettierrc                    # Format config
├── LICENSE
├── README.md
├── CONTRIBUTING.md
└── CODE_OF_CONDUCT.md
```

## Package Dependencies

```
@frw/common (base)
    ↓
@frw/crypto, @frw/ipfs, @frw/storage
    ↓
@frw/protocol, @frw/sandbox
    ↓
apps/client, apps/cli
```

## Technology Stack

### Core
- Node.js 20+ (LTS)
- TypeScript (gradual migration)
- ESM modules

### Monorepo Management
- npm workspaces
- Lerna (optional for publishing)

### Testing
- Jest (unit tests)
- Playwright (e2e tests)
- Supertest (API tests)

### Build
- esbuild (fast bundling)
- electron-builder (desktop app)

### CI/CD
- GitHub Actions
- Semantic versioning
- Automated releases

## Development Workflow

### Setup
```bash
npm install
npm run bootstrap
npm run build
```

### Development
```bash
# Watch mode for all packages
npm run dev

# Run specific package
npm run dev --workspace=@frw/protocol

# Run client
npm run dev --workspace=apps/client
```

### Testing
```bash
# All tests
npm test

# Specific package
npm test --workspace=@frw/crypto

# E2E tests
npm run test:e2e
```

### Publishing
```bash
# Version bump
npm run version

# Publish packages
npm run publish
```

## Package Versioning

### Independent Versioning
Each package has independent version:
- @frw/protocol: 1.0.0
- @frw/crypto: 1.2.0
- @frw/ipfs: 0.9.0

### Semantic Versioning
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

## Distribution

### NPM Packages
- @frw/protocol
- @frw/crypto
- @frw/ipfs
- @frw/sandbox
- @frw/storage
- @frw/common

### Applications
- FRW Client (Electron) - Desktop app
- FRW CLI - Command-line tool

### Docker
- frw-gateway - HTTP gateway
- frw-node - Full node

## Migration Plan

Phase 1: Restructure (Current)
- Create monorepo structure
- Move existing code to packages
- Setup build system

Phase 2: Separate Concerns
- Split protocol logic
- Extract crypto operations
- Isolate IPFS layer

Phase 3: Add TypeScript
- Add JSDoc types
- Gradual TS migration
- Type checking in CI

Phase 4: Production Ready
- Performance optimization
- Security audit
- Documentation complete

Phase 5: Release
- npm packages published
- Client binaries
- Docker images
