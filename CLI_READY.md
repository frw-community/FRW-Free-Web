# FRW CLI - Ready to Use! 🎉

## Status: ✅ WORKING

The FRW command-line interface is now installed and ready to use.

---

## Quick Start

### 1. Initialize FRW
```bash
frw init
```
- Creates ~/.frw/ configuration directory
- Generates Ed25519 keypair
- Password-protects your private key
- Saves your public key

### 2. Register a Human-Readable Name
```bash
frw register mywebsite
```
- Validates name format (3-63 chars, lowercase)
- Creates signed name record
- Stores locally (DHT publishing when IPFS connected)
- Your site will be accessible at `frw://mywebsite/`

### 3. Create Content
Create a simple FRW page:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My FRW Site</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@mywebsite">
  <meta name="frw-date" content="2025-11-09T00:00:00Z">
</head>
<body>
  <h1>Hello FRW!</h1>
  <p>This is my decentralized website.</p>
</body>
</html>
```

### 4. Preview Locally
```bash
frw serve
```
- Starts HTTP server on http://localhost:3000
- Live preview before publishing
- Press Ctrl+C to stop

### 5. Publish to IPFS
```bash
frw publish ./my-site
```
- Scans directory for files
- Signs all HTML/FRW files with your private key
- Publishes to IPFS (when connected)
- Shows your FRW URLs

### 6. Verify Content
```bash
frw verify index.html
```
- Validates page structure
- Checks metadata fields
- Verifies Ed25519 signature
- Shows authentication status

---

## All Commands

| Command | Description |
|---------|-------------|
| `frw init` | Initialize configuration & generate keypair |
| `frw register <name>` | Register human-readable name |
| `frw publish [dir]` | Publish directory to IPFS |
| `frw verify <file>` | Verify page signature |
| `frw serve [dir]` | Start local preview server |
| `frw keys` | List registered keypairs |
| `frw --version` | Show version |
| `frw --help` | Show help |

---

## Configuration

FRW stores configuration in `~/.frw/`:
```
~/.frw/
├── config.json          # Settings
└── keys/
    └── default.json     # Your keypair(s)
```

---

## Examples

### Complete Workflow
```bash
# 1. Setup
frw init

# 2. Register name
frw register alice

# 3. Create site
mkdir my-site
cd my-site
echo '<!DOCTYPE html>...' > index.html

# 4. Preview
frw serve

# 5. Publish
frw publish

# 6. Access
# frw://alice/index.frw
# frw://[your-public-key]/index.frw
```

### Verify Existing Page
```bash
frw verify downloaded-page.html
```

### Multiple Keys
```bash
frw keys --list
```

---

## What Works Now

✅ **CLI Tool**
- All 6 commands implemented
- Interactive prompts (password, options)
- Colored output and progress spinners
- Configuration management

✅ **Cryptography**
- Ed25519 key generation
- Content signing
- Signature verification
- Password-protected keys

✅ **Naming System**
- Human-readable names
- Name validation
- Local name registry
- DNS bridge support (designed)

✅ **Developer Experience**
- TypeScript strict mode
- Full type safety
- Proper error messages
- Help documentation

---

## What's Next

### Phase 1: IPFS Integration (Priority)
- Connect to IPFS node
- Actual content publishing
- DHT name registry
- IPNS publishing

### Phase 2: Client Application
- Electron browser
- frw:// protocol handler
- Content viewer
- History management

### Phase 3: Community
- Example sites
- Documentation site
- Tutorial videos
- Beta testers

---

## Technical Details

**Architecture:**
- Monorepo with npm workspaces
- 6 TypeScript packages + CLI
- Project references for type safety
- ESM modules throughout

**Packages:**
- `@frw/common` - Types, errors, utilities
- `@frw/crypto` - Ed25519 signatures
- `@frw/protocol` - URL parsing, validation
- `@frw/ipfs` - IPFS integration
- `@frw/sandbox` - VM execution
- `@frw/storage` - Caching

**CLI:**
- Commander.js for argument parsing
- Inquirer for interactive prompts
- Chalk for colored output
- Ora for spinners
- Conf for configuration storage

---

## Troubleshooting

### Command not found: frw
```bash
cd apps/cli
npm link
```

### Permission denied
```bash
# Windows: Run PowerShell as Administrator
# macOS/Linux: Use sudo npm link
```

### TypeScript errors
```bash
npm run build
```

### Missing configuration
```bash
frw init --force
```

---

## Contributing

Want to help? Check these areas:
1. IPFS integration (high priority)
2. DNS TXT query implementation
3. More comprehensive tests
4. Example FRW sites
5. Documentation improvements

---

## Summary

**FRW CLI is production-ready for:**
- Key generation and management
- Content signing and verification
- Name registration (local)
- Local preview server

**Waiting for:**
- IPFS node connection
- Live network publishing
- DNS bridge queries
- Full p2p functionality

---

**Test it now:**
```bash
frw init
```

Welcome to the Free Web! 🚀
