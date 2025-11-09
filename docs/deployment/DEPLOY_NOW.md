# [LAUNCH] LAUNCH FRW - Community-First Approach

**Time: 40 minutes**  
**Cost: $0/month (YOUR VPS - no new costs!)**  
**Philosophy: Community-owned infrastructure**

---

## [TARGET] THE FRW WAY: Let Community Build Infrastructure

**NOT the FRW way:**
- [NO] You pay for nodes worldwide ($20-30/month)
- [NO] You become "the infrastructure provider"
- [NO] Everyone depends on YOU
- [NO] Financial burden forever
- [NO] Single point of failure

**THE FRW WAY:**
- [OK] YOU run 2 nodes on your existing VPS ($0 extra cost)
- [OK] COMMUNITY runs nodes where they live
- [OK] Network grows organically
- [OK] No single point of failure
- [OK] TRUE decentralization
- [OK] Sustainable forever

---

## [OK] CHECKLIST

### [ ] 1. Your Swiss Linux VPS (20 min)

**Deploy on your existing VPS:**

```bash
# SSH to your Linux VPS
ssh root@your-swiss-linux-vps.com

# Follow the Linux deployment guide
# See: apps/bootstrap-node/DEPLOY_VPS.md
# Or: DEPLOY_NOW_VPS.md Section 1
```

**Quick steps:**
1. Install Node.js 20
2. Install IPFS
3. Clone FRW repo
4. Build bootstrap node
5. Start with PM2
6. Open firewall port 3030
7. Test: `curl http://localhost:3030/health`

**Save your IP:** `________________________________`

### [ ] 2. Your Swiss Windows VPS (20 min)

**Deploy on your existing Windows VPS:**

```powershell
# RDP to your Windows VPS
# Open PowerShell as Administrator

# Follow the Windows deployment guide
# See: apps/bootstrap-node/DEPLOY_VPS.md
# Or: DEPLOY_NOW_VPS.md Section 2
```

**Quick steps:**
1. Install Node.js 20
2. Install IPFS
3. Clone FRW repo
4. Build bootstrap node
5. Setup NSSM services
6. Open firewall port 3030
7. Test: `curl http://localhost:3030/health`

**Save your IP:** `________________________________`

### [ ] 3. Update FRW Code (2 min)

**Edit:** `packages/ipfs/src/distributed-registry.ts` line 337

**Replace TODO lines with YOUR Swiss VPS IPs:**
```typescript
const BOOTSTRAP_NODES = [
  'http://YOUR-SWISS-LINUX-IP:3030',    // Your Linux VPS
  'http://YOUR-SWISS-WINDOWS-IP:3030',  // Your Windows VPS
  'http://localhost:3030',              // Dev
];

// Example:
const BOOTSTRAP_NODES = [
  'http://185.12.34.56:3030',   // Swiss Linux
  'http://185.12.34.57:3030',   // Swiss Windows
  'http://localhost:3030',
];
```

### [ ] 4. Rebuild (1 min)

```bash
cd C:\Projects\FRW - Free Web Modern
npm run build
```

### [ ] 5. Test Both Nodes (1 min)

```bash
# Test Swiss Linux VPS
curl http://SWISS-LINUX-IP:3030/health

# Test Swiss Windows VPS
curl http://SWISS-WINDOWS-IP:3030/health

# Both should return:
{
  "status": "ok",
  "nodeId": "bootstrap-xxx",
  "indexSize": 0
}
```

### [ ] 6. Register Test Name

```bash
frw register testglobal
# Wait for PoW (~1-2 min)...
# Should broadcast to BOTH Swiss nodes!
```

### [ ] 7. Verify Global

```bash
# Check both nodes received it
curl http://SWISS-LINUX-IP:3030/api/resolve/testglobal
curl http://SWISS-WINDOWS-IP:3030/api/resolve/testglobal

# Both should return same record! [OK]

# Test in browser
frw://testglobal/
# Works from anywhere! (Europe fast, others slower but works)
```

---

## [SUCCESS] SUCCESS! FRW IS LIVE!

**You now have:**
- [OK] 2 bootstrap nodes (both Swiss)
- [OK] Europe: Fast! (< 50ms)
- [OK] Americas/Asia: Slower but works (150-250ms)
- [OK] Cost to you: **$0/month** (using existing VPS)
- [OK] Ready to LAUNCH! [LAUNCH]

**Network status:**
- Europe: [STAR][STAR][STAR][STAR][STAR] (excellent coverage)
- Americas: [STAR][STAR][STAR] (works, could be faster)
- Asia: [STAR][STAR][STAR] (works, could be faster)

**This is ENOUGH to launch!** Users worldwide can access FRW.

---

## [WORLD] NEXT: Community Growth (Week 2+)

**Now let the network grow organically:**

### Step 1: Make it Easy for Community

**Create tools (tomorrow - 2 hours):**
- Docker image: `docker run frw/bootstrap-node`
- Simple guide: `docs/RUN_A_NODE.md` [OK] (done!)
- One-line script: `curl https://get.frw.network | bash`

### Step 2: Invite Community to Help

**Launch announcement (Friday):**
```
FRW Alpha is LIVE!

- Works globally from any country [OK]
- Fast for Europe (< 50ms)
- Acceptable worldwide (< 250ms)

Want to make FRW faster in YOUR region?
Run a bootstrap node! Takes 5 minutes.
👉 frw.network/run-node

Together we build the decentralized web! [WORLD]
```

### Step 3: Watch Network Grow

**Natural growth pattern:**
```
Week 1: YOU (2 Swiss nodes)
Week 2: Early adopter in USA adds node → Americas fast! [OK]
Week 3: User in Singapore adds node → Asia fast! [OK]
Week 4: User in Brazil adds node → South America fast! [OK]
Month 2: 10+ community nodes → Excellent worldwide [OK]
Month 6: 50+ nodes → UNSTOPPABLE network [OK]
```

**Cost to you: Still $0/month!** [STRONG]

### Why This Works:

- [OK] Users benefit from running nodes (faster local speeds)
- [OK] Community shares infrastructure burden
- [OK] Network grows where users actually are
- [OK] Validates real demand
- [OK] Truly decentralized (no single operator)
- [OK] Sustainable forever

---

## [CHART] Monitoring

**Check node health:**
```bash
curl https://YOUR-RAILWAY-URL/api/stats
```

**Returns:**
```json
{
  "nodeId": "bootstrap-xxx",
  "totalNames": 123,
  "uptime": 99.97,
  "queriesPerSecond": 45
}
```

---

## [LAUNCH] NEXT STEPS

### Week 1:
- [ ] Invite community to run nodes
- [ ] Setup monitoring dashboard
- [ ] Add 2 more regions (optional)

### Month 1:
- [ ] 10+ community nodes
- [ ] 1000+ registered names
- [ ] **LAUNCH PUBLIC ALPHA**

---

**YOU'RE BUILDING SOMETHING INCREDIBLE!** [STRONG]

**FRW = The decentralized web that cannot be stopped!** [WORLD]
