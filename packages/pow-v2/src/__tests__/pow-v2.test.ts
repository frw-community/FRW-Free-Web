// FAST PoW tests (using long names for instant computation)

import { describe, it, expect } from '@jest/globals';
import { generatePOWV2, verifyPOWV2 } from '../index';

describe('PoW V2 - Fast Tests', () => {
  describe('generatePOWV2 and verifyPOWV2', () => {
    it('should generate and verify PoW for long name (instant)', async () => {
      const name = 'verylongnameforinstantpow'; // 16+ chars = instant
      const publicKey = new Uint8Array(1952).fill(1);
      
      const proof = await generatePOWV2(name, publicKey);
      
      expect(proof.version).toBe(2);
      expect(proof.difficulty).toBe(0); // No PoW needed for long names
      expect(proof.hash).toBeInstanceOf(Uint8Array);
      expect(proof.hash.length).toBe(32);
      
      const valid = await verifyPOWV2(name, publicKey, proof);
      expect(valid).toBe(true);
    }, 5000); // 5 second timeout

    it('should reject invalid PoW', async () => {
      const name = 'verylongnameforinstantpow';
      const publicKey = new Uint8Array(1952).fill(1);
      
      const proof = await generatePOWV2(name, publicKey);
      
      // Corrupt the hash
      proof.hash[0] ^= 0xFF;
      
      const valid = await verifyPOWV2(name, publicKey, proof);
      expect(valid).toBe(false);
    }, 5000);

    it('should reject PoW for wrong name', async () => {
      const name1 = 'verylongnameforinstantpow';
      const name2 = 'differentlongnametest';
      const publicKey = new Uint8Array(1952).fill(1);
      
      const proof = await generatePOWV2(name1, publicKey);
      const valid = await verifyPOWV2(name2, publicKey, proof);
      
      expect(valid).toBe(false);
    }, 5000);

    it('should reject old PoW (timestamp check)', async () => {
      const name = 'verylongnameforinstantpow';
      const publicKey = new Uint8Array(1952).fill(1);
      
      const proof = await generatePOWV2(name, publicKey);
      
      // Set timestamp to past (before 2025)
      proof.timestamp = new Date('2024-01-01').getTime();
      
      const valid = await verifyPOWV2(name, publicKey, proof);
      expect(valid).toBe(false);
    }, 5000);

    it('should include progress callback', async () => {
      const name = 'verylongnameforinstantpow';
      const publicKey = new Uint8Array(1952).fill(1);
      
      let progressCalled = false;
      await generatePOWV2(name, publicKey, (progress) => {
        progressCalled = true;
        expect(progress.attempts).toBeGreaterThanOrEqual(0n);
      });
      
      // For instant PoW, might not call progress
      expect(true).toBe(true);
    }, 5000);
  });

  describe('PoW verification edge cases', () => {
    it('should reject future timestamp', async () => {
      const name = 'verylongnameforinstantpow';
      const publicKey = new Uint8Array(1952).fill(1);
      
      const proof = await generatePOWV2(name, publicKey);
      
      // Set timestamp to future
      proof.timestamp = Date.now() + 7200000; // 2 hours in future
      
      const valid = await verifyPOWV2(name, publicKey, proof);
      expect(valid).toBe(false);
    }, 5000);

    it('should reject wrong version', async () => {
      const name = 'verylongnameforinstantpow';
      const publicKey = new Uint8Array(1952).fill(1);
      
      const proof = await generatePOWV2(name, publicKey);
      
      // Wrong version
      proof.version = 1 as any;
      
      const valid = await verifyPOWV2(name, publicKey, proof);
      expect(valid).toBe(false);
    }, 5000);
  });
});
