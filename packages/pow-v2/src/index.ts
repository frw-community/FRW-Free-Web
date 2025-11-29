// @frw/pow-v2 - Quantum-Resistant Proof of Work

export * from './types.js';
export * from './difficulty-v2.js';
export * from './generator-v2.js';
export * from './verifier-v2.js';

// Convenience re-exports
export { ProofOfWorkGeneratorV2, generatePOWV2 } from './generator-v2.js';
export { ProofOfWorkVerifierV2, verifyPOWV2 } from './verifier-v2.js';
export { 
  getRequiredDifficulty,
  estimateTime,
  validateDifficulty,
  compareDifficulty
} from './difficulty-v2.js';
