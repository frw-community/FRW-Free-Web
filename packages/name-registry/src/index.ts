// FRW Name Registry - Main Export

export * from './types.js';
export { MetricsCollector } from './metrics/collector.js';
export { ChallengeSystem } from './challenge/system.js';
export { MetricsDatabase } from './storage/database.js';
export { DNSVerifier, requiresDNSVerification, RESERVED_NAMES } from './dns/verifier.js';

// Phase 2 exports (to be implemented)
// export { TrustGraph } from './trust/graph.js';
// export { VotingSystem } from './voting/system.js';

// Phase 3 exports (to be implemented)
// export { JurySelection } from './jury/selection.js';
// export { ZKProofSystem } from './zkproof/system.js';
