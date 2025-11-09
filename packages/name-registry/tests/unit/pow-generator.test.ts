// Unit tests for Proof of Work Generator
import { ProofOfWorkGenerator, getRequiredDifficulty, verifyProof } from '../../src/pow/generator';

describe('ProofOfWorkGenerator', () => {
    let generator: ProofOfWorkGenerator;

    beforeEach(() => {
        generator = new ProofOfWorkGenerator();
    });

    describe('generate', () => {
        it('should generate valid proof for easy difficulty', async () => {
            const proof = await generator.generate('testname', 'pubkey123', 2);
            
            expect(proof).toHaveProperty('nonce');
            expect(proof).toHaveProperty('hash');
            expect(proof).toHaveProperty('difficulty');
            expect(proof).toHaveProperty('timestamp');
            expect(proof.difficulty).toBe(2);
            expect(proof.hash.startsWith('00')).toBe(true);
        }, 30000);

        it('should include timestamp in proof', async () => {
            const before = Date.now();
            const proof = await generator.generate('test', 'key', 2);
            const after = Date.now();
            
            expect(proof.timestamp).toBeGreaterThanOrEqual(before);
            expect(proof.timestamp).toBeLessThanOrEqual(after);
        });

        it('should call progress callback during generation', async () => {
            const progressCalls: number[] = [];
            const onProgress = (attempts: number) => {
                progressCalls.push(attempts);
            };
            
            await generator.generate('test', 'key', 2, onProgress);
            
            // Should have at least one progress callback
            expect(progressCalls.length).toBeGreaterThan(0);
            // Progress should be multiples of 10,000
            expect(progressCalls[0] % 10000).toBe(0);
        }, 30000);

        it('should throw error if timeout reached', async () => {
            // Difficulty 20 should be impossible
            await expect(
                generator.generate('test', 'key', 20)
            ).rejects.toThrow('PoW generation timeout');
        }, 10000);

        it('should produce different nonces for same input', async () => {
            const proof1 = await generator.generate('same', 'key', 2);
            const proof2 = await generator.generate('same', 'key', 2);
            
            // Different timestamps = different proofs
            expect(proof1.nonce).not.toBe(proof2.nonce);
            expect(proof1.hash).not.toBe(proof2.hash);
        }, 60000);
    });

    describe('estimateTime', () => {
        it('should estimate time for different difficulties', () => {
            const estimates = [2, 3, 4, 5, 6].map(d => 
                generator.estimateTime(d)
            );
            
            // Each difficulty should take longer
            for (let i = 1; i < estimates.length; i++) {
                expect(estimates[i].seconds).toBeGreaterThan(estimates[i-1].seconds);
            }
        });

        it('should provide human-readable descriptions', () => {
            expect(generator.estimateTime(2).description).toContain('second');
            expect(generator.estimateTime(4).description).toContain('minute');
            expect(generator.estimateTime(6).description).toContain('minute');
        });

        it('should calculate expected attempts correctly', () => {
            // Difficulty 2 = 16^2 = 256 attempts average
            const est = generator.estimateTime(2);
            expect(est.seconds).toBeGreaterThan(0);
            expect(est.seconds).toBeLessThan(10);
        });
    });
});

describe('getRequiredDifficulty', () => {
    it('should return highest difficulty for 3-letter names', () => {
        expect(getRequiredDifficulty('abc')).toBe(6);
    });

    it('should return medium difficulty for 4-letter names', () => {
        expect(getRequiredDifficulty('abcd')).toBe(5);
    });

    it('should return lower difficulty for 5-letter names', () => {
        expect(getRequiredDifficulty('abcde')).toBe(4);
    });

    it('should return low difficulty for 6-letter names', () => {
        expect(getRequiredDifficulty('abcdef')).toBe(3);
    });

    it('should return minimum difficulty for long names', () => {
        expect(getRequiredDifficulty('verylongname')).toBe(2);
        expect(getRequiredDifficulty('superlongnamewithlotsofchars')).toBe(2);
    });
});

describe('verifyProof', () => {
    let generator: ProofOfWorkGenerator;

    beforeEach(() => {
        generator = new ProofOfWorkGenerator();
    });

    it('should verify valid proof', async () => {
        const name = 'testname';
        const publicKey = 'pubkey123';
        const proof = await generator.generate(name, publicKey, 2);
        
        const isValid = verifyProof(name, publicKey, proof);
        expect(isValid).toBe(true);
    }, 30000);

    it('should reject proof with wrong name', async () => {
        const proof = await generator.generate('correct', 'key', 2);
        const isValid = verifyProof('wrong', 'key', proof);
        expect(isValid).toBe(false);
    }, 30000);

    it('should reject proof with wrong public key', async () => {
        const proof = await generator.generate('name', 'correctkey', 2);
        const isValid = verifyProof('name', 'wrongkey', proof);
        expect(isValid).toBe(false);
    }, 30000);

    it('should reject proof with modified hash', async () => {
        const proof = await generator.generate('name', 'key', 2);
        proof.hash = '0000modified';
        const isValid = verifyProof('name', 'key', proof);
        expect(isValid).toBe(false);
    }, 30000);

    it('should reject proof with insufficient difficulty', async () => {
        const proof = await generator.generate('name', 'key', 2);
        proof.hash = '0abc123'; // Only 1 leading zero
        const isValid = verifyProof('name', 'key', proof);
        expect(isValid).toBe(false);
    }, 30000);

    it('should reject expired proof (>1 hour old)', async () => {
        const proof = await generator.generate('name', 'key', 2);
        proof.timestamp = Date.now() - (3600000 + 1000); // 1 hour + 1 second ago
        const isValid = verifyProof('name', 'key', proof);
        expect(isValid).toBe(false);
    }, 30000);

    it('should accept recent proof (<1 hour old)', async () => {
        const proof = await generator.generate('name', 'key', 2);
        proof.timestamp = Date.now() - 1000; // 1 second ago
        const isValid = verifyProof('name', 'key', proof);
        expect(isValid).toBe(true);
    }, 30000);
});
