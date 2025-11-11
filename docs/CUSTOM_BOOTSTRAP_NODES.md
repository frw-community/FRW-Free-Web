# Custom Bootstrap Nodes

**Status:** PRODUCTION | **Date:** November 11, 2025

---

## Default Bootstrap Nodes

FRW comes with **4 foundation bootstrap nodes** hardcoded:

```
http://83.228.214.189:3100  - Swiss Bootstrap #1
http://83.228.213.45:3100   - Swiss Bootstrap #2
http://83.228.213.240:3100  - Swiss Bootstrap #3
http://83.228.214.72:3100   - Swiss Bootstrap #4
```

These are maintained by the FRW foundation with 99.9% uptime guarantee.

---

## Why Customize?

### Add Your Own Node
- Run a bootstrap node in your region
- Faster resolution for local network
- Contribute to decentralization

### Use Private Network
- Corporate/private FRW network
- Testing environment
- Isolated deployment

### Trust Your Own Infrastructure
- Don't trust foundation nodes
- Run your own bootstrap cluster
- Complete independence

---

## Method 1: Config File (Recommended)

### Add Custom Nodes (Keep Defaults)

Edit `~/.frw/config.json`:

```json
{
  "bootstrapNodes": {
    "useDefaults": true,
    "customNodes": [
      "http://my-node.example.com:3100",
      "http://192.168.1.100:3100"
    ]
  }
}
```

**Result:** Uses 4 foundation nodes + your 2 custom nodes = 6 total

---

### Replace All Nodes (Advanced)

Edit `~/.frw/config.json`:

```json
{
  "bootstrapNodes": {
    "useDefaults": false,
    "overrideDefaults": [
      "http://my-bootstrap-1.com:3100",
      "http://my-bootstrap-2.com:3100",
      "http://my-bootstrap-3.com:3100"
    ]
  }
}
```

**Result:** Uses ONLY your 3 nodes, ignores foundation nodes

---

## Method 2: Environment Variable

```bash
# Set custom bootstrap nodes
export FRW_BOOTSTRAP_NODES="http://node1:3100,http://node2:3100"

# Run CLI
frw register myname
```

**Result:** Adds your nodes to the default list

---

## Method 3: Programmatic (For Developers)

```typescript
import { DistributedNameRegistry } from '@frw/ipfs';

const registry = new DistributedNameRegistry({
  bootstrapNodes: [
    'http://my-node:3100',
    'http://another-node:3100'
  ]
});

await registry.registerName(record);
```

**Result:** Uses only the nodes you specify

---

## Running Your Own Bootstrap Node

### Quick Deploy (Docker)

```bash
# Pull image
docker pull frw/bootstrap-node:latest

# Run node
docker run -d \
  -p 3100:3100 \
  -p 4001:4001 \
  -e NODE_ID="my-bootstrap" \
  --name frw-bootstrap \
  frw/bootstrap-node:latest
```

### Manual Deploy (VPS)

Follow: `docs/deployment/DEPLOY_NOW_VPS.md`

**Requirements:**
- Public IP address
- Ports 3100 (HTTP) and 4001 (IPFS) open
- IPFS daemon with pubsub enabled
- 99% uptime commitment (for public nodes)

---

## Testing Custom Nodes

### Verify Node is Accessible

```powershell
# Health check
Invoke-RestMethod http://your-node:3100/health

# Should return:
# {
#   "status": "ok",
#   "nodeId": "bootstrap-xxx",
#   "indexSize": 10,
#   "uptime": 3600
# }
```

### Test Name Resolution

```bash
# Register name using your node
frw register testname

# Check it's on your node
curl http://your-node:3100/api/resolve/testname

# Should return the name record
```

---

## Bootstrap Node Sync

All bootstrap nodes automatically sync with each other via:

1. **Pubsub** (real-time)
   - New registrations propagate in <1 second
   - Updates broadcast instantly

2. **HTTP sync** (on startup)
   - Nodes query each other for full index
   - Catches up on missed registrations

3. **IPFS DHT** (backup)
   - Names stored in global DHT
   - Works even if all bootstraps are down

**Your custom node will automatically sync with foundation nodes!**

---

## Network Topologies

### Hybrid (Recommended)
```
Foundation Nodes (Fast, Global)
    +
Your Custom Node (Fast, Local)
    +
IPFS DHT (Slow, Ultimate Fallback)
```

**Best of both worlds:** Global reach + local speed

### Private Network
```
Your Bootstrap Nodes Only
    +
Your IPFS Swarm
    +
No External Dependencies
```

**Complete isolation:** For corporate/private deployments

### Community Mesh
```
100+ Community Bootstrap Nodes
    +
P2P Discovery via Pubsub
    +
No Central Authority
```

**True decentralization:** Network owned by community

---

## Security Considerations

### Trust Model

**Foundation Nodes:**
- Maintained by FRW core team
- Regular security audits
- 99.9% uptime SLA
- Can be verified via multiple sources

**Custom Nodes:**
- You control them
- Your responsibility for uptime
- Your security policies
- Can collude with your other nodes

**Remember:** Bootstrap nodes CAN'T:
- ✗ Fake name ownership (signatures prevent this)
- ✗ Censor names (DHT has them too)
- ✗ Control the network (P2P mesh)
- ✓ Only index and serve for speed

---

## Config File Location

### Linux/Mac
```
~/.frw/config.json
```

### Windows
```
C:\Users\YourName\.frw\config.json
```

### Example Full Config

```json
{
  "keypair": {
    "algorithm": "ed25519",
    "encrypted": false
  },
  "bootstrapNodes": {
    "useDefaults": true,
    "customNodes": [
      "http://my-node.example.com:3100"
    ]
  },
  "ipfs": {
    "url": "http://localhost:5001"
  },
  "registeredNames": {
    "myname": {
      "publicKey": "...",
      "registered": 1699999999999
    }
  }
}
```

---

## Troubleshooting

### Custom Node Not Working

```bash
# 1. Check node is reachable
curl http://your-node:3100/health

# 2. Check firewall
# Ensure ports 3100 and 4001 are open

# 3. Check config syntax
cat ~/.frw/config.json | jq  # Should parse without errors

# 4. Check CLI logs
frw register testname --verbose
```

### Names Not Syncing

```bash
# 1. Check IPFS pubsub is enabled
ssh your-node "ipfs config Pubsub.Enabled"

# 2. Check node can reach other bootstraps
ssh your-node "curl http://83.228.214.189:3100/health"

# 3. Check logs for sync messages
ssh your-node "sudo journalctl -u frw-bootstrap -f | grep Sync"
```

---

## Performance Comparison

### Using Default Nodes Only
```
Name Resolution: ~100ms (European users)
Name Resolution: ~200ms (US users)
Name Resolution: ~300ms (Asian users)
```

### Adding Regional Node
```
Name Resolution: ~20ms (local network)
Name Resolution: ~50ms (same continent)
Fallback: ~100-300ms (foundation nodes)
```

### Private Network (No External)
```
Name Resolution: ~10ms (LAN)
Name Resolution: ~50ms (same datacenter)
No public fallback (by design)
```

---

## Best Practices

### For Public Nodes
1. ✓ Commit to 99% uptime
2. ✓ Use HTTPS if possible
3. ✓ Monitor with health checks
4. ✓ Keep IPFS up to date
5. ✓ Enable pubsub for sync

### For Private Nodes
1. ✓ Isolate from public network if needed
2. ✓ Use firewall rules
3. ✓ Regular backups
4. ✓ Monitor resource usage
5. ✓ Document for your team

### For All Nodes
1. ✓ Use SSD for IPFS storage
2. ✓ At least 2GB RAM
3. ✓ Stable network connection
4. ✓ Automated restarts (systemd)
5. ✓ Log monitoring

---

## Summary

**Default:** 4 foundation bootstrap nodes (works out of the box)  
**Custom:** Add your own nodes via config file  
**Override:** Replace all nodes for private networks  
**Hybrid:** Best of both worlds (foundation + custom)  
**Decentralized:** DHT fallback works without ANY bootstrap nodes  

**Bootstrap nodes = convenience, not requirement!**

---

## Support

Need help setting up custom bootstrap nodes?

1. Check docs: `docs/deployment/DEPLOY_NOW_VPS.md`
2. Test config: `frw config show`
3. Verify nodes: `curl http://your-node:3100/health`
4. Check logs: CLI runs with `--verbose` flag

**Your bootstrap node is part of the decentralized web!** 🌐
