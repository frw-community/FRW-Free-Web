# Getting Started

Quick start guide for developing and testing the FRW Chrome Extension.

## Installation

### 1. Install Dependencies

```bash
cd apps/chrome-extension
npm install
```

### 2. Build

```bash
npm run build
```

Compiled extension will be in `dist/` directory.

### 3. Load in Browser

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/chrome-extension/dist`

### 4. Test

Use the extension popup:
1. Click the FRW icon in toolbar (or press Alt+F)
2. Enter a name (e.g., `frw`)
3. Press Enter

Or use the omnibox:
1. Type `frw` in address bar
2. Press Tab
3. Enter name and press Enter

## Development Workflow

### Building

```bash
# Production build
npm run build

# Development build (with watch)
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Making Changes

1. Edit files in `src/`
2. Run `npm run dev` to watch for changes
3. Click "Reload" in `chrome://extensions/` to see changes
4. Test your changes

### Project Structure

```
src/
├── background/        # Service worker (intercepts URLs)
├── core/             # Core logic (resolver, fetcher)
├── viewer/           # Content viewer page
└── popup/            # Extension popup UI
```

## Next Steps

- Read full documentation in README.md
- Review test suite: `npm test`
- See CONTRIBUTING.md for development guidelines

## Common Tasks

### Adding a Feature

1. Create new file in appropriate directory
2. Write unit tests in `tests/`
3. Import and use in existing components
4. Rebuild: `npm run build`
5. Reload extension in Chrome

### Changing Bootstrap Nodes

Edit `src/core/resolver.ts`:

```typescript
private static readonly DEFAULT_BOOTSTRAP_NODES = [
  'http://your-node:3100',
  // ...
];
```

### Customizing UI

- Popup: Edit `src/popup/popup.html` and `popup.css`
- Viewer: Edit `src/viewer/viewer.html` and `viewer.css`

### Debugging

1. Open extension popup
2. Right-click > "Inspect" to open DevTools
3. Check Console tab for logs

For the viewer page:
1. Navigate to a frw:// URL
2. Press F12 to open DevTools
3. Look for `[FRW]`, `[Resolver]`, `[IPFS]` logs

## Troubleshooting

### TypeScript Errors

```bash
npm run type-check
```

### Build Fails

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Extension Not Loading

1. Check `chrome://extensions/` for errors
2. Make sure you loaded the `dist/` folder (not the root)
3. Try reloading the extension

## Resources

- **README.md** - Full documentation
- **tests/** - Example tests showing how components work
- **manifest.json** - Extension configuration

## Need Help?

- Check the issues: https://github.com/frw-community/FRW-Free-Web/issues
- Ask in discussions: https://github.com/frw-community/FRW-Free-Web/discussions

Happy coding! 🚀
