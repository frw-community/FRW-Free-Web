# FRW V2 DEPLOYMENT CHECKLIST - TONIGHT

**Date:** November 18, 2025  
**Status:** Ready for Deployment  
**Phase:** Silent Deployment (V1 remains operational)

---

## PRE-DEPLOYMENT STATUS ✅

### V2 Packages Built
- ✅ **@frw/crypto-pq** - 19,552 bytes compiled
- ✅ **@frw/pow-v2** - 17,952 bytes compiled
- ✅ **@frw/protocol-v2** - 20,495 bytes compiled
- ✅ All TypeScript compilation successful
- ✅ All dependencies installed

### Documentation Complete
- ✅ FRW_PROTOCOL_V2_SPEC.md (formal specification)
- ✅ TEST_VECTORS_V2.md (13 test vectors)
- ✅ FORMAL_PROOFS_V2.md (10 security proofs)
- ✅ MIGRATION_PATH_V2.md (10-year timeline)
- ✅ STATE_MACHINE_V2.md (state transitions)
- ✅ DEPLOY_V2_NOW.md (deployment guide)

---

## TONIGHT'S TASKS

### Step 1: Run Unit Tests (5 minutes) ⏳

```powershell
cd packages
.\test-all-v2.ps1
```

**Expected Result:**
- All crypto-pq tests pass
- All pow-v2 tests pass (using long names = instant)
- All protocol-v2 integration tests pass
- Total time: < 30 seconds

**If tests fail:**
- Check error messages
- Verify node_modules installed
- Ensure Node.js 18+

---

### Step 2: Test V2 PoW with Real Name (10 minutes) ⏳

```powershell
# Create quick test script
cd packages/pow-v2
node -e "
const { generatePOWV2 } = require('./dist/index.js');
const name = 'testmanu2024long'; // 16+ chars = instant
const pk = new Uint8Array(1952).fill(1);
console.log('Starting PoW for:', name);
const start = Date.now();
generatePOWV2(name, pk).then(proof => {
  console.log('PoW complete in:', (Date.now() - start), 'ms');
  console.log('Difficulty:', proof.difficulty);
  console.log('Hash:', Buffer.from(proof.hash).toString('hex'));
});
"
```

**Expected:**
- Instant completion (< 1 second) for 16+ char names
- Valid proof structure
- Hash with correct leading zeros

---

### Step 3: Bootstrap Node Deployment (30 minutes) ⏳

#### A. SSH into Swiss VPS

```bash
ssh user@83.228.214.189  # Your Linux VPS
# OR
ssh user@[windows-vps-ip]  # Your Windows VPS
```

#### B. Pull Latest Code

```bash
cd /opt/frw  # Or your FRW directory
git pull origin main
```

#### C. Install V2 Dependencies

```bash
# Install V2 packages
cd packages/crypto-pq
npm install
npm run build

cd ../pow-v2
npm install
npm run build

cd ../protocol-v2
npm install
npm run build
```

#### D. Verify Builds

```bash
ls -la packages/crypto-pq/dist/
ls -la packages/pow-v2/dist/
ls -la packages/protocol-v2/dist/

# Should see .js and .d.ts files
```

#### E. Restart Bootstrap Node

```bash
# If using PM2
pm2 restart frw-bootstrap

# If using systemd
sudo systemctl restart frw-bootstrap

# Verify it's running
pm2 status
# OR
sudo systemctl status frw-bootstrap

# Check logs
pm2 logs frw-bootstrap --lines 50
```

#### F. Health Check

```bash
# Test bootstrap node API
curl http://localhost:3100/health
# Expected: {"status":"ok"}

# Test V1 resolution (should still work)
curl http://localhost:3100/api/resolve/sovathasok
# Expected: Your existing V1 record
```

---

### Step 4: Test from Local Machine (5 minutes) ⏳

```powershell
# Test bootstrap node from your machine
curl http://83.228.214.189:3100/health

# Test V1 resolution
curl http://83.228.214.189:3100/api/resolve/sovathasok

# Should return your existing name
```

---

## VERIFICATION CHECKLIST

### Critical Tests (MUST PASS)
- [ ] V1 names still resolve (e.g., `sovathasok`)
- [ ] Bootstrap nodes respond to health check
- [ ] No errors in bootstrap node logs
- [ ] V1 Chrome extension still works
- [ ] No breaking changes to existing functionality

### V2 Readiness (Optional Tonight)
- [ ] V2 packages compiled on bootstrap nodes
- [ ] V2 tests pass on bootstrap nodes
- [ ] Ready for integration work tomorrow

---

## ROLLBACK PROCEDURE (If Needed)

If anything breaks:

```bash
# 1. Stop bootstrap node
pm2 stop frw-bootstrap

# 2. Revert to previous commit
git log --oneline -5  # Find previous stable commit
git checkout <previous-commit-hash>

# 3. Rebuild
npm run build

# 4. Restart
pm2 restart frw-bootstrap

# 5. Verify V1 works
curl http://localhost:3100/api/resolve/sovathasok
```

---

## SUCCESS CRITERIA

### Minimum (Tonight)
✅ All unit tests pass on local machine  
✅ V2 packages deploy to bootstrap nodes without errors  
✅ **V1 functionality unchanged** (most important!)  
✅ Bootstrap nodes healthy  

### Bonus (Tonight or Tomorrow)
- [ ] V2 integration code started
- [ ] CLI v2 commands prototyped
- [ ] First V2 name registered (test)

---

## TIMING ESTIMATE

```
Unit tests:               5 min
Real PoW test:           10 min
Bootstrap deployment:    30 min (per node)
Verification:             5 min
Documentation:           10 min
─────────────────────────────
Total:                  ~60 min (1 hour)

With 2 VPS: ~90 minutes total
```

---

## NOTES

**Use Long Names for Fast Testing:**
- 16+ characters = instant PoW (< 1 second)
- 8 characters = ~6 minutes
- 5 characters = ~5 days (DON'T test this tonight! 😄)

**Safe Testing Names:**
- `testmanu2024long`
- `quicktestv2deployment`
- `verylongnameforfast`

**V1 Compatibility:**
- V2 deployment is **additive only**
- V1 names continue to work
- No breaking changes
- Bootstrap nodes serve both V1 and V2 (when integrated)

---

## CONTACT / SUPPORT

If issues arise:
- Check bootstrap node logs: `pm2 logs frw-bootstrap`
- Verify V1 still works first
- Rollback if V1 broken
- V2 integration can wait until tomorrow

---

**Status:** Ready to deploy! 🚀  
**Risk Level:** Low (backward compatible)  
**Time Required:** ~1-2 hours  
**Reversibility:** High (can rollback anytime)

Good luck with the deployment! 🔐
