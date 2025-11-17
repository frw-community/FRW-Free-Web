// @frw/pow-v2 - Quantum-Resistant Proof of Work

export * from './types';
export * from './difficulty-v2';
export * from './generator-v2';
export * from './verifier-v2';

// Convenience re-exports
export { ProofOfWorkGeneratorV2, generatePOWV2 } from './generator-v2';
export { ProofOfWorkVerifierV2, verifyPOWV2 } from './verifier-v2';
export { 
  getDifficultyParams, 
  getRequiredDifficultyV2,
  estimateComputationTime 
} from './difficulty-v2';
export * from './difficulty-v2';
export * from './types';
