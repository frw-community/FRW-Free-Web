# API Fixes Applied to Source Code

**Date:** November 9, 2025  
**Approach:** Enhanced source code rather than modifying tests

---

## Changes Made

### 1. NonceManager (`src/security/nonce-manager.ts`)

**Added Methods:**
- ✓ `verifyNonce(publicKey, nonce)` - Alias for `isValid()` to match test expectations
- ✓ `getNonceStats(publicKey)` - Get statistics for specific public key
- ✓ `persistToDatabase(db)` - Alias for `saveToDatabase()` 
- ✓ `cleanup()` - Changed from private to public for testability

**Reason:** Tests expected these convenience methods. Added them as aliases/wrappers around existing functionality.

### 2. ChallengeSpamPrevention (`src/challenge/spam-prevention.ts`)

**Added Methods:**
- ✓ `recordOutcome(publicKey, name, won)` - Simpler outcome recording by name
- ✓ `recordWithdrawal(publicKey, name)` - Record withdrawn challenge

**Reason:** Tests use name-based lookups. Original code used challengeId. Added convenience methods.

### 3. DatabaseCleanup (Still needs work)

**Current APIs:**
- `checkSize(dbPath)` - Takes file path
- `enforceUserLimits(db, publicKey)` - Returns boolean
- `validateEvidenceSize(evidence[])` - Takes array
- Private: `cleanupMetrics()`, `cleanupChallenges()`, `cleanupNonces()`

**Tests Expect:**
- `checkDatabaseSize(db)` - Takes db object
- `checkUserLimits(db, publicKey)` - Returns object with stats
- Public cleanup methods or test them via main `cleanup()` method
- `validateEvidenceSize(string)` - Takes string

**Options:**
1. Add aliases in source code
2. Update tests to match actual APIs
3. Mix of both

---

## Remaining Test Fixes Needed

### DNS Verifier Tests
Tests import functions that don't exist as standalone exports:
- `isReservedName()` - Should use `RESERVED_NAMES.includes()`
- `isDomainLike()` - Needs to be added or tests updated

### Return Type Mismatches
- DNS: Tests expect `reason` property, code returns `error`
- DNS: Tests expect `publicKey` property, code returns `dnsKey`
- Cleanup: Various property name differences

---

## Strategy Going Forward

**Best approach:** Mix of both
1. ✓ Added convenience methods where they make sense (NonceManager)
2. ✓ Added missing methods that improve API (ChallengeSpamPrevention)
3. TODO: Update tests for fundamental API differences (DNS return types)
4. TODO: Fix import issues (standalone functions vs class methods)

---

## Next Steps

1. **Fix DNS tests** - Update to use actual API
2. **Fix cleanup tests** - Either add methods or test via public API
3. **Fix integration tests** - Update method calls
4. **Fix security tests** - Update method signatures
5. **Run tests again** - See what passes now

---

## Commands to Run

```bash
# Try running specific test files
npx jest tests/unit/nonce-manager.test.ts --workspace=packages/name-registry
npx jest tests/unit/bond-calculator.test.ts --workspace=packages/name-registry
npx jest tests/unit/pow-generator.test.ts --workspace=packages/name-registry
```
