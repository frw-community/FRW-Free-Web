# FRW Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│                     FRW Ecosystem                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐         ┌─────────────┐                │
│  │   Author    │────────▶│  Publisher  │                │
│  │   Tools     │         │   Service   │                │
│  └─────────────┘         └──────┬──────┘                │
│                                  │                        │
│                                  ▼                        │
│                          ┌──────────────┐                │
│                          │     IPFS     │                │
│                          │   Network    │                │
│                          └──────┬───────┘                │
│                                  │                        │
│         ┌────────────────────────┼────────────┐          │
│         ▼                        ▼            ▼          │
│  ┌────────────┐          ┌────────────┐  ┌─────────┐   │
│  │    FRW     │          │   OrbitDB  │  │  IPNS   │   │
│  │   Client   │◀────────▶│  Registry  │  │ Records │   │
│  └────────────┘          └────────────┘  └─────────┘   │
│         │                                                │
│         ▼                                                │
│  ┌────────────┐                                         │
│  │    User    │                                         │
│  └────────────┘                                         │
└──────────────────────────────────────────────────────────┘
```

## Component Architecture

### FRW Client

```
┌─────────────────────────────────────────┐
│          FRW Client                     │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     User Interface Layer          │ │
│  │  (Electron/Tauri Renderer)        │ │
│  └────────────┬──────────────────────┘ │
│               │                         │
│  ┌────────────▼──────────────────────┐ │
│  │     Protocol Handler              │ │
│  │  - URL parsing (frw://)           │ │
│  │  - Resource resolution            │ │
│  │  - Signature verification         │ │
│  └────────────┬──────────────────────┘ │
│               │                         │
│  ┌────────────▼──────────────────────┐ │
│  │     Sandbox Manager               │ │
│  │  - JS execution (vm2/Deno)        │ │
│  │  - Permission management          │ │
│  │  - DOM isolation                  │ │
│  └────────────┬──────────────────────┘ │
│               │                         │
│  ┌────────────▼──────────────────────┐ │
│  │     IPFS Interface                │ │
│  │  - js-ipfs integration            │ │
│  │  - Content retrieval              │ │
│  │  - P2P communication              │ │
│  └────────────┬──────────────────────┘ │
│               │                         │
│  ┌────────────▼──────────────────────┐ │
│  │     Storage Layer                 │ │
│  │  - SQLite cache                   │ │
│  │  - Key management                 │ │
│  │  - History/bookmarks              │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Publisher Service

```
┌─────────────────────────────────────────┐
│       FRW Publisher (CLI)               │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Command Interface               │ │
│  │   - init, publish, update         │ │
│  └────────────┬──────────────────────┘ │
│               │                         │
│  ┌────────────▼──────────────────────┐ │
│  │   Content Processor               │ │
│  │   - HTML validation               │ │
│  │   - Metadata extraction           │ │
│  │   - Dependency resolution         │ │
│  └────────────┬──────────────────────┘ │
│               │                         │
│  ┌────────────▼──────────────────────┐ │
│  │   Signature Engine                │ │
│  │   - Ed25519 signing               │ │
│  │   - Key management                │ │
│  └────────────┬──────────────────────┘ │
│               │                         │
│  ┌────────────▼──────────────────────┐ │
│  │   IPFS Publisher                  │ │
│  │   - Add content to IPFS           │ │
│  │   - Update IPNS records           │ │
│  │   - Pin management                │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Data Flow

### Publishing Flow

```
1. Author creates HTML/JS content
   └─▶ Local files (index.frw, script.frw.js)

2. Publisher validates content
   ├─▶ Check HTML structure
   ├─▶ Validate metadata
   └─▶ Resolve dependencies

3. Publisher signs content
   ├─▶ Canonicalize content
   ├─▶ Generate SHA-256 hash
   └─▶ Sign with Ed25519 private key

4. Publisher adds to IPFS
   ├─▶ Upload files
   ├─▶ Receive CIDs
   └─▶ Create directory structure

5. Publisher updates IPNS
   └─▶ Map public key to root CID

6. Content propagates via DHT
   └─▶ Available to all nodes
```

### Browsing Flow

```
1. User enters frw://key/resource

2. Client parses URL
   └─▶ Extract public key & path

3. Client resolves via IPNS
   └─▶ Query for current CID

4. Client retrieves from IPFS
   └─▶ Download content

5. Client verifies signature
   ├─▶ Extract signature
   ├─▶ Hash content
   └─▶ Verify with public key

6. Client processes content
   ├─▶ Parse HTML
   ├─▶ Load CSS
   └─▶ Sandbox JS execution

7. Client renders page
   └─▶ Display to user
```

## Storage Architecture

### Local Storage (SQLite)

```sql
-- Pages cache
CREATE TABLE pages (
  url TEXT PRIMARY KEY,
  cid TEXT NOT NULL,
  content BLOB NOT NULL,
  signature TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
);

-- Author keys
CREATE TABLE keys (
  public_key TEXT PRIMARY KEY,
  alias TEXT,
  ipns_name TEXT,
  last_updated INTEGER
);

-- Webrings
CREATE TABLE webrings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  members JSON NOT NULL
);

-- History
CREATE TABLE history (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL,
  visited_at INTEGER NOT NULL,
  title TEXT
);

-- Bookmarks
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  tags JSON,
  created_at INTEGER
);
```

### IPFS Storage

```
/ipfs/<CID>/
  ├─ index.frw          (HTML page)
  ├─ about.frw          (HTML page)
  ├─ assets/
  │  ├─ style.css       (Stylesheet)
  │  ├─ logo.png        (Image)
  │  └─ bg-tile.gif     (Image)
  ├─ scripts/
  │  ├─ main.frw.js     (Signed script)
  │  └─ guestbook.frw.js (Signed script)
  └─ .frw-manifest.json (Metadata)
```

## Security Boundaries

```
┌───────────────────────────────────────────┐
│          Untrusted Zone                   │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  External Content (IPFS Network)    │ │
│  └──────────────┬──────────────────────┘ │
│                 │                         │
│                 ▼                         │
│  ┌─────────────────────────────────────┐ │
│  │  Signature Verification             │ │
│  └──────────────┬──────────────────────┘ │
└─────────────────┼───────────────────────── ┘
                  │
┌─────────────────▼───────────────────────────┐
│          Trusted Zone                       │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Verified Content                     │ │
│  └──────────────┬────────────────────────┘ │
│                 │                           │
│                 ▼                           │
│  ┌───────────────────────────────────────┐ │
│  │  Sandbox (Isolated Execution)         │ │
│  │  - Limited DOM access                 │ │
│  │  - No system access                   │ │
│  │  - No network (except IPFS API)       │ │
│  └──────────────┬────────────────────────┘ │
│                 │                           │
│                 ▼                           │
│  ┌───────────────────────────────────────┐ │
│  │  Renderer (Display)                   │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Scalability Considerations

### Content Distribution
- DHT for peer discovery
- Content pinning services
- Edge caching via gateways
- Selective replication

### Performance
- Lazy loading of resources
- Progressive rendering
- Cache-first strategy
- Parallel fetches

### Network Resilience
- Multiple bootstrap nodes
- Fallback to HTTP gateways
- Offline-first design
- Content availability scoring
