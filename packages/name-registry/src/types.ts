// Phase 1: Core Types for Content Metrics and Challenges

export interface ContentMetrics {
    name: string;
    publicKey: string;
    
    // IPFS-derived metrics
    totalPeerConnections: number;
    uniquePeerIds: Set<string>;
    contentFetches: number;
    ipnsUpdates: number;
    contentSize: number;
    dagDepth: number;
    
    // FRW-specific metrics
    inboundLinks: string[];
    verificationCount: number;
    lastActivity: number;
    
    // Time-series data
    activityHistory: ActivitySnapshot[];
    
    // Calculated scores
    legitimacyScore: number;
    usageScore: number;
}

export interface ActivitySnapshot {
    timestamp: number;
    peerConnections: number;
    fetches: number;
    contentSize: number;
}

export enum ChallengeReason {
    NO_USAGE = 'no_usage',
    TRADEMARK = 'trademark',
    IMPERSONATION = 'impersonation',
    MALICIOUS_CONTENT = 'malicious_content',
    SQUATTING = 'squatting'
}

export interface Evidence {
    type: 'ipfs_cid' | 'url' | 'text' | 'signature';
    content: string;
    description: string;
    timestamp: number;
}

export enum ChallengeStatus {
    PENDING_RESPONSE = 'pending_response',
    UNDER_EVALUATION = 'under_evaluation',
    RESOLVED_CHALLENGER_WINS = 'resolved_challenger_wins',
    RESOLVED_OWNER_WINS = 'resolved_owner_wins',
    EXPIRED = 'expired'
}

export interface Challenge {
    challengeId: string;
    name: string;
    currentOwner: string;
    currentOwnerMetrics: ContentMetrics;
    
    challenger: string;
    challengerBond: bigint;
    challengeReason: ChallengeReason;
    evidence: Evidence[];
    
    timestamps: {
        created: number;
        responseDeadline: number;
        evaluationDeadline: number;
        resolved?: number;
    };
    
    response?: ChallengeResponse;
    resolution?: ChallengeResolution;
    status: ChallengeStatus;
}

export interface ChallengeResponse {
    responder: string;
    counterBond: bigint;
    counterEvidence: Evidence[];
    metricsProof: ContentMetrics;
    timestamp: number;
}

export enum ResolutionMethod {
    AUTOMATIC_METRICS = 'automatic_metrics',
    COMMUNITY_VOTE = 'community_vote',
    JURY_DECISION = 'jury_decision',
    DEFAULT = 'default'
}

export interface ChallengeResolution {
    winner: string;
    method: ResolutionMethod;
    votes?: Vote[];
    finalMetrics: {
        owner: ContentMetrics;
        challenger: ContentMetrics;
    };
    bondDistribution: {
        winner: bigint;
        validators: bigint;
        burned: bigint;
    };
}

// Phase 2: Trust Graph Types

export interface TrustNode {
    publicKey: string;
    reputation: number;
    registeredNames: string[];
    publishedContent: string[];
    verifiedDomains: string[];
    
    trustedBy: string[];
    trusts: string[];
    endorsements: Endorsement[];
    
    totalChallenges: number;
    successfulChallenges: number;
    validations: number;
    correctValidations: number;
    
    joined: number;
    lastActive: number;
}

export interface TrustEdge {
    from: string;
    to: string;
    weight: number;
    bidirectional: boolean;
    attestations: Attestation[];
    created: number;
}

export interface Attestation {
    attester: string;
    subject: string;
    claim: string;
    evidence: string;
    signature: Buffer;
    timestamp: number;
}

export interface Endorsement {
    endorser: string;
    weight: number;
    reason: string;
    timestamp: number;
}

export interface Vote {
    voteId: string;
    challengeId: string;
    voter: string;
    choice: string;
    weight: number;
    reasoning: string;
    signature: Buffer;
    timestamp: number;
}

// Phase 3: Advanced Types

export interface Validator {
    publicKey: string;
    reputation: number;
    stake: bigint;
    participationHistory: number[];
    lastSelection: number;
}

export interface ZKUsageProof {
    name: string;
    publicKey: string;
    statement: {
        minVisits: number;
        minUpdates: number;
        minContentSize: number;
        timeframe: number;
    };
    proof: Buffer;
    publicInputs: any[];
    proofSystem: 'groth16' | 'plonk';
    circuit: string;
    timestamp: number;
}
