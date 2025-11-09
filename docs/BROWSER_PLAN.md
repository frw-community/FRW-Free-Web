# FRW Browser Client - Implementation Plan

## Overview

Build an Electron-based browser application that can navigate `frw://` URLs, verify content signatures, and provide a secure viewing experience for FRW content.

---

## Architecture

```
apps/browser/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # App entry point
│   │   ├── protocol.ts    # frw:// protocol handler
│   │   ├── window.ts      # Window management
│   │   └── menu.ts        # Application menu
│   ├── renderer/          # Browser UI
│   │   ├── index.html     # Main window
│   │   ├── App.tsx        # React app
│   │   ├── components/    # UI components
│   │   │   ├── AddressBar.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── ContentViewer.tsx
│   │   │   ├── VerificationBadge.tsx
│   │   │   └── HistoryPanel.tsx
│   │   ├── hooks/         # React hooks
│   │   │   ├── useNavigation.ts
│   │   │   ├── useVerification.ts
│   │   │   └── useIPFS.ts
│   │   └── styles/        # CSS/styling
│   ├── preload/           # Electron preload
│   │   └── index.ts       # IPC bridge
│   └── shared/            # Shared types
│       └── types.ts
├── package.json
├── tsconfig.json
├── vite.config.ts         # Build config
└── electron-builder.json  # Packaging config
```

---

## Core Features

### 1. Protocol Handler
**Goal:** Register and handle `frw://` URLs

**Implementation:**
- Register `frw://` protocol in Electron
- Parse FRW URLs (name or public key)
- Resolve names to public keys
- Fetch content from IPFS
- Return HTML to renderer

**Key Files:**
- `src/main/protocol.ts`

### 2. Content Viewer
**Goal:** Display FRW pages with security indicators

**Features:**
- Render HTML content
- Show verification status
- Display author identity
- Content signature badge
- Security warnings

**Key Files:**
- `src/renderer/components/ContentViewer.tsx`
- `src/renderer/components/VerificationBadge.tsx`

### 3. Address Bar
**Goal:** Navigate to FRW URLs

**Features:**
- URL input with autocomplete
- Name suggestions
- Validation feedback
- Security indicators
- Copy/share buttons

**Key Files:**
- `src/renderer/components/AddressBar.tsx`

### 4. Navigation
**Goal:** Browser-like navigation experience

**Features:**
- Back/forward buttons
- Refresh/reload
- Home button
- Bookmarks
- History panel

**Key Files:**
- `src/renderer/components/Navigation.tsx`
- `src/renderer/hooks/useNavigation.ts`

### 5. Verification System
**Goal:** Verify content authenticity

**Features:**
- Signature verification on load
- Visual trust indicators
- Author identity display
- Tamper detection
- Verification details panel

**Key Files:**
- `src/renderer/hooks/useVerification.ts`

### 6. IPFS Integration
**Goal:** Fetch content from IPFS network

**Features:**
- Connect to local IPFS node
- Fetch by CID
- Resolve IPNS names
- Cache content locally
- Offline mode

**Key Files:**
- `src/renderer/hooks/useIPFS.ts`

---

## Tech Stack

### Frontend
- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management

### Backend (Main Process)
- **Electron IPC** - Process communication
- **@frw/protocol** - URL parsing
- **@frw/crypto** - Signature verification
- **@frw/ipfs** - Content fetching

### Build & Deploy
- **electron-builder** - Packaging
- **electron-updater** - Auto-updates

---

## Phase 1: MVP (Week 1)

### Day 1-2: Setup & Protocol
- [x] CLI tool complete
- [ ] Create Electron app structure
- [ ] Setup React + TypeScript + Vite
- [ ] Implement basic window management
- [ ] Register frw:// protocol handler

### Day 3-4: Content Loading
- [ ] Parse frw:// URLs
- [ ] Resolve names to public keys
- [ ] Fetch content from IPFS
- [ ] Display HTML content
- [ ] Basic error handling

### Day 5-7: Verification & UI
- [ ] Verify content signatures
- [ ] Show verification badge
- [ ] Build address bar
- [ ] Add navigation buttons
- [ ] Style the UI

**Deliverable:** Working browser that can load and verify frw:// URLs

---

## Phase 2: Features (Week 2)

### Navigation
- [ ] History management
- [ ] Bookmarks system
- [ ] Tab support
- [ ] Search functionality

### Security
- [ ] Content sandboxing
- [ ] JavaScript isolation
- [ ] Resource permissions
- [ ] Security warnings

### UX Improvements
- [ ] Loading indicators
- [ ] Error pages
- [ ] Offline mode
- [ ] Settings panel

**Deliverable:** Feature-complete browser

---

## Phase 3: Polish (Week 3)

### Performance
- [ ] Content caching
- [ ] Lazy loading
- [ ] Memory optimization
- [ ] Startup time

### Developer Tools
- [ ] DevTools integration
- [ ] Page inspector
- [ ] Network monitor
- [ ] Signature debugger

### Distribution
- [ ] Windows installer
- [ ] macOS app bundle
- [ ] Linux packages
- [ ] Auto-updater

**Deliverable:** Production-ready browser

---

## Implementation Details

### 1. Protocol Registration

```typescript
// src/main/protocol.ts
import { protocol } from 'electron';
import { FRWParser } from '@frw/protocol';
import { IPFSClient } from '@frw/ipfs';

export function registerFRWProtocol() {
  protocol.registerStringProtocol('frw', async (request, callback) => {
    try {
      const url = FRWParser.parse(request.url);
      const ipfs = new IPFSClient();
      
      // Resolve name to public key if needed
      const publicKey = url.isName 
        ? await resolveNameToKey(url.identifier)
        : url.identifier;
      
      // Fetch content from IPFS
      const content = await ipfs.get(publicKey + url.path);
      
      callback({ data: content, mimeType: 'text/html' });
    } catch (error) {
      callback({ error: -2 }); // Failed to load
    }
  });
}
```

### 2. Content Viewer

```tsx
// src/renderer/components/ContentViewer.tsx
import { useEffect, useState } from 'react';
import { SignatureManager } from '@frw/crypto';
import { VerificationBadge } from './VerificationBadge';

export function ContentViewer({ url }: { url: string }) {
  const [content, setContent] = useState('');
  const [verified, setVerified] = useState(false);
  
  useEffect(() => {
    loadAndVerify(url);
  }, [url]);
  
  async function loadAndVerify(frwUrl: string) {
    // Fetch via IPC
    const html = await window.electron.fetchContent(frwUrl);
    
    // Verify signature
    const isValid = SignatureManager.verifyPage(html, publicKey);
    
    setContent(html);
    setVerified(isValid);
  }
  
  return (
    <div className="content-viewer">
      <VerificationBadge verified={verified} author={author} />
      <iframe srcDoc={content} sandbox="allow-scripts" />
    </div>
  );
}
```

### 3. Address Bar

```tsx
// src/renderer/components/AddressBar.tsx
export function AddressBar() {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Normalize URL
    const frwUrl = url.startsWith('frw://') 
      ? url 
      : `frw://${url}`;
    
    navigate(frwUrl);
  }
  
  return (
    <form onSubmit={handleSubmit} className="address-bar">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter frw:// URL or name..."
      />
      <button type="submit">Go</button>
    </form>
  );
}
```

---

## File Structure

```
apps/browser/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json
├── src/
│   ├── main/
│   │   ├── index.ts                 # Main entry
│   │   ├── protocol.ts              # frw:// handler
│   │   ├── window.ts                # Window management
│   │   ├── ipc.ts                   # IPC handlers
│   │   └── menu.ts                  # App menu
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx                 # React entry
│   │   ├── App.tsx                  # Main component
│   │   ├── components/
│   │   │   ├── AddressBar.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── ContentViewer.tsx
│   │   │   ├── VerificationBadge.tsx
│   │   │   ├── HistoryPanel.tsx
│   │   │   ├── BookmarkBar.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── hooks/
│   │   │   ├── useNavigation.ts
│   │   │   ├── useVerification.ts
│   │   │   ├── useIPFS.ts
│   │   │   └── useHistory.ts
│   │   ├── store/
│   │   │   ├── navigation.ts
│   │   │   ├── history.ts
│   │   │   └── settings.ts
│   │   └── styles/
│   │       └── global.css
│   ├── preload/
│   │   └── index.ts                 # Electron API bridge
│   └── shared/
│       └── types.ts                 # Shared types
└── assets/
    ├── icon.png
    └── logo.svg
```

---

## Dependencies

```json
{
  "dependencies": {
    "@frw/common": "1.0.0",
    "@frw/crypto": "1.0.0",
    "@frw/ipfs": "1.0.0",
    "@frw/protocol": "1.0.0",
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "electron-builder": "^24.9.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.0",
    "vite-plugin-electron": "^0.28.0"
  }
}
```

---

## Security Considerations

### Content Sandboxing
- Isolate FRW pages in sandboxed iframes
- Restrict JavaScript capabilities
- Block external resource loading
- CSP headers

### Signature Verification
- Verify all content on load
- Show clear trust indicators
- Warn on verification failures
- Block tampered content

### IPFS Security
- Validate CIDs
- Check content types
- Size limits
- Timeout protection

---

## User Experience

### Navigation Flow
1. User enters `frw://alice/` in address bar
2. Browser resolves "alice" to public key
3. Fetches content from IPFS
4. Verifies signature
5. Displays content with verification badge
6. User can click links to navigate

### Verification Display
```
┌─────────────────────────────────────────┐
│ ✓ Verified | @alice                     │
│ frw://alice/                      🔒    │
├─────────────────────────────────────────┤
│                                         │
│   [Page content rendered here]          │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests
- Protocol parsing
- Signature verification
- Name resolution
- Content fetching

### Integration Tests
- Full navigation flow
- IPFS integration
- IPC communication
- Error handling

### E2E Tests
- User workflows
- Security scenarios
- Performance testing

---

## Release Plan

### Alpha (Internal)
- Core functionality working
- Basic UI
- Local testing only

### Beta (Community)
- Feature complete
- Public testing
- Feedback collection
- Bug fixes

### v1.0 (Production)
- Stable release
- Full documentation
- Auto-updates
- Distribution packages

---

## Success Metrics

- ✅ Load frw:// URLs successfully
- ✅ Verify signatures correctly
- ✅ Display content securely
- ✅ Navigate between pages
- ✅ Manage history/bookmarks
- ✅ <1s page load time
- ✅ <100MB memory usage
- ✅ <3s startup time

---

## Next Actions

1. **Create Electron app scaffold**
2. **Setup React + Vite + TypeScript**
3. **Implement protocol handler**
4. **Build basic UI**
5. **Test with published content**

---

**Ready to start building?**

```bash
# Create browser app
npm init @frw/browser

# Install dependencies
cd apps/browser
npm install

# Start development
npm run dev
```

Let's build the FRW browser! 🚀
