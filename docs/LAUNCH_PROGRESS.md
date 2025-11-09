# [LAUNCH] FRW Launch Progress

**Decision:** Launch POSTPONED to Thursday to implement global name resolution

**Critical Issue Identified:** Names registered with `frw register` are only resolvable locally. FRW must be truly decentralized from day one.

---

## [OK] What Works Today (Saturday Evening)

- [OK] CLI: `frw register pouet` - Registers name with PoW
- [OK] CLI: `frw publish` - Publishes to IPFS with signatures
- [OK] Browser: Opens and displays FRW sites
- [OK] IPFS: Daemon working, content distributed
- [OK] Cryptographic signatures: Working perfectly
- [OK] 397 tests passing

## [NO] What Doesn't Work

- [NO] **Name Resolution is LOCAL ONLY**
  - User A registers `pouet` → only User A can resolve `frw://pouet/`
  - User B cannot access `frw://pouet/` (name not found)
  - This breaks the "decentralized web" promise

---

## [LIST] Implementation Plan - Next 4 Days

### Phase 1: Core Infrastructure (Sunday) [OK] STARTED

**Status:** 🟡 In Progress

**Files Created:**
- [OK] `packages/ipfs/src/dht.ts` - DHT name registry (simplified for now)
- [OK] `packages/ipfs/src/ipns-registry.ts` - IPNS registry manager
- [OK] `docs/DISTRIBUTED_NAME_REGISTRY.md` - Technical spec

**Next Steps:**
- [ ] Build the packages (`npm run build`)
- [ ] Test IPNS registry locally
- [ ] Create official registry IPNS key

---

### Phase 2: CLI Integration (Sunday Evening)

**Goal:** `frw register` publishes to IPNS registry

**Tasks:**
1. [ ] Update `apps/cli/src/commands/register.ts`
   - After PoW, create NameRecord
   - Publish to IPNS registry
   - Store registry key in config

2. [ ] Update `apps/cli/src/commands/publish.ts`
   - Update registry with new content CID
   - Associate name → CID in registry

3. [ ] Test locally:
   ```bash
   frw register testname
   frw publish ./site
   # Verify registry contains entry
   ```

**Files to modify:**
- `apps/cli/src/commands/register.ts`
- `apps/cli/src/commands/publish.ts`
- `apps/cli/src/config.ts` (add registry key)

---

### Phase 3: Browser Integration (Monday Morning)

**Goal:** Browser resolves names from IPNS registry

**Tasks:**
1. [ ] Create `packages/protocol/src/resolver.ts`
   - Name → PublicKey resolution
   - Cache with TTL
   - IPNS registry fallback

2. [ ] Update `apps/browser/src/protocol/handler.ts`
   - Use new resolver
   - Remove local config dependency

3. [ ] Test locally:
   ```bash
   # Terminal 1: Browser
   npm run dev
   
   # Terminal 2: Register & publish
   frw register mytestsite
   frw publish ./site
   
   # In browser: frw://mytestsite/
   # Should resolve!
   ```

**Files to modify:**
- `packages/protocol/src/resolver.ts` (NEW)
- `apps/browser/src/protocol/handler.ts`

---

### Phase 4: Two-Machine Testing (Monday Afternoon)

**Goal:** Prove it works globally

**Test 1: Virtual Machine**
```bash
# Host machine
frw register globaltest
frw publish ./site

# VM (fresh install)
npm install -g @frw/cli
# Open browser
# Navigate to frw://globaltest/
# Should work! [SUCCESS]
```

**Test 2: Different Physical Machine**
- Same test as above
- Verify IPNS propagation time
- Measure resolution speed

**Success Criteria:**
- [OK] Name resolves on different machine
- [OK] Resolution time < 30 seconds
- [OK] Content loads correctly
- [OK] Signatures verify

---

### Phase 5: Documentation & Polish (Tuesday)

**Tasks:**
1. [ ] Update `README.md`
   - Explain distributed name resolution
   - Add architecture diagram
   - Update quick start guide

2. [ ] Create `docs/NAME_RESOLUTION.md`
   - How it works
   - IPNS registry explanation
   - Future DHT implementation

3. [ ] Update launch posts (`docs/promotions/LAUNCH_POSTS.md`)
   - Emphasize "truly decentralized"
   - Explain name resolution
   - Add technical details

4. [ ] Test all examples in README
   - Verify they work
   - Add screenshots

5. [ ] Final testing round
   - Fresh install test
   - Cross-platform (Windows/Mac/Linux if possible)
   - Performance testing

---

### Phase 6: Pre-Launch Prep (Wednesday)

**Tasks:**
1. [ ] Create launch materials
   - Browser screenshots
   - CLI workflow GIF
   - Architecture diagram

2. [ ] GitHub repository final check
   - Enable Discussions
   - Create "good first issues"
   - Add topics/keywords
   - Verify all links work

3. [ ] Write launch posts
   - Reddit r/privacy
   - Hacker News
   - Twitter thread
   - Dev.to article

4. [ ] Set up registry infrastructure
   - Create official registry IPNS key
   - Document registry maintainer process
   - Plan for registry updates

5. [ ] Final code review
   - Check for TODOs
   - Verify no debug code
   - Test error messages

---

### Phase 7: LAUNCH! (Thursday)

**Timeline:**
- 08:00 - Final checks
- 10:00 - Make repository public
- 15:00 - Post to Reddit r/privacy
- 17:00 - Cross-post if doing well
- 19:00 - Post to Hacker News
- 20:00 - Monitor & respond

**See:** `docs/promotions/GO_LAUNCH_CHECKLIST.md`

---

## [TARGET] Success Metrics - Launch Week

**Minimum (Good):**
- 100 stars
- 15 issues
- 3 PRs
- Active discussions

**Target (Great):**
- 250 stars
- 30 issues
- 8 PRs
- Tech blog mention

**Stretch (Viral):**
- 500+ stars
- Front page HN/Reddit
- Tech press coverage

---

## [TOOL] Technical Architecture

### Name Resolution Flow (After Implementation)

```
User enters: frw://pouet/

1. Browser checks cache
   ↓ (miss)

2. Query IPNS registry
   GET k51qzi5uqu5dl.../registry.json
   ↓

3. Parse registry
   "pouet": {
     "publicKey": "GMZj...",
     "ipnsKey": "k51...",
     "cid": "QmXY..."
   }
   ↓

4. Fetch content
   GET /ipfs/QmXY.../index.html
   ↓

5. Verify signature
   Check crypto signature matches publicKey
   ↓

6. Display content
   [OK] Site loads!
```

### Registry Structure

```json
{
  "version": 1,
  "updated": 1699564800000,
  "names": {
    "pouet": {
      "publicKey": "GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb",
      "ipnsKey": "k51qzi5uqu5dlobntu56gd3v9as47meth5opgmvrc4fec50s5etzfe3a0l4a1x",
      "registered": 1699564700000,
      "lastUpdate": 1699564800000,
      "cid": "QmXYjdg8zNeURrWgxwJ67xXNQYaVmmkVVWDGCo1grQj99W"
    }
  }
}
```

---

## [CHART] Current Status Summary

**Overall Progress:** 60% → Launch Ready

| Component | Status | Progress |
|-----------|--------|----------|
| Core Protocol | [OK] Working | 100% |
| CLI Tools | [OK] Working | 100% |
| Browser | [OK] Working | 100% |
| IPFS Integration | [OK] Working | 100% |
| Cryptographic Signatures | [OK] Working | 100% |
| **Name Resolution** | 🟡 **In Progress** | **30%** |
| Documentation | 🟡 Needs Update | 70% |
| Tests | [OK] Passing | 100% |
| Launch Materials | 🟡 Needs Screenshots | 50% |

**Critical Path:** Name Resolution → Testing → Documentation → Launch

---

## 🚧 Known Issues

### P0 (Blocking Launch)
- [ ] Name resolution not global (IN PROGRESS)

### P1 (Nice to Have)
- [ ] IPNS resolution can be slow (5-10s)
- [ ] No search/discovery mechanism
- [ ] Registry is somewhat centralized (DHT coming later)

### P2 (Post-Launch)
- [ ] Mobile apps
- [ ] Browser extensions
- [ ] Real-time updates
- [ ] Video streaming support

---

## [GRADUATE] Lessons Learned

1. **Test end-to-end early** - We found the name resolution issue late
2. **Decentralization is hard** - IPFS DHT API is complex
3. **Start with simple solutions** - IPNS registry first, DHT later
4. **Documentation matters** - Good specs help implementation
5. **Testing on multiple machines is critical** - Local works ≠ Global works

---

## 🗓️ Timeline

| Date | Milestone |
|------|-----------|
| **Sat Nov 9** | Issue discovered, plan created |
| **Sun Nov 10** | Core infrastructure, CLI integration |
| **Mon Nov 11** | Browser integration, testing |
| **Tue Nov 12** | Documentation, polish |
| **Wed Nov 13** | Final prep, materials |
| **Thu Nov 14** | [LAUNCH] **LAUNCH!** |

---

## [PHONE] Next Immediate Actions

**RIGHT NOW (Saturday Evening):**
1. [OK] Build packages: `npm run build`
2. [OK] Fix any build errors
3. [OK] Commit progress
4. Get some rest! 😴

**TOMORROW (Sunday Morning):**
1. CLI integration
2. Local testing
3. Fix bugs

**Goal:** By Sunday EOD, have working name resolution locally

---

## [STRONG] We Got This!

**Why we'll succeed:**
- [OK] Core technology works
- [OK] Clear plan
- [OK] 4 days to implement
- [OK] Strong motivation
- [OK] Right decision (postpone vs rush broken launch)

**The world needs a free web. Let's build it.** [GLOBE]

---

**Last Updated:** Saturday Nov 9, 2025 - 19:45 CET
**Next Update:** Sunday Nov 10, 2025 - Morning
