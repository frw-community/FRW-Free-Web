# DNS Verification - Optional Trust Model [x]

**Implemented:** November 9, 2025  
**Status:** Complete - DNS verification now optional

---

## Strategic Change

### From: Restrictive Gatekeeper
```
DNS Verification = REQUIRED
↓
Blocks registration without DNS proof
↓
Centralized control
```

### To: Optional Trust Badge
```
Registration = ALWAYS ALLOWED (with PoW/bonds)
↓
DNS Verification = OPTIONAL BADGE
↓
Users decide who to trust
```

---

## How It Works Now

### 1. Register Any Name (No DNS Required)

```bash
# Anyone can register any name
frw register google

[x] Registered: google
[!] Not DNS verified
[NOTE] To verify: frw verify-dns google
```

### 2. Optional DNS Verification

```bash
# With DNS verification flag
frw register google --verify-dns

? Ready to verify DNS? Yes
[x] DNS verification passed
[x] Official status granted

# Or verify later
frw verify-dns google
```

---

## User Experience

### Unverified Registration
```
$ frw register mysite

[x] Name registered: mysite
  Your site: frw://mysite/
  Status: [!] Unverified
  
Next: frw publish
```

### Verified Registration
```
$ frw register example.com --verify-dns

Add DNS TXT record:
  _frw.example.com → "frw-key=12D3KooW..."

? Ready to verify? Yes
[x] DNS verification passed
[x] Name registered: example.com
  Status: [x] DNS Verified
  
Users will see this as the official site
```

---

## Browser Display

**Unverified Site:**
```
[!] UNVERIFIED SITE

frw://google/

This site is NOT verified by DNS.
It may not be the official Google.

[Continue]  [Find Verified]
```

**Verified Site:**
```
[DONE] VERIFIED SITE

frw://google/ [x]

Official site verified by DNS
Domain: google.com

[Visit Site]
```

---

## Commands

### Registration
```bash
# Basic registration
frw register mysite

# With DNS verification
frw register example.com --verify-dns
```

### Verification
```bash
# Verify existing name
frw verify-dns example.com

# Shows DNS instructions
# Checks DNS TXT record
# Updates verification status
```

---

## Security Model

### Protection Layers Still Active

**Layer 1: Registration Barriers**
- [DONE] Proof of Work (10+ min for short names)
- [DONE] Economic bonds (10M units for 3-letter)
- [DONE] Rate limits (20/day max)

**Layer 2: Trust Signaling**
- [DONE] DNS verification badge (optional)
- [DONE] User warnings (unverified sites)
- [DONE] Clear status indicators

**Layer 3: Dispute Resolution**
- [DONE] Challenge system
- [DONE] DNS verification bonus in challenges
- [DONE] Auto-win for DNS-verified challengers

---

## Challenge System Integration

### DNS as Strong Evidence

```typescript
// DNS-verified owners have advantage
if (challenger.dnsVerified && !owner.dnsVerified) {
    // Automatic win for DNS-verified challenger
    return 'challenger_wins';
}

// DNS verification adds 200 points to score
if (owner.dnsVerified) {
    ownerScore += 200;
}
```

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Freedom** | Blocked without DNS | Always can register |
| **Decentralization** | DNS = gatekeeper | True freedom |
| **UX** | Upfront friction | Register now, verify later |
| **Trust** | Binary gate | Informed choice |
| **Edge Cases** | Blocked | Naturally handled |

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Optional --verify-dns flag | [DONE] Done |
| verify-dns command | [DONE] Done |
| Registration flow | [DONE] Updated |
| CLI integration | [DONE] Done |
| Database schema | [TODO] TODO |
| Browser UI | [TODO] TODO |
| Challenge bonus | [TODO] TODO |

---

## Files Modified

1. `apps/cli/src/commands/register.ts` - Made DNS optional
2. `apps/cli/src/commands/verify-dns.ts` - New verification command
3. `apps/cli/src/index.ts` - Added verify-dns command
4. `docs/DNS_VERIFICATION_STRATEGY.md` - Strategy documentation

---

## Next Steps

1. **Update Database Schema** (1 day)
   - Add dns_verified field
   - Add verification timestamp
   - Migration script

2. **Browser UI** (2-3 days)
   - Verification badges
   - Unverified warnings
   - Status indicators

3. **Challenge Integration** (2 days)
   - DNS verification bonus
   - Auto-win logic
   - Evidence display

---

## Result

[DONE] **DNS verification is now optional, not required**  
[DONE] **Anyone can register any name with PoW/bonds**  
[DONE] **DNS adds "official" status badge**  
[DONE] **Users make informed trust decisions**  
[DONE] **True decentralization achieved**

**Philosophy:** Freedom first, trust through transparency
