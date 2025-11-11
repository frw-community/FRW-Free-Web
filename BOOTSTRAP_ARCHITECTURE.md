# FRW Bootstrap Architecture

**Status:** PRODUCTION | **Updated:** November 11, 2025

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  BOOTSTRAP LAYER                        │
│  (Foundation - Hardcoded everywhere)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Bootstrap #1: 83.228.214.189:3100  (Swiss VPS)        │
│  Bootstrap #2: 83.228.213.45:3100   (Swiss VPS)        │
│                                                          │
│  - Always available (99.9% uptime)                      │
│  - Sync with each other via pubsub                      │
│  - HTTP API for fast resolution                         │
│  - IPFS pubsub for real-time updates                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ Query bootstrap nodes
                          │
┌─────────────────────────────────────────────────────────┐
│                   RESOLVER LAYER                        │
│  (Dynamic - Anyone can run)                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  - Community nodes                                       │
│  - Private nodes                                         │
│  - Regional caching nodes                                │
│                                                          │
│  - Query bootstrap nodes for names                       │
│  - Cache results locally                                 │
│  - Don't need to be hardcoded                           │
│  - Join/leave network freely                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ frw://name/ requests
                          │
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  (End users)                                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  - FRW Browser (Electron)                               │
│  - FRW CLI                                              │
│  - Custom applications                                   │
│                                                          │
│  Hardcoded bootstrap nodes:                             │
│    - 83.228.214.189:3100                                │
│    - 83.228.213.45:3100                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Bootstrap Node Responsibilities

### 1. Name Registry (Primary)
- Store all registered names in memory
- Serve fast HTTP queries (<100ms)
- Sync with other bootstrap nodes

### 2. Pubsub Broadcast (Real-time)
- Announce new name registrations
- Announce content updates
- Sync index with peer bootstrap nodes

### 3. IPFS Index Publishing (Backup)
- Publish full index to IPFS every hour
- Fallback if HTTP nodes are down
- Anyone can download and use

### 4. Discovery Service
- Help new nodes join the network
- Provide peer lists
- Bootstrap IPFS connections

---

## Bootstrap Node Synchronization

### On Startup
```
New Bootstrap Node:
  1. Connect to IPFS
  2. Subscribe to pubsub topics
  3. Query peer bootstrap nodes via HTTP
  4. Merge received indexes
  5. Start serving requests
```

### During Operation
```
Name Registration:
  User → CLI → Bootstrap #1 → Pubsub → Bootstrap #2
                                      → All other nodes

Result: All nodes have name within 1 second
```

### Conflict Resolution
```
If same name has different data:
  - Use timestamp (newest wins)
  - Signature must match publicKey
  - Invalid records rejected
```

---

## Why Only 2 Bootstrap Nodes?

### Similar to Bitcoin/IPFS
- **Bitcoin:** ~10 hardcoded seed nodes (out of 15,000+ total)
- **IPFS:** ~12 bootstrap nodes (out of millions)
- **FRW:** 2 bootstrap nodes (enough for redundancy)

### Benefits of Small Bootstrap Set
✓ **Simple:** Easy to manage and monitor  
✓ **Reliable:** Only commit to nodes you control  
✓ **Fast:** No coordination overhead  
✓ **Secure:** Known trusted nodes  

### Scaling Beyond Bootstrap
- Community runs resolver nodes
- Resolvers query bootstrap nodes
- Resolvers cache results
- No need to hardcode every node

---

## Resolver Nodes (Community)

### What They Do
- Query bootstrap nodes for names
- Cache results for performance
- Serve local community/region
- Optional: Run IPFS gateway

### What They DON'T Need
- To be hardcoded in clients
- To sync with all other resolvers
- 99.9% uptime commitment
- Direct pubsub participation (optional)

### How to Run a Resolver
```bash
# Simple: Just query bootstrap nodes
curl http://83.228.214.189:3100/api/resolve/name

# Advanced: Run local caching node
docker run -p 3100:3100 frw/resolver-node
```

---

## Client Resolution Flow

### Fast Path (99% of requests)
```
1. Client queries Bootstrap #1
2. Bootstrap responds in <100ms
3. Client fetches content from IPFS
4. Done!
```

### Failover Path (1% of requests)
```
1. Client queries Bootstrap #1 → timeout
2. Client queries Bootstrap #2 → success!
3. Client fetches content from IPFS
4. Done!
```

### Disaster Recovery (Both bootstraps down)
```
1. Client queries both bootstraps → timeout
2. Client downloads IPFS index (latest CID known)
3. Client searches index for name
4. Client fetches content from IPFS
5. Done! (Slower but works)
```

---

## Deployment Guide

### Bootstrap Node #1 (83.228.214.189)
```bash
ssh debian@83.228.214.189
cd FRW-Free-Web
git pull  # Or copy updated files
npx tsc -b apps/bootstrap-node
sudo systemctl restart frw-bootstrap
sudo journalctl -u frw-bootstrap -f
```

### Bootstrap Node #2 (83.228.213.45)
```bash
ssh debian@83.228.213.45
cd FRW-Free-Web
git pull  # Or copy updated files
npx tsc -b apps/bootstrap-node
sudo systemctl restart frw-bootstrap
sudo journalctl -u frw-bootstrap -f
```

### Expected Log Output
```
[Bootstrap] Starting FRW Bootstrap Node: bootstrap-XXXXX
[Bootstrap] ✓ Connected to IPFS
[Bootstrap] ✓ Subscribed to pubsub: frw/names/updates/v1
[Bootstrap] 🔄 Requesting sync from network...
[Bootstrap] 📥 Synced X names from http://83.228.XXX.XXX:3100
[Bootstrap] ✓ HTTP server listening on port 3100
[Bootstrap] ✓ Bootstrap node ready!
```

---

## Testing Multi-Node Sync

### Test 1: Both Nodes Responding
```powershell
Invoke-RestMethod http://83.228.214.189:3100/health
Invoke-RestMethod http://83.228.213.45:3100/health
# Both should return status: ok
```

### Test 2: Name Sync
```powershell
# Register name
frw register synctest

# Check both nodes (wait 2 seconds)
Start-Sleep -Seconds 2
Invoke-RestMethod http://83.228.214.189:3100/api/resolve/synctest
Invoke-RestMethod http://83.228.213.45:3100/api/resolve/synctest
# Both should return same data!
```

### Test 3: Content Update Sync
```powershell
# Publish content
frw publish test-site --name synctest

# Check contentCID on both nodes
(Invoke-RestMethod http://83.228.214.189:3100/api/resolve/synctest).contentCID
(Invoke-RestMethod http://83.228.213.45:3100/api/resolve/synctest).contentCID
# Should be same CID!
```

### Test 4: Failover
```bash
# On one VPS, stop the service
sudo systemctl stop frw-bootstrap

# On Windows, try to resolve
Invoke-RestMethod http://83.228.214.189:3100/api/resolve/test
# If node is down, client automatically tries next bootstrap node!
```

---

## Monitoring

### Health Checks
```bash
# Check status
curl http://83.228.214.189:3100/health
curl http://83.228.213.45:3100/health

# Check stats
curl http://83.228.214.189:3100/api/stats
curl http://83.228.213.45:3100/api/stats

# Compare name counts (should be same)
curl http://83.228.214.189:3100/api/names | jq '.count'
curl http://83.228.213.45:3100/api/names | jq '.count'
```

### Log Monitoring
```bash
# Node #1
ssh debian@83.228.214.189 sudo journalctl -u frw-bootstrap -f

# Node #2
ssh debian@83.228.213.45 sudo journalctl -u frw-bootstrap -f
```

---

## Hardcoded Locations

### Updated Files
```
✓ packages/ipfs/src/distributed-registry.ts (line 344-355)
✓ apps/bootstrap-node/index.ts (line 33-38)
✓ apps/cli/src/commands/register.ts (line 199-203)
✓ apps/cli/src/commands/publish.ts (line 161-172)
```

### Bootstrap Node IPs
```typescript
const BOOTSTRAP_NODES = [
  'http://83.228.214.189:3100',  // Swiss Bootstrap #1
  'http://83.228.213.45:3100',   // Swiss Bootstrap #2
  'http://localhost:3100'         // Local dev
];
```

---

## Security Considerations

### Bootstrap Node Trust
- Bootstrap nodes can't fake name ownership (signatures verify)
- Bootstrap nodes can't censor (names in IPFS DHT + IPNS)
- Bootstrap nodes can go down (failover + IPFS fallback)
- Bootstrap nodes can collude to delay (but not block) names

### Mitigation
- Multiple bootstrap nodes (no single point of failure)
- IPFS DHT storage (decentralized backup)
- IPFS index publishing (anyone can verify)
- Signature verification (can't fake ownership)

---

## Future: Decentralized Bootstrap Discovery

### Phase 3 (When 10+ community nodes exist)
```
Instead of hardcoding IPs, use:
1. DNS TXT records (frw.org → bootstrap IPs)
2. IPNS record with bootstrap list
3. DHT query for bootstrap nodes
4. Gossip protocol for peer discovery
```

**But for now: 2 hardcoded bootstrap nodes is perfect!**

---

## Summary

✓ **2 Bootstrap nodes:** Foundation of the network  
✓ **Sync via pubsub:** Real-time updates  
✓ **HTTP for speed:** <100ms resolution  
✓ **IPFS for resilience:** Backup if bootstraps fail  
✓ **Community resolvers:** Optional caching layer  
✓ **Simple & reliable:** Like Bitcoin/IPFS seed nodes  

**The network is now truly decentralized and resilient!** 🌐
