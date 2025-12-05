/// <reference types="jest" />
import { generateProofOfWorkV2, getRequiredDifficultyV2 } from '../src/index';

describe('Proof of Work V2', () => {
  it('should return required difficulty for a name', () => {
    const diff = getRequiredDifficultyV2('testname');
    expect(diff).toBeDefined();
    expect(diff.leading_zeros).toBeGreaterThan(0);
  });

  it('should generate a valid V2 proof structure', async () => {
    const name = 'testname';
    const did = 'did:frw:v2:test';
    const difficulty = getRequiredDifficultyV2(name);
    
    const proof = await generateProofOfWorkV2(name, did, difficulty);
    
    expect(proof).toBeDefined();
    expect(proof.version).toBe(2);
    expect(typeof proof.nonce).toBe('bigint');
    expect(proof.hash).toBeInstanceOf(Buffer);
    expect(proof.timestamp).toBeLessThanOrEqual(Date.now());
  });
});
