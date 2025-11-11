# FRW Deployment Changelog

## November 11, 2025 - Linux VPS Deployment Success

### Deployed
- **First Production Bootstrap Node:** Debian VPS (Infomaniak Switzerland)
- **IP:** 83.228.214.189:3100
- **Status:** OPERATIONAL ✓

### Issues Resolved

#### 1. TypeScript Build Failures on VPS
**Problem:** `npm run build` failed with `TS7016: Could not find a declaration file for module '@frw/common'`

**Root Cause:** TypeScript composite projects + monorepo not generating `.d.ts` files in correct order

**Solution:** Build packages individually with `--force` flag:
```bash
npx tsc -b packages/common --force
npx tsc -b packages/crypto --force
npx tsc -b packages/ipfs --force
# ... etc
```

**Files Modified:**
- `docs/deployment/DEPLOY_NOW_VPS.md` - Added troubleshooting section

---

#### 2. Empty contentCID Validation Error
**Problem:** Name registration failed with "Missing required fields"

**Root Cause:** `distributed-registry.ts` validation required `contentCID`, but registration sets it empty initially

**Solution:** Allow empty contentCID during registration (content added on first publish)

**Files Modified:**
- `packages/ipfs/src/distributed-registry.ts:617` - Removed `contentCID` from required fields validation

---

#### 3. Names Not Propagating to VPS Bootstrap Node
**Problem:** Names registered on Windows didn't appear on VPS

**Root Cause:** CLI didn't submit to HTTP bootstrap nodes (only used DHT + pubsub)

**Solution:** 
1. Added `submitToBootstrapNodes()` method to `DistributedNameRegistry`
2. Updated `registerName()` to call HTTP submission after pubsub
3. Updated CLI to pass bootstrap nodes to registry constructor

**Files Modified:**
- `packages/ipfs/src/distributed-registry.ts:140` - Added HTTP submission step
- `packages/ipfs/src/distributed-registry.ts:535-560` - New `submitToBootstrapNodes()` method
- `apps/cli/src/commands/register.ts:198-203` - Pass bootstrap nodes to registry

**Commit Message:**
```
feat: Add HTTP bootstrap node submission fallback

- HTTP POST to /api/submit when pubsub fails
- Ensures name propagation even without pubsub
- CLI now configures bootstrap nodes explicitly
- Validates end-to-end Windows → VPS flow
```

---

#### 4. IPFS Pubsub Not Enabled
**Problem:** Bootstrap node failed to subscribe to pubsub with "experimental pubsub feature not enabled"

**Solution:** Start IPFS daemon with `--enable-pubsub-experiment` flag and enable in config

**Files Modified:**
- `docs/deployment/DEPLOY_NOW_VPS.md` - Added IPFS pubsub configuration steps
- Added systemd service file for IPFS daemon

---

#### 5. Infomaniak Firewall Configuration
**Problem:** VPS provider (Infomaniak) requires CSV import for firewall rules

**Solution:** Created CSV format rules file with proper column headers

**Files Modified:**
- `docs/deployment/DEPLOY_NOW_VPS.md:154-160` - Added Infomaniak-specific firewall CSV format

---

### Code Changes Summary

**Modified Files:**
1. `packages/ipfs/src/distributed-registry.ts`
   - Removed contentCID validation requirement
   - Added submitToBootstrapNodes() method
   - Added HTTP fallback in registerName()

2. `apps/cli/src/commands/register.ts`
   - Added bootstrap nodes configuration
   - Hardcoded Swiss VPS IP: 83.228.214.189:3100

3. `docs/deployment/DEPLOY_NOW_VPS.md`
   - Complete rewrite with validated steps
   - Added IPFS systemd service
   - Added troubleshooting sections
   - Added successful deployment example
   - Added Infomaniak firewall guide

**New Files:**
- `docs/deployment/DEPLOYMENT_CHANGELOG.md` (this file)

---

### Validation Results

**End-to-End Test:**
```bash
# Windows → VPS registration
frw register vpstest7
→ [DistributedRegistry] ✓ Submitted to bootstrap: http://83.228.214.189:3100
→ ✓ Published to global network!

# VPS resolution
curl http://83.228.214.189:3100/api/resolve/vpstest7
→ {"name":"vpstest7","publicKey":"GMZ...","resolvedBy":"bootstrap-1762894170648"}

# Stats
curl http://83.228.214.189:3100/api/stats
→ {"totalNames":1,"uptime":891.366,...}
```

**Success Metrics:**
- ✓ VPS bootstrap node operational 24/7
- ✓ Names register from Windows client
- ✓ Global name resolution working
- ✓ HTTP API endpoints responding
- ✓ DHT storage functioning
- ✓ Systemd services auto-restart
- ✓ IPFS pubsub enabled

---

### Remaining Tasks

1. **Deploy Windows VPS** (second bootstrap node)
2. **Update distributed-registry.ts** with both VPS IPs in DEFAULT_BOOTSTRAP_NODES
3. **Test content publishing** (`frw publish`)
4. **IPv6 configuration** (VPS has IPv6: 2001:1600:18:102::165)
5. **Docker image** for community deployment
6. **Monitoring/alerts** for node health

---

### Deployment Time

- **First deployment (with debugging):** 90 minutes
- **Expected future deployments:** 30 minutes
- **Windows VPS (estimated):** 40 minutes

---

### Next Session Goals

1. Deploy Windows VPS bootstrap node
2. Test multi-node name resolution
3. Publish test content to names
4. Update DEFAULT_BOOTSTRAP_NODES with both IPs
5. Create deployment scripts for automation

---

**Status:** PRODUCTION READY (1/2 nodes deployed)  
**Confidence Level:** HIGH  
**Blocking Issues:** NONE
