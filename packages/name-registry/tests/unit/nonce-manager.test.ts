// Unit tests for Nonce Manager
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NonceManager } from '../../src/security/nonce-manager';
import crypto from 'crypto';

describe('NonceManager', () => {
    let manager: NonceManager;
    const publicKey = 'test-key';

    beforeEach(() => {
        jest.useFakeTimers();
        manager = new NonceManager();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('generateNonce', () => {
        it('should generate 64-character hex nonce', () => {
            const nonce = manager.generateNonce(publicKey);
            
            expect(nonce).toHaveLength(64);
            expect(nonce).toMatch(/^[0-9a-f]{64}$/);
        });

        it('should generate unique nonces', () => {
            const publicKey = 'test-key';
            const nonces = new Set<string>();
            
            // Generate 1000 nonces
            for (let i = 0; i < 1000; i++) {
                nonces.add(manager.generateNonce(publicKey));
            }
            
            // All should be unique
            expect(nonces.size).toBe(1000);
        });

        it('should create unexpired nonces', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            // Should be valid immediately
            const isValid = manager.verifyNonce(publicKey, nonce);
            expect(isValid).toBe(true);
        });

        it('should store nonces per public key', () => {
            const nonce1 = manager.generateNonce('key1');
            const nonce2 = manager.generateNonce('key2');
            
            // key1 can use its nonce
            expect(manager.verifyNonce('key1', nonce1)).toBe(true);
            // key2 can use its nonce
            expect(manager.verifyNonce('key2', nonce2)).toBe(true);
            
            // But they can't use each other's nonces
            expect(manager.verifyNonce('key1', nonce2)).toBe(false);
            expect(manager.verifyNonce('key2', nonce1)).toBe(false);
        });
    });

    describe('verifyNonce', () => {
        it('should accept valid fresh nonce', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            const isValid = manager.verifyNonce(publicKey, nonce);
            expect(isValid).toBe(true);
        });

        it('should reject non-existent nonce', () => {
            const publicKey = 'test-key';
            const fakeNonce = crypto.randomBytes(32).toString('hex');
            
            const isValid = manager.verifyNonce(publicKey, fakeNonce);
            expect(isValid).toBe(false);
        });

        it('should reject nonce for wrong public key', () => {
            const nonce = manager.generateNonce('correct-key');
            
            const isValid = manager.verifyNonce('wrong-key', nonce);
            expect(isValid).toBe(false);
        });

        it('should reject expired nonce (>1 hour old)', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            // Manually expire the nonce
            jest.advanceTimersByTime(3600001); // 1 hour + 1ms
            
            const isValid = manager.verifyNonce(publicKey, nonce);
            expect(isValid).toBe(false);
        });

        it('should accept recent nonce (<1 hour old)', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            // Wait 59 minutes
            jest.advanceTimersByTime(3540000);
            
            const isValid = manager.verifyNonce(publicKey, nonce);
            expect(isValid).toBe(true);
        });
    });

    describe('verifyAndMarkNonce', () => {
        it('should mark nonce as used on first verification', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            const result = manager.verifyAndMarkNonce(publicKey, nonce);
            expect(result).toBe(true);
        });

        it('should detect replay attack (reusing nonce)', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            // First use: success
            const firstUse = manager.verifyAndMarkNonce(publicKey, nonce);
            expect(firstUse).toBe(true);
            
            // Second use: replay attack detected!
            const secondUse = manager.verifyAndMarkNonce(publicKey, nonce);
            expect(secondUse).toBe(false);
        });

        it('should prevent any reuse of same nonce', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            manager.verifyAndMarkNonce(publicKey, nonce);
            
            // Try 10 more times
            for (let i = 0; i < 10; i++) {
                const result = manager.verifyAndMarkNonce(publicKey, nonce);
                expect(result).toBe(false);
            }
        });

        it('should allow different nonces for same key', () => {
            const publicKey = 'test-key';
            const nonce1 = manager.generateNonce(publicKey);
            const nonce2 = manager.generateNonce(publicKey);
            
            expect(manager.verifyAndMarkNonce(publicKey, nonce1)).toBe(true);
            expect(manager.verifyAndMarkNonce(publicKey, nonce2)).toBe(true);
        });

        it('should reject forged nonces', () => {
            const publicKey = 'test-key';
            const forgedNonce = 'a'.repeat(64); // Valid format but not generated
            
            const result = manager.verifyAndMarkNonce(publicKey, forgedNonce);
            expect(result).toBe(false);
        });
    });

    describe('cleanup', () => {
        it('should remove expired nonces', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            // Verify it exists
            expect(manager.verifyNonce(publicKey, nonce)).toBe(true);
            
            // Age it beyond expiry
            jest.advanceTimersByTime(3600001);
            
            // Trigger cleanup
            manager.cleanup();
            
            // Should be gone
            expect(manager.verifyNonce(publicKey, nonce)).toBe(false);
        });

        it('should keep fresh nonces during cleanup', () => {
            const publicKey = 'test-key';
            const nonce = manager.generateNonce(publicKey);
            
            // Cleanup immediately
            manager.cleanup();
            
            // Fresh nonce should still be valid
            expect(manager.verifyNonce(publicKey, nonce)).toBe(true);
        });

        it('should handle cleanup of mixed aged nonces', () => {
            const key = 'test-key';
            
            // Old nonce
            const oldNonce = manager.generateNonce(key);
            jest.advanceTimersByTime(3600001);
            
            // Fresh nonce
            const freshNonce = manager.generateNonce(key);
            
            // Cleanup
            manager.cleanup();
            
            // Old gone, fresh remains
            expect(manager.verifyNonce(key, oldNonce)).toBe(false);
            expect(manager.verifyNonce(key, freshNonce)).toBe(true);
        });
    });

    describe('loadFromDatabase', () => {
        it('should load nonces from database', async () => {
            const mockDb = {
                // @ts-ignore - Mock database for testing
                all: jest.fn().mockResolvedValue([
                    {
                        public_key: 'key1',
                        nonce: 'a'.repeat(64),
                        timestamp: Date.now() - 1000,
                        used: 0
                    }
                ])
            };
            
            // @ts-ignore - Mock database for testing
            await manager.loadFromDatabase(mockDb);
            
            // Loaded nonce should be usable
            const result = manager.verifyAndMarkNonce('key1', 'a'.repeat(64));
            expect(result).toBe(true);
        });

        it('should skip already-used nonces', async () => {
            const mockDb = {
                // @ts-ignore - Mock database for testing
                all: jest.fn().mockResolvedValue([
                    {
                        public_key: 'key1',
                        nonce: 'b'.repeat(64),
                        timestamp: Date.now() - 1000,
                        used: 1
                    }
                ])
            };
            
            // @ts-ignore - Mock database for testing
            await manager.loadFromDatabase(mockDb);
            
            // Already used nonce should reject
            const result = manager.verifyAndMarkNonce('key1', 'b'.repeat(64));
            expect(result).toBe(false);
        });

        it('should filter expired nonces on load', async () => {
            const mockDb = {
                // @ts-ignore - Mock database for testing
                all: jest.fn().mockResolvedValue([
                    {
                        public_key: 'key1',
                        nonce: 'c'.repeat(64),
                        timestamp: Date.now() - 3700000, // 61+ minutes ago
                        used: 0
                    }
                ])
            };
            
            // @ts-ignore - Mock database for testing
            await manager.loadFromDatabase(mockDb);
            
            // Expired nonce should not be loaded
            const result = manager.verifyNonce('key1', 'c'.repeat(64));
            expect(result).toBe(false);
        });
    });

    describe('persistToDatabase', () => {
        it('should save nonces to database', async () => {
            const mockDb = {
                // @ts-ignore - Mock database for testing
                run: jest.fn().mockResolvedValue({})
            };
            
            const nonce = manager.generateNonce('key1');
            await manager.persistToDatabase(mockDb);
            
            expect(mockDb.run).toHaveBeenCalled();
        });

        it('should include all nonce fields', async () => {
            // @ts-ignore - Mock database for testing
            const runMock = jest.fn().mockResolvedValue({});
            const mockDb = {
                run: runMock
            };
            
            manager.generateNonce('key1');
            await manager.persistToDatabase(mockDb);
            
            // Should have called run with SQL and parameters
            expect(runMock).toHaveBeenCalled();
            const callArgs = runMock.mock.calls[0];
            expect(callArgs[0]).toContain('INSERT');
            expect(callArgs[1]).toHaveLength(4); // publicKey, nonce, timestamp, used
        });
    });

    describe('getNonceStats', () => {
        it('should return statistics for public key', () => {
            const key = 'test-key';
            manager.generateNonce(key);
            manager.generateNonce(key);
            const nonce3 = manager.generateNonce(key);
            manager.verifyAndMarkNonce(key, nonce3);
            
            const stats = manager.getNonceStats(key);
            expect(stats.total).toBe(3);
            expect(stats.used).toBe(1);
            expect(stats.available).toBe(2);
        });

        it('should return zero stats for unknown key', () => {
            const stats = manager.getNonceStats('unknown-key');
            expect(stats.total).toBe(0);
            expect(stats.used).toBe(0);
            expect(stats.available).toBe(0);
        });
    });
});
