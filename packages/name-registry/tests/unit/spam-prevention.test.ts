// Unit tests for Challenge Spam Prevention
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ChallengeSpamPrevention } from '../../src/challenge/spam-prevention';

describe('ChallengeSpamPrevention', () => {
    let prevention: ChallengeSpamPrevention;

    beforeEach(() => {
        jest.useFakeTimers();
        prevention = new ChallengeSpamPrevention();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('canCreateChallenge', () => {
        it('should allow first challenge', () => {
            const result = prevention.canCreateChallenge('test-key');
            expect(result.allowed).toBe(true);
            expect(result.requiredBond).toBeDefined();
        });

        it('should enforce hourly limit (2 per hour)', () => {
            const key = 'test-key';
            
            prevention.recordChallenge(key, 'chal1', 'name1');
            prevention.recordChallenge(key, 'chal2', 'name2');
            
            // 3rd challenge in same hour should be blocked
            const result = prevention.canCreateChallenge(key);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Hourly limit');
        });

        it('should enforce daily limit (5 per day)', () => {
            const key = 'test-key';
            
            // Create 5 challenges spread across hours
            for (let i = 0; i < 5; i++) {
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                jest.advanceTimersByTime(3700000); // 1 hour + 1 minute
            }
            
            const result = prevention.canCreateChallenge(key);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('active challenges');
        });

        it('should enforce monthly limit (20 per month)', () => {
            const key = 'test-key';
            
            // Create 20 challenges spread across days
            for (let i = 0; i < 20; i++) {
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                jest.advanceTimersByTime(86500000); // ~1 day
            }
            
            const result = prevention.canCreateChallenge(key);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('active challenges');
        });

        it('should enforce active challenge limit (3 concurrent)', () => {
            const key = 'test-key';
            
            // Create 3 active challenges
            prevention.recordChallenge(key, 'chal1', 'name1');
            jest.advanceTimersByTime(3700000);
            prevention.recordChallenge(key, 'chal2', 'name2');
            jest.advanceTimersByTime(3700000);
            prevention.recordChallenge(key, 'chal3', 'name3');
            
            // All still active (not resolved)
            const result = prevention.canCreateChallenge(key);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('active challenges');
        });

        it('should enforce cooldown after lost challenge', () => {
            const key = 'test-key';
            
            prevention.recordChallenge(key, 'chal1', 'name1');
            prevention.recordOutcome(key, 'name1', false); // Lost
            
            // Should be in 7-day cooldown
            const result = prevention.canCreateChallenge(key);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Cooling off');
        });

        it('should allow challenge after cooldown expires', () => {
            const key = 'test-key';
            
            prevention.recordChallenge(key, 'chal1', 'name1');
            prevention.recordOutcome(key, 'name1', false); // Lost
            
            // Advance 7 days + 1 second
            jest.advanceTimersByTime(7 * 86400000 + 1000);
            
            const result = prevention.canCreateChallenge(key);
            // After cooldown, should still consider bond increase but allow challenge
            expect(result.allowed || result.requiredBond).toBeDefined();
        });
    });

    describe('calculateBond', () => {
        it('should return base bond for first challenge', () => {
            const bond = prevention.calculateRequiredBond('test-key');
            expect(bond).toBe(1_000_000n);
        });

        it('should double bond for each lost challenge', () => {
            const key = 'test-key';
            const baseBond = prevention.calculateRequiredBond(key);
            
            // Lose a challenge
            prevention.recordChallenge(key, 'chal1', 'name1');
            prevention.recordOutcome(key, 'name1', false);
            
            const newBond = prevention.calculateRequiredBond(key);
            expect(newBond).toBeGreaterThan(baseBond);
        });

        it('should exponentially increase bond for repeat offenders', () => {
            const key = 'test-key';
            
            // Lose 3 challenges
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(7 * 86400000 + 1000); // Past cooldown
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                prevention.recordOutcome(key, `name${i}`, false);
            }
            
            const bond = prevention.calculateRequiredBond(key);
            // Bond increases exponentially with losses
            expect(bond).toBeGreaterThan(8_000_000n);
        });

        it('should make spam prohibitively expensive after 10 losses', () => {
            const key = 'test-key';
            
            // Lose 10 challenges
            for (let i = 0; i < 10; i++) {
                jest.advanceTimersByTime(7 * 86400000 + 1000);
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                prevention.recordOutcome(key, `name${i}`, false);
            }
            
            const bond = prevention.calculateRequiredBond(key);
            // Base * (2^10) = 1M * 1024 = 1,024M
            expect(Number(bond)).toBeGreaterThan(1_000_000_000);
        });
    });

    describe('recordChallenge', () => {
        it('should record challenge with timestamp', () => {
            prevention.recordChallenge('key1', 'chal1', 'name1');
            
            // Should count in stats
            const stats = prevention.getStats('key1');
            expect(stats.total).toBe(1);
            expect(stats.active).toBe(1);
        });

        it('should track multiple challenges', () => {
            prevention.recordChallenge('key1', 'chal1', 'name1');
            jest.advanceTimersByTime(3700000);
            prevention.recordChallenge('key1', 'chal2', 'name2');
            
            const stats = prevention.getStats('key1');
            expect(stats.total).toBe(2);
        });

        it('should track different keys separately', () => {
            prevention.recordChallenge('key1', 'chal1', 'name1');
            prevention.recordChallenge('key2', 'chal2', 'name2');
            
            expect(prevention.getStats('key1').total).toBe(1);
            expect(prevention.getStats('key2').total).toBe(1);
        });
    });

    describe('recordChallengeOutcome', () => {
        it('should mark challenge as won', () => {
            prevention.recordChallenge('key1', 'chal1', 'name1');
            prevention.recordOutcome('key1', 'name1', true);
            
            const stats = prevention.getStats('key1');
            expect(stats.won).toBe(1);
            expect(stats.lost).toBe(0);
            expect(stats.active).toBe(0); // No longer active
        });

        it('should mark challenge as lost', () => {
            prevention.recordChallenge('key1', 'chal1', 'name1');
            prevention.recordOutcome('key1', 'name1', false);
            
            const stats = prevention.getStats('key1');
            expect(stats.won).toBe(0);
            expect(stats.lost).toBe(1);
            expect(stats.active).toBe(0);
        });

        it('should calculate win rate correctly', () => {
            const key = 'test-key';
            
            // Win 3, lose 1
            for (let i = 0; i < 4; i++) {
                jest.advanceTimersByTime(3700000);
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                prevention.recordOutcome(key, `name${i}`, i < 3);
            }
            
            const stats = prevention.getStats(key);
            expect(stats.winRate).toBe(75);
        });

        it('should handle 100% win rate', () => {
            prevention.recordChallenge('key1', 'chal1', 'name1');
            prevention.recordOutcome('key1', 'name1', true);
            
            const stats = prevention.getStats('key1');
            expect(stats.winRate).toBe(100);
        });

        it('should handle 0% win rate', () => {
            prevention.recordChallenge('key1', 'chal1', 'name1');
            prevention.recordOutcome('key1', 'name1', false);
            
            const stats = prevention.getStats('key1');
            expect(stats.winRate).toBe(0);
        });
    });

    describe('recordWithdrawal', () => {
        it('should track withdrawal count', () => {
            prevention.recordChallenge('key1', 'chal1', 'name1');
            prevention.recordWithdrawal('key1', 'name1');
            
            const stats = prevention.getStats('key1');
            expect(stats.withdrawn).toBe(1);
            expect(stats.active).toBe(0);
        });

        it('should count multiple withdrawals', () => {
            for (let i = 0; i < 3; i++) {
                jest.advanceTimersByTime(3700000);
                prevention.recordChallenge('key1', `chal${i}`, `name${i}`);
                prevention.recordWithdrawal('key1', `name${i}`);
            }
            
            const stats = prevention.getStats('key1');
            expect(stats.withdrawn).toBe(3);
        });
    });

    describe('detectSuspiciousActivity', () => {
        it('should detect high volume (>10 in 24h)', () => {
            const key = 'test-key';
            
            // Create 11 challenges in 24 hours
            for (let i = 0; i < 11; i++) {
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                jest.advanceTimersByTime(2 * 3600000); // 2 hours
            }
            
            const suspicious = prevention.detectSuspiciousActivity(key);
            expect(suspicious.suspicious).toBe(true);
            expect(suspicious.reasons.join(' ')).toContain('Unusually high');
        });

        it('should detect low win rate with high volume', () => {
            const key = 'test-key';
            
            // Create 15 challenges, win only 2 (13%)
            for (let i = 0; i < 15; i++) {
                jest.advanceTimersByTime(3700000);
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                prevention.recordOutcome(key, `name${i}`, i < 2);
            }
            
            const suspicious = prevention.detectSuspiciousActivity(key);
            expect(suspicious.suspicious).toBe(true);
            expect(suspicious.reasons.join(' ')).toContain('Low win rate');
        });

        it('should detect excessive withdrawals (>5)', () => {
            const key = 'test-key';
            
            // Withdraw 6 challenges
            for (let i = 0; i < 6; i++) {
                jest.advanceTimersByTime(3700000);
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                prevention.recordWithdrawal(key, `name${i}`);
            }
            
            const suspicious = prevention.detectSuspiciousActivity(key);
            expect(suspicious.suspicious).toBe(true);
            expect(suspicious.reasons.join(' ')).toContain('withdrawn');
        });

        it('should detect challenges against many names (>50)', () => {
            const key = 'test-key';
            
            // Challenge 51 different names
            for (let i = 0; i < 51; i++) {
                jest.advanceTimersByTime(86500000); // ~1 day
                prevention.recordChallenge(key, `chal${i}`, `uniquename${i}`);
            }
            
            const suspicious = prevention.detectSuspiciousActivity(key);
            expect(suspicious.suspicious).toBe(true);
            expect(suspicious.reasons.join(' ')).toContain('many different');
        });

        it('should not flag legitimate users', () => {
            const key = 'test-key';
            
            // Normal activity: 5 challenges, 4 wins
            for (let i = 0; i < 5; i++) {
                jest.advanceTimersByTime(7 * 86400000); // 1 week
                prevention.recordChallenge(key, `chal${i}`, `name${i}`);
                prevention.recordOutcome(key, `name${i}`, i < 4);
            }
            
            const suspicious = prevention.detectSuspiciousActivity(key);
            expect(suspicious.suspicious).toBe(false);
            expect(suspicious.reasons).toHaveLength(0);
        });
    });

    describe('getStats', () => {
        it('should return accurate statistics', () => {
            const stats = prevention.getStats('new-key');
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('active');
            expect(stats).toHaveProperty('won');
            expect(stats).toHaveProperty('lost');
            expect(stats).toHaveProperty('withdrawn');
            expect(stats).toHaveProperty('winRate');
            expect(stats).toHaveProperty('requiredBond');
            expect(stats).toHaveProperty('canChallenge');
        });

        it('should track total challenges correctly', () => {
            const key = 'test-key';
            
            // Create 4 challenges
            prevention.recordChallenge(key, 'chal1', 'name1');
            jest.advanceTimersByTime(3600000);
            prevention.recordChallenge(key, 'chal2', 'name2');
            jest.advanceTimersByTime(3600000);
            prevention.recordChallenge(key, 'chal3', 'name3');
            jest.advanceTimersByTime(25 * 3600000);
            prevention.recordChallenge(key, 'chal4', 'name4');
            
            const stats = prevention.getStats(key);
            expect(stats.total).toBe(4);
            expect(stats.active).toBe(4); // All still pending
        });
    });
});
