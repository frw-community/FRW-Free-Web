// Unit tests for Rate Limiter
import { RateLimiter, AdaptiveRateLimiter } from '../../src/limits/rate-limiter';

describe('RateLimiter', () => {
    let limiter: RateLimiter;
    const publicKey = 'test-public-key-123';

    beforeEach(() => {
        jest.useFakeTimers();
        limiter = new RateLimiter();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('checkLimit', () => {
        it('should allow first registration', () => {
            const result = limiter.checkLimit(publicKey);
            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should enforce per-minute limit', () => {
            limiter.recordRegistration(publicKey, 'name1');
            
            const result = limiter.checkLimit(publicKey);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('per minute');
            expect(result.retryAfter).toBeDefined();
            expect(result.retryAfter).toBeLessThanOrEqual(60);
        });

        it('should enforce hourly limit', async () => {
            // Record 5 registrations (hourly limit)
            for (let i = 0; i < 5; i++) {
                limiter.recordRegistration(publicKey, `name${i}`);
                // Wait 61 seconds between each (bypass per-minute limit)
                jest.advanceTimersByTime(61000);
            }
            
            const result = limiter.checkLimit(publicKey);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Hourly limit');
        });

        it('should enforce daily limit', () => {
            // Record 20 registrations spread across hours
            for (let i = 0; i < 20; i++) {
                limiter.recordRegistration(publicKey, `name${i}`);
                jest.advanceTimersByTime(3700000); // Advance 1 hour + 1 minute
            }
            
            const result = limiter.checkLimit(publicKey);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Daily limit');
        });

        it('should enforce monthly limit', () => {
            // Record 100 registrations
            for (let i = 0; i < 100; i++) {
                limiter.recordRegistration(publicKey, `name${i}`);
                jest.advanceTimersByTime(86500000); // Advance ~1 day
            }
            
            const result = limiter.checkLimit(publicKey);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Monthly limit');
        });

        it('should enforce lifetime limit', () => {
            // Record 1000 registrations
            for (let i = 0; i < 1000; i++) {
                limiter.recordRegistration(publicKey, `name${i}`);
                jest.advanceTimersByTime(31 * 86400000); // Advance 31 days each
            }
            
            const result = limiter.checkLimit(publicKey);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Lifetime limit');
        });

        it('should calculate accurate retry-after times', () => {
            limiter.recordRegistration(publicKey, 'name1');
            
            const result = limiter.checkLimit(publicKey);
            expect(result.retryAfter).toBeDefined();
            expect(result.retryAfter).toBeGreaterThan(0);
            expect(result.retryAfter).toBeLessThanOrEqual(60);
        });

        it('should allow registration after time passes', () => {
            limiter.recordRegistration(publicKey, 'name1');
            
            // Should be blocked immediately
            expect(limiter.checkLimit(publicKey).allowed).toBe(false);
            
            // Advance 61 seconds
            jest.advanceTimersByTime(61000);
            
            // Should be allowed now
            expect(limiter.checkLimit(publicKey).allowed).toBe(true);
        });
    });

    describe('recordRegistration', () => {
        it('should record registration with timestamp', () => {
            limiter.recordRegistration(publicKey, 'testname');
            
            const stats = limiter.getStats(publicKey);
            expect(stats.total).toBe(1);
            expect(stats.lastMinute).toBe(1);
        });

        it('should accumulate multiple registrations', () => {
            limiter.recordRegistration(publicKey, 'name1');
            jest.advanceTimersByTime(61000);
            limiter.recordRegistration(publicKey, 'name2');
            jest.advanceTimersByTime(61000);
            limiter.recordRegistration(publicKey, 'name3');
            
            const stats = limiter.getStats(publicKey);
            expect(stats.total).toBe(3);
        });

        it('should cleanup old records automatically', () => {
            // Record registration
            limiter.recordRegistration(publicKey, 'name1');
            expect(limiter.getStats(publicKey).total).toBe(1);
            
            // Advance more than 1 year
            jest.advanceTimersByTime(366 * 86400000);
            
            // Record new registration (triggers cleanup)
            limiter.recordRegistration(publicKey, 'name2');
            
            // Old record should be gone
            const stats = limiter.getStats(publicKey);
            expect(stats.total).toBe(1);
        });
    });

    describe('getStats', () => {
        it('should return accurate statistics', () => {
            const stats = limiter.getStats(publicKey);
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('lastMinute');
            expect(stats).toHaveProperty('lastHour');
            expect(stats).toHaveProperty('lastDay');
            expect(stats).toHaveProperty('lastMonth');
            expect(stats).toHaveProperty('nextAllowed');
        });

        it('should calculate time-based counts correctly', () => {
            // Record 3 registrations at different times
            limiter.recordRegistration(publicKey, 'name1');
            jest.advanceTimersByTime(61000); // 1 minute
            limiter.recordRegistration(publicKey, 'name2');
            jest.advanceTimersByTime(3600000); // 1 hour
            limiter.recordRegistration(publicKey, 'name3');
            
            const stats = limiter.getStats(publicKey);
            expect(stats.total).toBe(3);
            expect(stats.lastMinute).toBe(1);
            expect(stats.lastHour).toBe(2);
            expect(stats.lastDay).toBe(3);
        });

        it('should calculate nextAllowed when rate limited', () => {
            limiter.recordRegistration(publicKey, 'name1');
            
            const stats = limiter.getStats(publicKey);
            expect(stats.nextAllowed).not.toBeNull();
            expect(stats.nextAllowed).toBeInstanceOf(Date);
        });

        it('should have null nextAllowed when not rate limited', () => {
            const stats = limiter.getStats(publicKey);
            expect(stats.nextAllowed).toBeNull();
        });
    });

    describe('loadFromDatabase', () => {
        it('should load records from database', async () => {
            const mockDb = {
                prepare: jest.fn().mockReturnValue({
                    all: jest.fn().mockReturnValue([
                        { public_key: publicKey, name: 'name1', created: Date.now() - 1000 },
                        { public_key: publicKey, name: 'name2', created: Date.now() - 2000 },
                    ])
                })
            };
            
            await limiter.loadFromDatabase(mockDb);
            
            const stats = limiter.getStats(publicKey);
            expect(stats.total).toBe(2);
        });

        it('should filter by public key when provided', async () => {
            const mockDb = {
                prepare: jest.fn().mockReturnValue({
                    all: jest.fn().mockReturnValue([])
                })
            };
            
            await limiter.loadFromDatabase(mockDb, publicKey);
            
            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('WHERE public_key = ?')
            );
        });
    });
});

describe('AdaptiveRateLimiter', () => {
    it('should adjust limits based on reputation', async () => {
        const getReputation = async (publicKey: string) => 750; // PLATINUM
        const limiter = new AdaptiveRateLimiter(getReputation);
        
        const config = await limiter.getAdjustedConfig('test-key');
        
        expect(config.perHour).toBe(10); // Higher than base (5)
        expect(config.perDay).toBe(50); // Higher than base (20)
    });

    it('should provide stricter limits for new users', async () => {
        const getReputation = async (publicKey: string) => 50; // New user
        const limiter = new AdaptiveRateLimiter(getReputation);
        
        const config = await limiter.getAdjustedConfig('test-key');
        
        expect(config.perHour).toBe(3); // Lower than base (5)
        expect(config.perDay).toBe(10); // Lower than base (20)
    });

    it('should scale limits across all reputation tiers', async () => {
        const configs = await Promise.all([
            new AdaptiveRateLimiter(async () => 50).getAdjustedConfig('key'),  // New
            new AdaptiveRateLimiter(async () => 250).getAdjustedConfig('key'), // SILVER
            new AdaptiveRateLimiter(async () => 500).getAdjustedConfig('key'), // GOLD
            new AdaptiveRateLimiter(async () => 750).getAdjustedConfig('key'), // PLATINUM
        ]);
        
        // Each tier should have higher limits
        for (let i = 1; i < configs.length; i++) {
            expect(configs[i].perDay).toBeGreaterThan(configs[i-1].perDay);
            expect(configs[i].perMonth).toBeGreaterThan(configs[i-1].perMonth);
        }
    });
});
