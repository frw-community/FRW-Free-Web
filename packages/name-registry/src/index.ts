// FRW Name Registry - Main Export

export * from './types.js';
export { MetricsCollector } from './metrics/collector.js';
export { ChallengeSystem } from './challenge/system.js';
export { MetricsDatabase } from './storage/database.js';
export { DNSVerifier, requiresDNSVerification, RESERVED_NAMES } from './dns/verifier.js';

// Security & Anti-Spam
export { ProofOfWorkGenerator, getRequiredDifficulty, verifyProof } from './pow/generator.js';
export type { ProofOfWork } from './pow/generator.js';
export { BondCalculator } from './bonds/calculator.js';
export type { BondConfig } from './bonds/calculator.js';
export { RateLimiter, AdaptiveRateLimiter } from './limits/rate-limiter.js';
export type { RateLimitConfig, RegistrationRecord } from './limits/rate-limiter.js';
export { NonceManager, createNonceSchema } from './security/nonce-manager.js';
export type { NonceRecord } from './security/nonce-manager.js';
export { ChallengeSpamPrevention } from './challenge/spam-prevention.js';
export type { ChallengeSpamConfig, ChallengeHistory } from './challenge/spam-prevention.js';
export { DatabaseCleanup } from './storage/cleanup.js';
export type { CleanupConfig } from './storage/cleanup.js';

// Phase 2 exports (to be implemented)
// export { TrustGraph } from './trust/graph.js';
// export { VotingSystem } from './voting/system.js';

// Phase 3 exports (to be implemented)
// export { JurySelection } from './jury/selection.js';
// export { ZKProofSystem } from './zkproof/system.js';
