# FRW Testing Guide - Complete System Verification

**Date:** November 9, 2025  
**Purpose:** Verify all components work together

---

## Prerequisites

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# All workspaces
npm install --workspaces
```

### 2. Build All Packages

```bash
# Build in order (dependencies first)
npm run build --workspace=packages/common
npm run build --workspace=packages/crypto
npm run build --workspace=packages/storage
npm run build --workspace=packages/sandbox
npm run build --workspace=packages/protocol
npm run build --workspace=packages/name-registry
npm run build --workspace=apps/cli
```

Or build all at once:
```bash
npm run build --workspaces
```

---

## Phase 1: Core Functionality Tests

### Test 1: Initialize FRW

```bash
# Initialize configuration
frw init

# Expected output:
✓ Configuration directory created
✓ Keypair generated
✓ Configuration saved

# Verify files created
dir %USERPROFILE%\.frw
# Should show: config.json, key.json
```

### Test 2: Check IPFS Status

```bash
# Check IPFS connection
frw ipfs

# Expected output (if IPFS running):
✓ IPFS node is running
Peer ID: 12D3KooW...
Addresses: [list of addresses]

# Expected output (if IPFS not running):
✗ Cannot connect to IPFS
Start IPFS: ipfs daemon
```

---

## Phase 2: Name Registry Tests

### Test 3: Register Basic Name

```bash
# Register a simple name (no DNS)
frw register testsite123

# Expected behavior:
# 1. Proof of Work generation (~5 seconds for 11-char name)
# 2. Rate limit check passes
# 3. Registration succeeds

# Expected output:
Generating proof of work...
Attempts: 12345
✓ Proof generated

✓ Name registered: testsite123
  Status: Regular name (no verification needed)
  Your site: frw://testsite123/
```

### Test 4: Rate Limiting

```bash
# Try to register multiple names rapidly
frw register test1
frw register test2
frw register test3
# ... continue quickly

# Expected: After 5 in one hour:
✗ Rate limit: Too many registrations this hour
  Retry after: 45 minutes
```

### Test 5: Short Name (High Difficulty)

```bash
# Register 3-letter name (should take ~10 minutes)
frw register abc

# Expected behavior:
# 1. High difficulty PoW (6 leading zeros)
# 2. Takes 10-15 minutes
# 3. High bond required (10,000,000 units)

# Monitor progress:
Generating proof of work (difficulty: 6)...
Attempts: 100000
Attempts: 200000
...
✓ Proof generated (1,234,567 attempts)

Required bond: 10,000,000 units
✓ Name registered: abc
```

---

## Phase 3: DNS Verification Tests

### Test 6: Register Domain Name (No Verification)

```bash
# Register domain-like name without DNS
frw register example.com

# Expected output:
✓ Name registered: example.com
⚠ Not DNS verified
  Users will see an unverified warning
  To verify: frw verify-dns example.com
```

### Test 7: Register with DNS Verification

```bash
# Register with --verify-dns flag
frw register mydomain.com --verify-dns

# Expected flow:
Optional DNS Verification

"mydomain.com" appears to be a domain name
Verify ownership via DNS to get "Official" status

Add this TXT record to your DNS:
  Record Type: TXT
  Name: _frw
  Value: frw-key=12D3KooW...

? Ready to verify DNS? (y/N)
```

**Manual step:** Add DNS TXT record to your domain, then:

```bash
# Continue verification
? Ready to verify DNS? Yes
✓ DNS verification passed
✓ Name registered: mydomain.com
  Status: ✓ DNS Verified
  Users will see this as the verified site
```

### Test 8: Verify DNS Later

```bash
# For already registered name
frw verify-dns example.com

# Expected:
Add this DNS TXT record:
  _frw.example.com → "frw-key=..."

✓ DNS verification successful!
✓ Official status granted
```

---

## Phase 4: Challenge System Tests

### Test 9: View Metrics

```bash
# View content metrics for a name
frw metrics testsite123

# Expected output:
Content Metrics for: testsite123

IPFS Metrics:
  Peer Connections: 0
  Content Size: 0 bytes
  IPNS Updates: 0

Legitimacy Score: 50/1000
  (Score increases with usage)
```

### Test 10: Create Challenge

```bash
# Challenge a name registration
frw challenge create testsite123 \
  --reason "Squatting without usage" \
  --bond 1000000

# Expected:
Required bond: 1,000,000 units
(Increased due to challenge history)

✓ Challenge created
  Challenge ID: challenge_abc123
  Name: testsite123
  Bond locked: 1,000,000 units
  Response deadline: 30 days
```

### Test 11: Challenge Rate Limiting

```bash
# Try to create many challenges rapidly
frw challenge create name1 --reason test --bond 1000000
frw challenge create name2 --reason test --bond 1000000
frw challenge create name3 --reason test --bond 1000000

# Expected: After 2 per hour:
✗ Hourly limit: 2 challenges/hour
  Next allowed: 45 minutes
```

### Test 12: Challenge Status

```bash
# Check challenge status
frw challenge status challenge_abc123

# Expected output:
Challenge Status: challenge_abc123

Name: testsite123
Status: awaiting_response
Created: Nov 9, 2025

Challenger: 12D3KooW... (you)
Owner: 12D3KooWXyz...

Timeline:
  ✓ Created: Nov 9, 2025
  ⏳ Response Deadline: Dec 9, 2025 (30 days)
  ⏳ Evaluation: Dec 23, 2025 (44 days)

Bond: 1,000,000 units locked
```

---

## Phase 5: Integration Tests

### Test 13: Complete Registration Workflow

```bash
# 1. Initialize
frw init --force

# 2. Register name
frw register mywebsite

# 3. Create content
mkdir test-site
echo "<h1>Hello FRW</h1>" > test-site/index.html

# 4. Publish (placeholder - not fully implemented)
frw publish test-site --name mywebsite

# 5. Verify
frw verify test-site/index.html
```

### Test 14: Security Features Verification

```bash
# Test PoW verification
node -e "
const { ProofOfWorkGenerator, verifyProof } = require('./packages/name-registry/dist/pow/generator.js');
const pow = new ProofOfWorkGenerator();

console.log('Testing PoW...');
const proof = await pow.generate('test', 'pubkey123', 3);
console.log('Generated:', proof);

const valid = verifyProof('test', 'pubkey123', proof);
console.log('Valid:', valid);
"

# Expected:
Testing PoW...
Generated: { nonce: 12345, hash: '000abc...', difficulty: 3, timestamp: ... }
Valid: true
```

### Test 15: Bond Calculator Test

```bash
# Test bond calculations
node -e "
const { BondCalculator } = require('./packages/name-registry/dist/bonds/calculator.js');
const calc = new BondCalculator();

console.log('3-letter name, 0 existing:', calc.calculateBaseBond('abc').toString());
console.log('4-letter name, 0 existing:', calc.calculateBaseBond('abcd').toString());
console.log('5-letter name, 0 existing:', calc.calculateBaseBond('abcde').toString());

console.log('3-letter name, 10 existing:', calc.calculateProgressiveBond('abc', 10).toString());
console.log('3-letter name, 100 existing:', calc.calculateProgressiveBond('abc', 100).toString());
"

# Expected output:
3-letter name, 0 existing: 10000000
4-letter name, 0 existing: 5000000
5-letter name, 0 existing: 1000000
3-letter name, 10 existing: 25937424
3-letter name, 100 existing: 137806123398
```

---

## Phase 6: Performance Tests

### Test 16: PoW Generation Time

```bash
# Test PoW generation for different difficulties
node test-pow-performance.js

# Create test file:
```

```javascript
// test-pow-performance.js
import { ProofOfWorkGenerator, getRequiredDifficulty } from './packages/name-registry/dist/pow/generator.js';

async function testPoW() {
    const pow = new ProofOfWorkGenerator();
    
    const names = [
        { name: 'abc', expected: '10-15 min' },
        { name: 'abcd', expected: '5-8 min' },
        { name: 'abcde', expected: '2-3 min' },
        { name: 'abcdef', expected: '30-60 sec' },
        { name: 'abcdefg', expected: '5-10 sec' }
    ];
    
    for (const { name, expected } of names) {
        const difficulty = getRequiredDifficulty(name);
        console.log(`\nTesting: ${name} (difficulty: ${difficulty}) - Expected: ${expected}`);
        
        const start = Date.now();
        const proof = await pow.generate(name, 'test-key', difficulty);
        const duration = Date.now() - start;
        
        console.log(`  Completed in: ${(duration/1000).toFixed(2)}s`);
        console.log(`  Attempts: ${proof.nonce}`);
        console.log(`  Hash: ${proof.hash}`);
    }
}

testPoW();
```

---

## Phase 7: Error Handling Tests

### Test 17: Invalid Name Format

```bash
# Try invalid names
frw register "My Site"  # Spaces
frw register "UPPERCASE"  # Uppercase
frw register "ab"  # Too short
frw register "special@chars"  # Special chars

# Expected: All rejected with error
✗ Invalid name format
Names must be:
  - 3-63 characters
  - Lowercase letters, numbers, hyphens
  - Start and end with letter/number
```

### Test 18: Missing IPFS

```bash
# Stop IPFS daemon
ipfs shutdown

# Try to view metrics
frw metrics testsite123

# Expected:
✗ Cannot connect to IPFS
  Start IPFS daemon: ipfs daemon
  Or check configuration
```

### Test 19: Replay Attack Prevention

```bash
# This would require capturing a signature and replaying it
# For now, check nonce system is active

node -e "
const { NonceManager } = require('./packages/name-registry/dist/security/nonce-manager.js');
const nm = new NonceManager();

const nonce = nm.generateNonce('pubkey123');
console.log('Generated nonce:', nonce);

const valid1 = nm.verifyAndMarkNonce('pubkey123', nonce);
console.log('First use:', valid1);

const valid2 = nm.verifyAndMarkNonce('pubkey123', nonce);
console.log('Second use (replay):', valid2);
"

# Expected:
Generated nonce: abc123def456...
First use: true
Second use (replay): false
```

---

## Test Checklist

### Core Functionality
- [ ] `frw init` - Creates config and keypair
- [ ] `frw ipfs` - Checks IPFS connection
- [ ] `frw register <name>` - Registers name with PoW
- [ ] `frw verify-dns <name>` - Verifies DNS ownership

### Security Features
- [ ] Proof of Work - Generates valid PoW
- [ ] Rate Limiting - Blocks rapid registrations
- [ ] Bond Calculator - Calculates correct amounts
- [ ] Nonce Manager - Prevents replay attacks
- [ ] Challenge Spam Prevention - Limits challenges

### Name Registry
- [ ] Register short name (3-5 chars) - High difficulty
- [ ] Register medium name (6-10 chars) - Medium difficulty
- [ ] Register long name (11+ chars) - Low difficulty
- [ ] DNS verification optional - Can skip
- [ ] DNS verification works - With valid DNS record

### Challenge System
- [ ] View metrics - Shows usage data
- [ ] Create challenge - Locks bond
- [ ] Challenge rate limits - Prevents spam
- [ ] Challenge status - Shows current state
- [ ] List challenges - Shows all challenges

### Error Handling
- [ ] Invalid name format - Rejected
- [ ] Missing IPFS - Clear error
- [ ] Missing config - Helpful message
- [ ] Rate limit exceeded - Shows retry time
- [ ] DNS verification fails - Shows troubleshooting

---

## Expected Behavior Summary

### Working Correctly When:

1. **PoW Generation:**
   - 3-letter names: 10-15 minutes
   - 4-letter names: 5-8 minutes
   - 5-letter names: 2-3 minutes
   - 6+ letter names: <1 minute

2. **Rate Limits:**
   - Blocked after 1 registration per minute
   - Blocked after 5 registrations per hour
   - Blocked after 20 registrations per day

3. **DNS Verification:**
   - Optional flag works
   - Verification succeeds with valid DNS
   - Verification fails gracefully without DNS
   - Can verify later with separate command

4. **Challenge System:**
   - Can create challenges
   - Bonds are required
   - Rate limits prevent spam
   - Status tracking works

5. **Error Messages:**
   - Clear and actionable
   - Include troubleshooting steps
   - Show expected vs actual values

---

## Quick Test Script

```bash
# Run all basic tests
@echo off
echo === FRW Test Suite ===
echo.

echo [1/5] Testing initialization...
frw init --force
if %errorlevel% neq 0 (echo FAILED && exit /b 1)
echo PASSED
echo.

echo [2/5] Testing IPFS connection...
frw ipfs
echo CHECK MANUALLY
echo.

echo [3/5] Testing registration...
frw register testsite%RANDOM%
if %errorlevel% neq 0 (echo FAILED && exit /b 1)
echo PASSED
echo.

echo [4/5] Testing DNS verification...
frw verify-dns example.com
echo CHECK OUTPUT
echo.

echo [5/5] Testing metrics...
frw metrics testsite123
echo CHECK OUTPUT
echo.

echo === All Tests Complete ===
```

---

## Troubleshooting

### Build Failures

```bash
# Clean and rebuild
rm -rf packages/*/dist
rm -rf apps/*/dist
npm run build --workspaces
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
rm -rf packages/*/node_modules
npm install
npm install --workspaces
```

### TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit --workspace=packages/name-registry

# Install missing types
npm install --save-dev @types/node
```

---

## Success Criteria

✅ **System is working when:**
- All packages build without errors
- CLI commands execute successfully
- PoW generation works at expected speeds
- Rate limits prevent spam
- DNS verification optional and functional
- Challenge system operational
- Error messages are helpful

🎯 **Ready for next phase when:**
- All tests pass
- Performance benchmarks met
- Security features verified
- Integration tests complete
