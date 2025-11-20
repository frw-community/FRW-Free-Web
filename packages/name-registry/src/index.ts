// FRW Name Registry - Main Export

export * from './types';
export { MetricsCollector } from './metrics/collector';
export { ChallengeSystem } from './challenge/system';
export { MetricsDatabase } from './storage/database';
export { DNSVerifier, requiresDNSVerification, RESERVED_NAMES } from './dns/verifier';

// Security & Anti-Spam
export { ProofOfWorkGenerator, getRequiredDifficulty, verifyProof } from './pow/generator';
export type { ProofOfWork } from './pow/generator';
export { BondCalculator } from './bonds/calculator';
export type { BondConfig } from './bonds/calculator';
export { RateLimiter, AdaptiveRateLimiter } from './limits/rate-limiter';
export type { RateLimitConfig, RegistrationRecord } from './limits/rate-limiter';
export { NonceManager, createNonceSchema } from './security/nonce-manager';
export type { NonceRecord } from './security/nonce-manager';
export { ChallengeSpamPrevention } from './challenge/spam-prevention';
export type { ChallengeSpamConfig, ChallengeHistory } from './challenge/spam-prevention';
export { DatabaseCleanup } from './storage/cleanup';
export type { CleanupConfig } from './storage/cleanup';

// Phase 2 exports (to be implemented)
// export { TrustGraph } from './trust/graph.js';
// export { VotingSystem } from './voting/system.js';

// Phase 3 exports (to be implemented)
// export { JurySelection } from './jury/selection.js';
// export { ZKProofSystem } from './zkproof/system.js';
