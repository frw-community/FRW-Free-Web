# Extension Icons

Required icon sizes for Chrome extensions:

- `icon-16.png` (16x16) - Toolbar icon
- `icon-32.png` (32x32) - Windows computers
- `icon-48.png` (48x48) - Extension management
- `icon-128.png` (128x128) - Chrome Web Store

## Generating Icons

Use the provided script to generate icons from a source image:

```bash
npm install sharp
node scripts/create-icons.js path/to/logo.png
```

Icons will be generated automatically in this directory.
