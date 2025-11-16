# Getting Started with FRW Chrome Extension

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd apps/chrome-extension
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This creates a `dist/` directory with the compiled extension.

### 3. Load in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Toggle "Developer mode" ON (top right corner)
3. Click "Load unpacked"
4. Navigate to and select the `apps/chrome-extension/dist` folder
5. Done! The FRW extension is now installed

### 4. Test It Out

Try navigating to a FRW URL:

```
frw://frw/
```

Or use the extension:
1. Click the FRW extension icon in toolbar
2. Type a name (e.g., "frw")
3. Click "Go"

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

1. **Read the README** - Full documentation in README.md
2. **Explore the Code** - Start with `src/core/resolver.ts`
3. **Run Tests** - `npm test` to see all tests passing
4. **Make Changes** - Try modifying the UI or adding features

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
