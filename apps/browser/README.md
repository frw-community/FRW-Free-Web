# FRW Browser

Decentralized web browser for the FRW protocol.

## Features

- **frw:// Protocol** - Navigate using frw:// URLs
- **Content Verification** - Cryptographic signature verification
- **Human-Readable Names** - Use names instead of public keys
- **IPFS Integration** - Fetch content from IPFS network
- **Secure Sandbox** - Isolated content rendering

## Development

```bash
# Install dependencies
npm install

# Start development mode
npm run electron:dev

# Build for production
npm run electron:build
```

## Architecture

- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling

## Usage

1. Start the browser
2. Enter a frw:// URL or name in the address bar
3. Navigate verified, decentralized content
4. View signature verification status

## Security

- All content is sandboxed
- Signatures are verified before display
- Visual indicators show trust status
- No external resource loading without permission

## Building

```bash
# Windows
npm run electron:build

# macOS
npm run electron:build

# Linux
npm run electron:build
```

Installers will be created in the `release/` directory.
