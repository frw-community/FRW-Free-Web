# FRW Name Registry Test Suite

Comprehensive test suite for the FRW Name Registry security modules.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual modules
│   ├── pow-generator.test.ts
│   ├── bond-calculator.test.ts
│   ├── rate-limiter.test.ts
│   ├── nonce-manager.test.ts
│   ├── spam-prevention.test.ts
│   ├── cleanup.test.ts
│   └── dns-verifier.test.ts
├── integration/             # Integration tests for complete flows
│   └── registration-flow.test.ts
└── security/                # Security attack simulations
    └── attack-scenarios.test.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Security Tests
```bash
npm run test:security
```

### Watch Mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Verbose Output
```bash
npm run test:verbose
```

## Test Coverage Goals

- **PoW Generator:** >90% (critical path)
- **Bond Calculator:** >95% (financial logic)
- **Rate Limiter:** >90% (security critical)
- **Nonce Manager:** >95% (replay prevention)
- **Spam Prevention:** >85% (complex logic)
- **Cleanup:** >80% (database operations)
- **DNS Verifier:** >75% (external dependency)

## Unit Tests Overview

### 1. Proof of Work Generator (`pow-generator.test.ts`)

Tests PoW generation, verification, difficulty scaling, and timeout protection.

**Key Tests:**
- Valid proof generation for different difficulties
- Progress callbacks during generation
- Timeout after 100M iterations
- Proof verification with hash validation
- Age expiration (>1 hour old proofs)
- Difficulty requirements (3-letter = 6 zeros, 7+ letter = 2 zeros)

### 2. Bond Calculator (`bond-calculator.test.ts`)

Tests bond pricing, progressive multipliers, and return calculations.

**Key Tests:**
- Base bond amounts (3-letter = 10M, 6+ letter = 100k)
- Progressive increase (1.1^n multiplier)
- Exponential cost for mass registration
- Bulk bond calculations
- Bond return eligibility (90-day lock, usage requirements)
- Return percentage calculation (0%, 50%, 100%)

### 3. Rate Limiter (`rate-limiter.test.ts`)

Tests multi-tier rate limiting enforcement.

**Key Tests:**
- Per-minute limit (1 registration)
- Hourly limit (5 registrations)
- Daily limit (20 registrations)
- Monthly limit (100 registrations)
- Lifetime limit (1000 registrations)
- Retry-after time calculations
- Automatic cleanup of old records
- Adaptive limits based on reputation

### 4. Nonce Manager (`nonce-manager.test.ts`)

Tests nonce generation and replay attack prevention.

**Key Tests:**
- Cryptographically secure random nonces (64-char hex)
- Nonce uniqueness (1000+ nonces)
- Replay attack detection (marked as used)
- Expiration after 1 hour
- Forged nonce rejection
- Cross-user nonce isolation
- Periodic cleanup

### 5. Challenge Spam Prevention (`spam-prevention.test.ts`)

Tests challenge rate limits and bond escalation.

**Key Tests:**
- Hourly limit (2 challenges)
- Daily limit (5 challenges)
- Monthly limit (20 challenges)
- Active challenge limit (3 concurrent)
- Bond escalation (doubles for each loss)
- 7-day cooldown after lost challenge
- Suspicious activity detection (high volume, low win rate)

### 6. Database Cleanup (`cleanup.test.ts`)

Tests storage limits and automatic cleanup.

**Key Tests:**
- Database size limits (1GB max)
- Cleanup triggers at 80% capacity
- Metrics retention (1 year)
- Challenge retention (6 months)
- Nonce retention (1 day)
- Per-user limits (1000 records)
- Evidence size limits (10MB)
- VACUUM after cleanup

### 7. DNS Verifier (`dns-verifier.test.ts`)

Tests DNS ownership verification for reserved names.

**Key Tests:**
- TXT record verification (_frw.domain subdomain)
- Fallback to root domain
- Public key extraction from frw-key= format
- Reserved names list (google, microsoft, etc.)
- Domain-like pattern detection (.com, .org, etc.)
- 5-second timeout protection
- Malformed record handling

## Integration Tests Overview

### Registration Flow (`registration-flow.test.ts`)

Tests complete end-to-end registration flows.

**Key Scenarios:**
- **Standard registration:** Rate limit → Bond → PoW → Nonce → Record
- **Multiple registrations:** Progressive bond increase
- **Reserved names:** DNS verification required
- **Domain-like names:** DNS verification flow
- **Short names:** High difficulty PoW (6 zeros)
- **Bulk registration:** Total bond calculation
- **Error handling:** Invalid PoW, expired proof, forged nonce

## Security Tests Overview

### Attack Scenarios (`attack-scenarios.test.ts`)

Simulates real-world attack vectors.

**Attack Types:**
1. **Bot Mass Registration:** Rate limiting blocks rapid attempts
2. **Challenge Spam:** Multiple rate limits + bond escalation
3. **Replay Attacks:** Nonce reuse detection
4. **Storage Exhaustion:** Size limits + cleanup
5. **PoW Bypass:** Hash verification, difficulty enforcement
6. **Economic Gaming:** Usage requirements for bond returns
7. **Suspicious Activity:** Pattern detection (high volume, low win rate)
8. **Multi-Vector:** Combined attacks all blocked

## Test Data

### Sample Keys
- `test-key`, `user123`, `key456` for normal users
- `bot-attacker-001`, `spammer123` for attackers
- `pubkey123`, `validkey123` for PoW tests

### Sample Names
- `testapp`, `myproject` for regular names
- `abc`, `xyz` for short (3-letter) names
- `google`, `apple` for reserved names
- `example.com`, `test.org` for domain-like names

### Time Manipulation
Tests use `jest.advanceTimersByTime()` to simulate time passing without actual delays.

## Mock Objects

### Database Mock
```typescript
const mockDb = {
    prepare: jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue({ count: 0 }),
        all: jest.fn().mockReturnValue([]),
        run: jest.fn().mockReturnValue({ changes: 0 })
    }),
    exec: jest.fn()
};
```

### DNS Mock
```typescript
jest.spyOn(dnsVerifier, 'verifyDomainOwnership').mockResolvedValue({
    verified: true,
    dnsKey: 'publickey123'
});
```

## Known Limitations

1. **PoW Tests:** Full difficulty-6 generation takes 10-15 minutes; tests use difficulty-2 for speed
2. **DNS Tests:** DNS queries are mocked; real DNS tests would require test domains
3. **Database Tests:** Uses mocked database; real database tests would require SQLite setup
4. **Timer Tests:** Uses fake timers; may not catch timing-related race conditions

## Before Running

Ensure dependencies are installed:
```bash
npm install
```

For the name-registry workspace specifically:
```bash
npm install --workspace=packages/name-registry
```

## Continuous Integration

Tests are designed to run in CI/CD environments:
- No external dependencies required (all mocked)
- Deterministic results
- Fast execution (<5 minutes for full suite)
- Clear error messages

## Debugging Failed Tests

### View detailed output
```bash
npm run test:verbose
```

### Run specific test file
```bash
npx jest tests/unit/pow-generator.test.ts
```

### Run specific test
```bash
npx jest -t "should generate valid proof"
```

### Debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## API Compatibility Notes

**IMPORTANT:** These tests were written based on the security audit document. The actual source code APIs may differ. Before running tests:

1. Review actual source file exports
2. Adjust test imports and method calls as needed
3. Update test expectations to match actual return types
4. Fix TypeScript errors related to missing/renamed methods

Common adjustments needed:
- Method names (e.g., `verifyProof` vs `verify`)
- Return type properties (e.g., `reason` vs `error`)
- Function parameters (missing required params)
- Private vs public methods

## Next Steps

1. **Fix API mismatches:** Review source files and update test calls
2. **Run tests:** Execute test suite and fix failures
3. **Add edge cases:** Expand tests based on discovered issues
4. **Performance tests:** Add benchmarks for critical paths
5. **Load tests:** Simulate high-volume scenarios
6. **E2E tests:** Add end-to-end tests with real database

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Maintain >85% coverage
3. Include security test scenarios
4. Document test purpose in comments
5. Use descriptive test names

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Configuration](https://kulshekhar.github.io/ts-jest/)
- [FRW Security Audit](../../SECURITY_CODE_AUDIT.md)
- [FRW Documentation](../../docs/README.md)
