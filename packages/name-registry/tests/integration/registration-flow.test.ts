// Integration tests for full registration flow
import { ProofOfWorkGenerator } from '../../src/pow/generator';
import { BondCalculator } from '../../src/bonds/calculator';
import { RateLimiter } from '../../src/limits/rate-limiter';
import { NonceManager } from '../../src/security/nonce-manager';
import { DNSVerifier } from '../../src/dns/verifier';

describe('Registration Flow Integration', () => {
    let powGenerator: ProofOfWorkGenerator;
    let bondCalculator: BondCalculator;
    let rateLimiter: RateLimiter;
    let nonceManager: NonceManager;
    let dnsVerifier: DNSVerifier;

    beforeEach(() => {
        powGenerator = new ProofOfWorkGenerator();
        bondCalculator = new BondCalculator();
        rateLimiter = new RateLimiter();
        nonceManager = new NonceManager();
        dnsVerifier = new DNSVerifier();
    });

    describe('Standard Name Registration', () => {
        it('should complete full registration flow for 7-letter name', async () => {
            const name = 'testapp';
            const publicKey = 'pubkey123';

            // Step 1: Check rate limits
            const rateCheck = rateLimiter.checkLimit(publicKey);
            expect(rateCheck.allowed).toBe(true);

            // Step 2: Calculate required bond
            const bond = bondCalculator.calculateProgressiveBond(name, 0);
            expect(bond).toBeGreaterThan(0n);

            // Step 3: Generate PoW (low difficulty for 7+ letters)
            const proof = await powGenerator.generate(name, publicKey, 2);
            expect(proof).toHaveProperty('hash');
            expect(proof).toHaveProperty('nonce');

            // Step 4: Verify PoW
            const proofValid = powGenerator.verifyProof(name, publicKey, proof);
            expect(proofValid).toBe(true);

            // Step 5: Generate nonce for signature
            const nonce = nonceManager.generateNonce(publicKey);
            expect(nonce).toHaveLength(64);

            // Step 6: Verify and mark nonce
            const nonceValid = nonceManager.verifyAndMarkNonce(publicKey, nonce);
            expect(nonceValid).toBe(true);

            // Step 7: Record registration
            rateLimiter.recordRegistration(publicKey, name);

            // Verify rate limit updated
            const stats = rateLimiter.getStats(publicKey);
            expect(stats.total).toBe(1);
        }, 30000);

        it('should handle multiple sequential registrations', async () => {
            const publicKey = 'user123';
            const names = ['name1', 'name2', 'name3'];

            for (let i = 0; i < names.length; i++) {
                const name = names[i];

                // Check rate limit
                if (i > 0) {
                    jest.advanceTimersByTime(61000); // Wait 1 minute between
                }

                const rateCheck = rateLimiter.checkLimit(publicKey);
                expect(rateCheck.allowed).toBe(true);

                // Calculate progressive bond
                const bond = bondCalculator.calculateProgressiveBond(name, i);
                if (i > 0) {
                    const previousBond = bondCalculator.calculateProgressiveBond(name, i - 1);
                    expect(bond).toBeGreaterThan(previousBond);
                }

                // Generate PoW
                const proof = await powGenerator.generate(name, publicKey, 2);
                expect(powGenerator.verifyProof(name, publicKey, proof)).toBe(true);

                // Generate and verify nonce
                const nonce = nonceManager.generateNonce(publicKey);
                expect(nonceManager.verifyAndMarkNonce(publicKey, nonce)).toBe(true);

                // Record
                rateLimiter.recordRegistration(publicKey, name);
            }

            const stats = rateLimiter.getStats(publicKey);
            expect(stats.total).toBe(3);
        }, 90000);
    });

    describe('Reserved Name Registration with DNS', () => {
        it('should require DNS verification for reserved names', () => {
            const name = 'google';
            const publicKey = 'pubkey123';

            // Reserved names should require DNS
            expect(dnsVerifier.requiresDNSVerification(name)).toBe(true);
        });

        it('should require DNS verification for domain-like names', () => {
            const name = 'example.com';
            const publicKey = 'pubkey123';

            expect(dnsVerifier.requiresDNSVerification(name)).toBe(true);
        });

        it('should complete flow with DNS verification', async () => {
            const name = 'example.com';
            const publicKey = 'validkey123';

            // Mock DNS verification
            jest.spyOn(dnsVerifier, 'verifyDomainOwnership').mockResolvedValue({
                verified: true,
                dnsKey: publicKey
            });

            // Rate limit check
            const rateCheck = rateLimiter.checkLimit(publicKey);
            expect(rateCheck.allowed).toBe(true);

            // Bond calculation
            const bond = bondCalculator.calculateProgressiveBond(name, 0);
            expect(bond).toBeGreaterThan(0n);

            // DNS verification
            const dnsResult = await dnsVerifier.verifyDomainOwnership(name, publicKey);
            expect(dnsResult.verified).toBe(true);

            // PoW generation
            const proof = await powGenerator.generate(name, publicKey, 2);
            expect(powGenerator.verifyProof(name, publicKey, proof)).toBe(true);

            // Nonce handling
            const nonce = nonceManager.generateNonce(publicKey);
            expect(nonceManager.verifyAndMarkNonce(publicKey, nonce)).toBe(true);

            // Registration
            rateLimiter.recordRegistration(publicKey, name);
        }, 30000);
    });

    describe('Short Name Registration (High Difficulty)', () => {
        it('should handle 3-letter name with high difficulty', async () => {
            const name = 'abc';
            const publicKey = 'pubkey123';

            // Rate limit
            expect(rateLimiter.checkLimit(publicKey).allowed).toBe(true);

            // High bond for 3-letter
            const bond = bondCalculator.calculateProgressiveBond(name, 0);
            expect(bond).toBe(10_000_000n);

            // PoW with difficulty 6 (skip actual generation for speed, just verify it exists)
            const difficulty = powGenerator.getRequiredDifficulty(name);
            expect(difficulty).toBe(6);

            // Estimate time
            const estimate = powGenerator.estimateTime(6);
            expect(estimate.seconds).toBeGreaterThan(300); // More than 5 minutes
        });

        it('should have escalating bonds for multiple 3-letter names', () => {
            const name = 'xyz';
            const publicKey = 'user123';

            const bond0 = bondCalculator.calculateProgressiveBond(name, 0);
            const bond10 = bondCalculator.calculateProgressiveBond(name, 10);
            const bond100 = bondCalculator.calculateProgressiveBond(name, 100);

            expect(bond10).toBeGreaterThan(bond0);
            expect(bond100).toBeGreaterThan(bond10);

            // After 100 names, cost should be prohibitive
            expect(Number(bond100)).toBeGreaterThan(100_000_000_000);
        });
    });

    describe('Rate Limiting Enforcement', () => {
        it('should block rapid registration attempts', () => {
            const publicKey = 'spammer123';

            // First registration allowed
            expect(rateLimiter.checkLimit(publicKey).allowed).toBe(true);
            rateLimiter.recordRegistration(publicKey, 'name1');

            // Second immediate attempt blocked
            const result = rateLimiter.checkLimit(publicKey);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('per minute');
            expect(result.retryAfter).toBeLessThanOrEqual(60);
        });

        it('should allow registration after cooldown', () => {
            const publicKey = 'user456';

            rateLimiter.recordRegistration(publicKey, 'name1');
            expect(rateLimiter.checkLimit(publicKey).allowed).toBe(false);

            // Advance 61 seconds
            jest.advanceTimersByTime(61000);

            expect(rateLimiter.checkLimit(publicKey).allowed).toBe(true);
        });
    });

    describe('Nonce Replay Prevention', () => {
        it('should prevent nonce reuse across registrations', () => {
            const publicKey = 'user789';
            const nonce = nonceManager.generateNonce(publicKey);

            // First use: success
            expect(nonceManager.verifyAndMarkNonce(publicKey, nonce)).toBe(true);

            // Second use: replay attack detected
            expect(nonceManager.verifyAndMarkNonce(publicKey, nonce)).toBe(false);
        });

        it('should require fresh nonce for each registration', async () => {
            const publicKey = 'user999';

            for (let i = 0; i < 3; i++) {
                const nonce = nonceManager.generateNonce(publicKey);
                expect(nonceManager.verifyAndMarkNonce(publicKey, nonce)).toBe(true);
            }

            const stats = nonceManager.getNonceStats(publicKey);
            expect(stats.used).toBe(3);
        });
    });

    describe('Error Handling', () => {
        it('should reject invalid PoW', async () => {
            const name = 'test';
            const publicKey = 'key123';

            const proof = await powGenerator.generate(name, publicKey, 2);

            // Tamper with proof
            proof.hash = 'invalid';

            expect(powGenerator.verifyProof(name, publicKey, proof)).toBe(false);
        });

        it('should reject expired PoW', async () => {
            const name = 'test';
            const publicKey = 'key123';

            const proof = await powGenerator.generate(name, publicKey, 2);

            // Age proof beyond 1 hour
            proof.timestamp = Date.now() - 3600001;

            expect(powGenerator.verifyProof(name, publicKey, proof)).toBe(false);
        });

        it('should reject forged nonces', () => {
            const publicKey = 'key123';
            const forgedNonce = 'a'.repeat(64);

            expect(nonceManager.verifyAndMarkNonce(publicKey, forgedNonce)).toBe(false);
        });
    });

    describe('Bulk Registration', () => {
        it('should calculate total bond for bulk registration', () => {
            const names = ['name1', 'name2', 'name3', 'name4', 'name5'];
            const existingCount = 10;

            const totalBond = bondCalculator.calculateBulkBond(names, existingCount);

            // Should be sum of progressive bonds
            let expectedTotal = 0n;
            names.forEach((name, i) => {
                expectedTotal += bondCalculator.calculateProgressiveBond(name, existingCount + i);
            });

            expect(totalBond).toBe(expectedTotal);
        });

        it('should prevent bulk spam via progressive bonds', () => {
            const names = Array.from({ length: 100 }, (_, i) => `name${i}`);

            const bond0 = bondCalculator.calculateBulkBond(names, 0);
            const bond100 = bondCalculator.calculateBulkBond(names, 100);

            // Cost should increase dramatically
            expect(bond100).toBeGreaterThan(bond0 * 10n);
        });
    });
});
