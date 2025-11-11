# FRW Decentralization Roadmap

**Status:** In Progress  
**Goal:** Eliminate all single points of failure  
**Timeline:** 2 weeks to full decentralization

---

## Current Architecture

### What's Decentralized ✓
- **Content Storage:** IPFS (no central server)
- **Identity:** Cryptographic keypairs (self-sovereign)
- **Content Addressing:** IPFS CIDs (immutable)

### What's Still Centralized ✗
- **Name Resolution:** Single bootstrap node (83.228.214.189:3100)
- **Name Registry:** Stored in node's memory (not synchronized)

---

## The Vision: 3-Layer Resilience

```
Layer 1: HTTP Bootstrap Nodes (FAST - <500ms)
├─ Multiple nodes worldwide
├─ Automatic failover
└─ First available wins

Layer 2: IPFS Index Files (RELIABLE - 2-5s)
├─ Published by bootstrap nodes
├─ Anyone can read
└─ Cached globally via IPFS

Layer 3: Pubsub Sync (REAL-TIME)
├─ Nodes subscribe to updates
├─ New registrations propagate instantly
└─ No single source of truth
```

---

## Implementation Plan

### Week 1: Multi-Bootstrap Foundation

#### Day 1-2: Deploy Second Bootstrap Node
**Task:** Windows VPS deployment
```bash
# Follow DEPLOY_NOW_VPS.md on Windows VPS
# Result: 2 bootstrap nodes operational
```

**Update Code:**
```typescript
// packages/ipfs/src/distributed-registry.ts line 346
private static readonly DEFAULT_BOOTSTRAP_NODES = [
  'http://83.228.214.189:3100',      // Debian (Switzerland)
  'http://YOUR_WINDOWS_IP:3100',     // Windows (Switzerland)
  'http://localhost:3100',            // Local dev
];
```

**Success Criteria:**
- ✓ 2 nodes operational
- ✓ CLI tries both on failure
- ✓ Either node can resolve names

---

#### Day 3-4: Bootstrap Node Synchronization
**Problem:** Nodes don't share registrations

**Solution:** Pubsub-based sync

```typescript
// apps/bootstrap-node/index.ts
// Add sync mechanism

async setupPubsubSync() {
  // Subscribe to registration topic
  await this.ipfs.pubsub.subscribe('frw/names/updates/v1', async (msg) => {
    const update = JSON.parse(msg.data.toString());
    
    if (update.type === 'name-register') {
      // Another node registered a name
      this.addToIndex(update.record);
      console.log(`[Sync] Received registration: ${update.record.name}`);
    }
    
    if (update.type === 'name-update') {
      // Another node updated content
      this.updateIndex(update.record);
      console.log(`[Sync] Received update: ${update.record.name}`);
    }
  });
  
  // Periodically announce our full index
  setInterval(() => {
    this.announceIndex();
  }, 300000); // Every 5 minutes
}

async announceIndex() {
  const indexSnapshot = {
    type: 'index-snapshot',
    nodeId: this.nodeId,
    timestamp: Date.now(),
    names: this.nameIndex
  };
  
  await this.ipfs.pubsub.publish(
    'frw/index/sync',
    Buffer.from(JSON.stringify(indexSnapshot))
  );
}
```

**Success Criteria:**
- ✓ Register on Node A → appears on Node B within 1 second
- ✓ Nodes sync full index on startup
- ✓ No manual syncing required

---

#### Day 5: IPFS Index Publishing
**Purpose:** Backup method if ALL bootstrap nodes fail

```typescript
// apps/bootstrap-node/index.ts
async publishIPFSIndex() {
  const index = {
    version: 1,
    published: Date.now(),
    publishedBy: this.nodeId,
    names: this.nameIndex
  };
  
  // Upload to IPFS
  const result = await this.ipfs.add(JSON.stringify(index, null, 2));
  const cid = result.cid.toString();
  
  // Pin it
  await this.ipfs.pin.add(cid);
  
  // Announce CID via pubsub
  await this.ipfs.pubsub.publish('frw/index/updates', 
    Buffer.from(JSON.stringify({ type: 'index-published', cid }))
  );
  
  console.log(`[Index] Published to IPFS: ${cid}`);
  return cid;
}
```

**Client Side:**
```typescript
// packages/ipfs/src/distributed-registry.ts
async queryIPFSIndex(name: string): Promise<DistributedNameRecord | null> {
  // Get latest index CID from pubsub or hardcoded fallback
  const latestCID = await this.getLatestIndexCID();
  
  // Download index
  const chunks = [];
  for await (const chunk of this.ipfs.cat(latestCID)) {
    chunks.push(chunk);
  }
  
  const index = JSON.parse(Buffer.concat(chunks).toString());
  const record = index.names[name.toLowerCase()];
  
  return record || null;
}
```

**Success Criteria:**
- ✓ Index published every hour
- ✓ Client can resolve from index if all nodes down
- ✓ Index CIDs announced via pubsub

---

### Week 2: Community Expansion

#### Day 6-7: Docker Image
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install IPFS
RUN wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz \
    && tar -xzf kubo_v0.24.0_linux-amd64.tar.gz \
    && cd kubo && ./install.sh

# Copy app
COPY . .
RUN npm install && npm run build

# Init IPFS
RUN ipfs init
RUN ipfs config --json Experimental.Pubsub true

# Expose ports
EXPOSE 3100 4001 5001

# Start script
CMD ipfs daemon --enable-pubsub-experiment & \
    sleep 5 && \
    cd apps/bootstrap-node && \
    HTTP_PORT=3100 node dist/index.js
```

**Usage:**
```bash
docker run -d \
  -p 3100:3100 \
  -p 4001:4001 \
  --name frw-bootstrap \
  frw/bootstrap-node:latest
```

**Success Criteria:**
- ✓ One-command deployment
- ✓ Works on any VPS/cloud provider
- ✓ Auto-syncs with existing nodes

---

#### Day 8-9: Community Documentation

**Create:** `docs/RUN_A_BOOTSTRAP_NODE.md`

```markdown
# Run a FRW Bootstrap Node

## Requirements
- VPS with public IP
- 2GB RAM, 20GB storage
- Open ports: 3100, 4001
- Cost: ~$5/month

## Quick Start (Docker)
\`\`\`bash
docker run -d \
  -p 3100:3100 \
  -p 4001:4001 \
  --restart=always \
  --name frw-bootstrap \
  frw/bootstrap-node:latest
\`\`\`

## Add Your Node to the Network
1. Deploy and test: `curl http://YOUR_IP:3100/health`
2. Submit PR to add your IP to `packages/ipfs/src/distributed-registry.ts`
3. Community reviews and merges
4. Your node is now part of the global network!

## Node Requirements
- 99% uptime
- HTTPS recommended (optional)
- Will serve all registered names
- Syncs automatically via pubsub
```

---

#### Day 10: Monitoring Dashboard

Simple status page showing all bootstrap nodes:

```html
<!-- docs/NODE_STATUS.html -->
<!DOCTYPE html>
<html>
<head>
  <title>FRW Bootstrap Nodes Status</title>
</head>
<body>
  <h1>FRW Network Status</h1>
  <div id="nodes"></div>
  
  <script>
    const NODES = [
      'http://83.228.214.189:3100',
      'http://YOUR_WINDOWS_IP:3100',
      // Community nodes...
    ];
    
    async function checkNodes() {
      for (const node of NODES) {
        try {
          const res = await fetch(`${node}/health`);
          const data = await res.json();
          console.log(`${node}: ONLINE (${data.totalNames} names)`);
        } catch {
          console.log(`${node}: OFFLINE`);
        }
      }
    }
    
    setInterval(checkNodes, 30000);
    checkNodes();
  </script>
</body>
</html>
```

---

## Success Metrics

### Week 1 (Foundation)
- ✓ 2 bootstrap nodes operational
- ✓ Nodes sync via pubsub (<1s propagation)
- ✓ IPFS index published hourly
- ✓ Client failover works (try all nodes)

### Week 2 (Expansion)
- ✓ Docker image available
- ✓ Community documentation complete
- ✓ 3+ community nodes deployed
- ✓ Monitoring dashboard live

### Month 1 (Maturity)
- ✓ 10+ bootstrap nodes worldwide
- ✓ Average resolution time <200ms
- ✓ Zero downtime (multiple nodes)
- ✓ Community PRs for new nodes

---

## Comparison: Decentralization Levels

### Current State (Single Node)
```
Decentralization Score: 2/10
├─ Content: IPFS (decentralized) ✓
├─ Identity: Cryptographic (decentralized) ✓
├─ Name Resolution: Single bootstrap ✗
└─ Registry: Single source ✗
```

### Week 1 (Multi-Bootstrap)
```
Decentralization Score: 7/10
├─ Content: IPFS (decentralized) ✓
├─ Identity: Cryptographic (decentralized) ✓
├─ Name Resolution: 2 bootstraps + IPFS fallback ✓
└─ Registry: Synced via pubsub ✓
```

### Month 1 (True Decentralization)
```
Decentralization Score: 10/10
├─ Content: IPFS (decentralized) ✓
├─ Identity: Cryptographic (decentralized) ✓
├─ Name Resolution: 10+ bootstraps + IPFS fallback ✓
├─ Registry: Distributed via pubsub + IPFS ✓
└─ No single point of failure ✓
```

---

## Like Bitcoin, But for Names

**Bitcoin Comparison:**
- Bitcoin has ~15,000 full nodes
- If 14,999 nodes fail, Bitcoin still works
- Seed nodes are just for initial connection
- Network is truly unstoppable

**FRW (Target State):**
- FRW will have 100+ bootstrap nodes
- If 99 nodes fail, FRW still works
- Bootstrap nodes are just for speed
- Names resolve via IPFS if needed
- Network is truly unstoppable

---

## Next Actions (NOW)

1. **Deploy Windows VPS** (follow DEPLOY_NOW_VPS.md)
2. **Update DEFAULT_BOOTSTRAP_NODES** (add Windows IP)
3. **Implement pubsub sync** (bootstrap-node/index.ts)
4. **Test multi-node** (register on one, resolve on other)
5. **Publish IPFS index** (hourly cron)

---

**The dream is alive. Let's make it real.** 🌐
