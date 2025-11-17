# FRW V2 QUANTUM-RESISTANT DEPLOYMENT GUIDE

## PRE-DEPLOYMENT CHECKLIST

### Step 1: Install V2 Package Dependencies

```bash
# Install dependencies for crypto-pq package
cd packages/crypto-pq
npm install @noble/post-quantum@^0.2.0 @noble/hashes@^1.4.0 tweetnacl@^1.0.3 bs58@^5.0.0
npm run build

# Install dependencies for pow-v2 package
cd ../pow-v2
npm install argon2@^0.31.0 @noble/hashes@^1.4.0
npm run build

# Install dependencies for protocol-v2 package
cd ../protocol-v2
npm install cbor-x@^1.5.0
npm run build

# Go back to root
cd ../..
```

### Step 2: Link V2 Packages Locally

```bash
# Link packages for local development
cd packages/crypto-pq
npm link

cd ../pow-v2
npm link

cd ../protocol-v2
npm link @frw/crypto-pq @frw/pow-v2
npm link

cd ../..
```

### Step 3: Verify V2 Packages Build

```bash
# Check that all packages compiled successfully
ls -la packages/crypto-pq/dist/
ls -la packages/pow-v2/dist/
ls -la packages/protocol-v2/dist/

# All should have index.js, index.d.ts, and other compiled files
```

## V2 INTEGRATION STATUS

### ✓ COMPLETE
- Formal specification (FRW_PROTOCOL_V2_SPEC.md)
- Test vectors (TEST_VECTORS_V2.md)
- Security proofs (FORMAL_PROOFS_V2.md)
- Migration strategy (MIGRATION_PATH_V2.md)
- State machine (STATE_MACHINE_V2.md)
- Crypto package (@frw/crypto-pq)
- PoW package (@frw/pow-v2)
- Protocol package (@frw/protocol-v2)

### → IN PROGRESS (This Deployment)
- Hybrid distributed registry (V1 + V2 support)
- Bootstrap node V2 endpoints
- CLI V2 commands
- Chrome extension V2 support

### ⏳ PENDING
- Production V2 bootstrap nodes
- Migration tools
- Performance optimization
- Security audit

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────┐
│              EXISTING V1 SYSTEM                      │
│  - Ed25519 signatures                                │
│  - SHA-256 hashing                                   │
│  - SHA-256 PoW                                       │
│  - 1 KB records                                      │
└─────────────────────────────────────────────────────┘
                        ↓
                   COEXISTENCE
                        ↓
┌─────────────────────────────────────────────────────┐
│            HYBRID SYSTEM (2025-2035)                 │
│                                                       │
│  ┌───────────────┐         ┌───────────────┐       │
│  │   V1 Names    │         │   V2 Names    │       │
│  │  (Legacy)     │         │  (Quantum)    │       │
│  └───────────────┘         └───────────────┘       │
│                                                       │
│  Resolution: Try V2 first, fallback to V1           │
│  Bootstrap: Serve both formats                      │
│  Verification: V1 or V2 depending on version        │
└─────────────────────────────────────────────────────┘
                        ↓
                  MIGRATION (2030+)
                        ↓
┌─────────────────────────────────────────────────────┐
│              V2-ONLY SYSTEM (2035+)                  │
│  - Dilithium3 signatures                             │
│  - SHA3-256 hashing                                  │
│  - Argon2id PoW                                      │
│  - 10 KB records                                     │
│  - 100% quantum-secure                               │
└─────────────────────────────────────────────────────┘
```

## BACKWARD COMPATIBILITY GUARANTEE

```typescript
// V1 clients can:
✓ Resolve V1 names (forever)
✗ Resolve V2 names (unrecognized format)

// V2 clients can:
✓ Resolve V2 names (preferred)
✓ Resolve V1 names (fallback, with warning)
✓ Register V2 names (quantum-secure)
✓ Migrate V1 → V2 (with ownership proof)

// Bootstrap nodes V2:
✓ Index V1 names (legacy support)
✓ Index V2 names (primary)
✓ Serve both formats via API
✓ Verify both V1 and V2 proofs
```

## DEPLOYMENT PHASES

### Phase 1: Silent Deployment (Week 1)
```
Goal: V2 infrastructure ready, no user action required
Tasks:
  [√] Install V2 package dependencies
  [ ] Deploy hybrid distributed registry
  [ ] Update bootstrap nodes with V2 endpoints
  [ ] Test V1 compatibility (ensure nothing breaks)
  [ ] Monitor for 7 days
Status: In Progress
```

### Phase 2: Soft Launch (Week 2-4)
```
Goal: Early adopters can use V2, V1 remains default
Tasks:
  [ ] Add CLI command: frw init-v2
  [ ] Add CLI command: frw register-v2
  [ ] Add CLI command: frw migrate
  [ ] Documentation for early adopters
  [ ] Community announcement (optional V2)
Status: Pending
```

### Phase 3: V2 Promotion (Month 2-12)
```
Goal: Encourage V2 adoption, V1 remains supported
Tasks:
  [ ] Make V2 default for new registrations
  [ ] Display "Upgrade to V2" prompts in CLI
  [ ] Migration incentives (faster PoW difficulty?)
  [ ] Chrome extension shows V2 badge
Status: Pending (2025 Q2-Q4)
```

### Phase 4: V1 Deprecation (2026-2030)
```
Goal: Push remaining users to V2
Tasks:
  [ ] Deprecation warnings on V1 registrations
  [ ] V1 registration disabled (2033)
  [ ] V1 resolution warnings (2034)
Status: Pending (2026+)
```

### Phase 5: V2-Only (2035+)
```
Goal: Pure quantum-secure operation
Tasks:
  [ ] Disable V1 resolution completely
  [ ] Remove V1 code
  [ ] Celebrate quantum readiness
Status: Pending (2035+)
```

## TESTING PROTOCOL

### Before Deployment
```bash
# Test V1 still works
frw resolve sovathasok
# Should return contentCID

# Test V1 registration still works
frw register testv1name ./content
# Should complete successfully

# Test bootstrap node health
curl http://localhost:3100/health
# Should return OK
```

### After V2 Integration
```bash
# Test V2 keypair generation
frw init-v2
# Should create V2 keypair in ~/.frw/keys-v2.json

# Test V2 registration (8+ char name for fast PoW)
frw register-v2 testnamev2 ./content
# Should compute Argon2id PoW (~6 min for 8-char)

# Test V2 resolution
frw resolve testnamev2
# Should return V2 record with pqSecure: true

# Test V1 still resolves
frw resolve sovathasok
# Should still work with legacy verification
```

### Verification Checklist
```
[ ] V1 names still resolve
[ ] V1 registration still works
[ ] V1 bootstrap API functional
[ ] V2 packages compile without errors
[ ] V2 keypair generation works
[ ] V2 PoW computation works
[ ] V2 signatures verify correctly
[ ] V2 records serialize/deserialize
[ ] Bootstrap nodes serve both V1/V2
[ ] Chrome extension still works with V1
```

## ROLLBACK PROCEDURE

If V2 causes issues:

```bash
# 1. Stop affected services
pm2 stop bootstrap-node

# 2. Revert to V1-only code
git checkout main  # or previous stable commit

# 3. Rebuild
npm run build

# 4. Restart services
pm2 restart bootstrap-node

# 5. Investigate issue in separate branch
git checkout -b fix-v2-issue
```

## MONITORING

### Metrics to Track
```
- V1 resolution success rate
- V2 resolution success rate
- V1 registration count
- V2 registration count
- Bootstrap node response times
- PoW computation times (V1 vs V2)
- Error rates by version
- Cache hit rates
```

### Alert Thresholds
```
CRITICAL:
  - V1 resolution success < 95%
  - Bootstrap node down
  - V1 registration failing

WARNING:
  - V2 resolution success < 90%
  - V2 PoW taking > 2x expected time
  - High error rates
```

## COMMUNITY COMMUNICATION

### Announcement Template
```
# FRW Protocol V2: Quantum-Resistant Upgrade

We're excited to announce FRW Protocol V2, a quantum-resistant upgrade 
that ensures FRW remains secure against future quantum computers.

**What's changing:**
- New quantum-resistant cryptography (Dilithium3)
- Memory-hard proof of work (Argon2id)
- Enhanced security guarantees

**What's staying the same:**
- All existing V1 names continue to work
- No action required for existing users
- Free, decentralized, no authorities

**For early adopters:**
- Try V2 with: frw init-v2
- Migrate existing names: frw migrate <name>
- Full backward compatibility

**Timeline:**
- 2025: V1 and V2 coexist
- 2035: V2-only mode (10-year transition)

More info: https://frw.community/docs/v2
```

## BOOTSTRAP NODE DEPLOYMENT

### Update Bootstrap Nodes (Swiss VPS)

```bash
# SSH into bootstrap node
ssh user@83.228.214.189

# Pull latest code
cd /opt/frw/apps/bootstrap-node
git pull origin v2-integration

# Install V2 dependencies
cd /opt/frw/packages/crypto-pq && npm install && npm run build
cd /opt/frw/packages/pow-v2 && npm install && npm run build
cd /opt/frw/packages/protocol-v2 && npm install && npm run build

# Rebuild bootstrap node
cd /opt/frw/apps/bootstrap-node
npm install
npm run build

# Restart service
pm2 restart frw-bootstrap

# Verify
curl http://localhost:3100/health
curl http://localhost:3100/api/version  # Should show V2 support
```

## EXPECTED OUTCOMES

### Week 1
- V2 infrastructure deployed
- All V1 functionality preserved
- Zero user-facing changes

### Week 2-4
- Early adopters testing V2
- First V2 names registered
- Documentation feedback

### Month 2-6
- Growing V2 adoption
- Community excitement
- Performance optimization

### Year 1
- 20-50% V2 adoption
- Proven stability
- Ecosystem support

## TROUBLESHOOTING

### Issue: V2 packages won't build
```
Solution:
1. Check Node.js version (need 18+)
2. Clear node_modules: rm -rf node_modules package-lock.json
3. Reinstall: npm install
4. Check for missing dependencies
```

### Issue: Argon2 won't install (Windows)
```
Solution:
1. Install Windows Build Tools:
   npm install --global windows-build-tools
2. Or use WSL2 for development
3. Or use pre-built binaries
```

### Issue: V1 names stop resolving
```
Solution:
1. CRITICAL: Rollback immediately
2. Check distributed-registry.ts changes
3. Ensure V1 resolution path intact
4. Test in isolated environment first
```

### Issue: V2 PoW too slow
```
Solution:
1. Expected for short names (3-5 chars: hours/days)
2. Use 8+ char names for testing (~6 min)
3. Optimize Argon2 parameters if needed
4. Consider parallelization for production
```

## SUCCESS CRITERIA

```
Deployment is successful if:
✓ All existing V1 names resolve correctly
✓ V1 registration still works
✓ V2 infrastructure is operational
✓ No increase in error rates
✓ Bootstrap nodes healthy
✓ Community has no blocking issues

Deployment should be rolled back if:
✗ V1 resolution success < 95%
✗ Critical errors in production
✗ Data loss or corruption
✗ Bootstrap nodes unstable
```

## NEXT STEPS AFTER DEPLOYMENT

1. Monitor for 7 days
2. Collect early adopter feedback
3. Document any issues
4. Optimize performance
5. Plan soft launch announcement
6. Prepare migration tools
7. Security audit
8. Scale bootstrap nodes

---

**Status**: Ready for deployment
**Risk Level**: Low (backward compatible)
**Rollback Plan**: Available
**Timeline**: Phase 1 deployment now, soft launch Week 2

Let's make FRW quantum-secure! 🔐🚀
