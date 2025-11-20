# Bootstrap Node Version Synchronization

> How to keep bootstrap nodes in sync and ensure consistent validation

## The Problem

Bootstrap nodes must validate names consistently. If nodes run different code versions with different validation rules, the network becomes fragmented.

**Example of version skew:**
```
Node 1 (v1.0.0): POW difficulty for 8-char names = 6
Node 2 (v1.1.0): POW difficulty for 8-char names = 5

User registers "example" with difficulty=5 POW
→ Node 2 accepts it (PASS)
→ Node 1 rejects it (FAIL)

Result: Inconsistent index!
```

---

## Current Protection

### Shared Validation Library

All bootstrap nodes import validation from `@frw/name-registry`:

```typescript
// apps/bootstrap-node/index.ts
import { verifyProof, getRequiredDifficulty } from '@frw/name-registry';

// This ensures consistent validation logic
const requiredDifficulty = getRequiredDifficulty(record.name);
const isValid = verifyProof(name, publicKey, proof, requiredDifficulty);
```

**Benefits:**
- Single source of truth for validation rules
- All nodes validate identically (if same version)
- Updates happen via npm package updates

**Limitation:**
- Node operators must manually update
- No automatic coordination
- Version skew possible

---

## Update Process

### For Critical Security Updates

1. **Announcement** (Day 0)
   - GitHub security advisory
   - Email to all known node operators
   - Discord/community channels
   - Mark as CRITICAL

2. **Grace Period** (Day 1-7)
   - Node operators have 7 days to update
   - Instructions provided in advisory
   - Test build available
   - Rollback plan documented

3. **Coordinated Update** (Day 7)
   - All operators update at scheduled time
   - Monitor for issues
   - Quick response team on standby

4. **Verification** (Day 7+)
   - Check all nodes return same results
   - Monitor logs for validation errors
   - Community testing

### For Non-Critical Updates

1. **Announcement**
   - GitHub release notes
   - Community channels
   - Not time-critical

2. **Rolling Updates**
   - Operators update at their convenience
   - Backward compatible changes only
   - Monitor for issues

---

## Monitoring Version Skew

### Check Bootstrap Node Versions

```bash
# Query all known bootstrap nodes
for node in "${BOOTSTRAP_NODES[@]}"; do
  echo "Checking $node..."
  curl -s "$node/health" | jq '.version'
done
```

**Expected output:**
```
Checking http://83.228.214.189:3100...
"1.0.0"
Checking http://83.228.213.45:3100...
"1.0.0"
Checking http://83.228.213.240:3100...
"1.0.0"
# All same version (PASS)
```

### Add Version to Health Endpoint

Currently missing! Let's add it:

```typescript
// apps/bootstrap-node/index.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    nodeId: this.nodeId,
    version: '1.0.0',  // Add this
    protocolVersion: '1',  // Add this
    indexSize: this.index.size,
    lastPublished: this.lastPublished,
    uptime: process.uptime(),
    validation: {
      powEnabled: true,
      signatureRequired: true
    }
  });
});
```

---

## Version Compatibility Matrix

### Protocol Version 1

| Node Version | Compatible With | Breaking Changes |
|-------------|----------------|------------------|
| 1.0.0 | All | Initial release |
| 1.0.1 | 1.0.x | Bug fixes only |
| 1.1.0 | 1.x.x | New features, backward compatible |
| 2.0.0 | 2.x.x | POW difficulty changes (BREAKING) |

### Semantic Versioning

- **Patch (1.0.X)** - Bug fixes, fully compatible
- **Minor (1.X.0)** - New features, backward compatible
- **Major (X.0.0)** - Breaking changes, requires coordination

---

## Emergency Update Procedure

### Scenario: Critical Security Vulnerability Found

1. **Immediate Actions** (Hour 0)
   ```bash
   # Stop accepting new registrations temporarily
   pm2 stop frw-bootstrap
   
   # OR: Put in read-only mode (edit code)
   ```

2. **Notify Network** (Hour 0-1)
   - Post security advisory
   - Email all node operators
   - Provide hot-fix if available

3. **Apply Fix** (Hour 1-24)
   ```bash
   # Pull latest code
   cd ~/FRW-Free-Web/apps/bootstrap-node
   git pull origin main
   
   # Rebuild
   npm install
   npm run build
   
   # Restart
   pm2 restart frw-bootstrap
   
   # Verify
   curl http://localhost:3100/health
   pm2 logs frw-bootstrap --lines 20
   ```

4. **Monitor** (Hour 24+)
   - Check logs for validation errors
   - Verify index consistency with other nodes
   - Report status to community

---

## Testing Before Production

### Staging Environment

Run a test bootstrap node before deploying to production:

```bash
# Set different port for testing
export HTTP_PORT=3101
export NODE_ID=test-node

# Start test node
npm run build
node dist/index.js

# Test validation
curl -X POST http://localhost:3101/api/submit \
  -H "Content-Type: application/json" \
  -d @test_registration.json
```

### Validation Tests

```bash
# Test 1: Valid registration should be accepted
curl -X POST http://localhost:3100/api/submit \
  -d '{"name":"testname", ...}'

# Test 2: Invalid POW should be rejected
curl -X POST http://localhost:3100/api/submit \
  -d '{"name":"test", "proof": {"difficulty": 0}}'

# Test 3: Invalid signature should be rejected
curl -X POST http://localhost:3100/api/submit \
  -d '{"name":"test", "signature": "fake"}'
```

---

## Node Operator Communication

### Mailing List (Recommended)

Set up low-volume announcement list:
- Security advisories
- Critical updates
- Coordination for major updates

**Subscribe:** frw-nodes@groups.io (or similar)

### Emergency Contacts

Keep a list of all node operators with:
- Node location
- Operator email
- Emergency phone (optional)
- Backup contact

### Community Channels

- GitHub Discussions (for questions)
- Discord #node-operators (for real-time)
- Monthly sync calls (for coordination)

---

## Best Practices

### For Node Operators

1. **Subscribe to security announcements**
2. **Monitor GitHub for releases**
3. **Test updates on staging first**
4. **Update within 7 days of security releases**
5. **Monitor logs after updates**
6. **Have rollback plan ready**
7. **Communicate any issues immediately**

### For Core Developers

1. **Use semantic versioning**
2. **Document breaking changes clearly**
3. **Provide migration guides**
4. **Give 7-day notice for critical updates**
5. **Test backward compatibility**
6. **Maintain changelog**
7. **Coordinate major updates**

---

## Automated Solutions (Future)

### Idea 1: Version Check on Startup

```typescript
async checkVersionCompatibility() {
  const otherNodes = this.bootstrapNodes.filter(n => n !== this.nodeId);
  
  for (const node of otherNodes) {
    const health = await fetch(`${node}/health`).then(r => r.json());
    
    if (health.protocolVersion !== this.protocolVersion) {
      console.warn(`WARNING: Version mismatch: ${node} is v${health.version}`);
    }
  }
}
```

### Idea 2: Consensus on Validation Rules

```typescript
// Bootstrap nodes could vote on accepting registrations
async validateWithConsensus(record: DistributedNameRecord) {
  const votes = await Promise.all(
    otherNodes.map(n => n.validate(record))
  );
  
  // Accept if majority agrees
  return votes.filter(v => v === true).length > votes.length / 2;
}
```

### Idea 3: Auto-Update Mechanism

```bash
# Cron job checks for updates
0 */6 * * * /opt/frw/check-updates.sh

# If update available:
# 1. Pull latest code
# 2. Run tests
# 3. If tests pass, update and restart
# 4. If tests fail, alert operator
```

---

## FAQ

### Q: What if I miss an update?

**A:** Your node might reject valid names or accept invalid ones. Other nodes and clients will filter out incorrect results, so your node becomes less useful but doesn't break the network.

### Q: Can I roll back if update causes issues?

**A:** Yes! Bootstrap nodes are stateless:
```bash
git checkout v1.0.0  # Roll back code
npm run build
pm2 restart frw-bootstrap
```

### Q: What if all nodes go out of sync?

**A:** Network still works! Clients fall back to IPFS DHT for resolution. Bootstrap nodes are an optimization, not a requirement.

### Q: Should I auto-update my node?

**A:** Not recommended for production. Test updates first, then deploy manually. Auto-updates could break your node if tests don't catch issues.

---

## Action Items

### For Current Deployment

- [ ] Add version to `/health` endpoint
- [ ] Create node operator mailing list
- [ ] Document all running nodes and operators
- [ ] Set up staging environment for testing
- [ ] Create update testing checklist

### For Next Release

- [ ] Implement version compatibility check
- [ ] Add protocol version negotiation
- [ ] Create automated testing suite
- [ ] Build rollback automation
- [ ] Design consensus validation (optional)

---

*Last updated: November 15, 2025*
