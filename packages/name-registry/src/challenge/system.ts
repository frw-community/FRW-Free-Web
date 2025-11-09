// Phase 1: Challenge System Implementation

import type {
    Challenge,
    ChallengeReason,
    ChallengeResponse,
    ChallengeResolution,
    ChallengeStatus,
    Evidence,
    ResolutionMethod
} from '../types.js';
import { MetricsCollector } from '../metrics/collector.js';
import type { MetricsDatabase } from '../storage/database.js';

export class ChallengeSystem {
    private readonly RESPONSE_PERIOD = 30 * 86400000; // 30 days
    private readonly EVALUATION_PERIOD = 14 * 86400000; // 14 days
    private readonly MIN_BOND = 1000000n;
    private readonly RESOLUTION_THRESHOLD = 0.20; // 20% score difference
    
    private metricsCollector: MetricsCollector;
    private db: MetricsDatabase;
    
    constructor(metricsCollector: MetricsCollector, db: MetricsDatabase) {
        this.metricsCollector = metricsCollector;
        this.db = db;
    }
    
    async createChallenge(
        name: string,
        currentOwner: string,
        challenger: string,
        reason: ChallengeReason,
        evidence: Evidence[],
        bond: bigint
    ): Promise<Challenge> {
        // Validate bond
        if (bond < this.MIN_BOND) {
            throw new Error(`Bond must be at least ${this.MIN_BOND}`);
        }
        
        // Validate name
        if (!name || name.length < 3) {
            throw new Error('Invalid name');
        }
        
        // Collect current owner metrics
        const ownerMetrics = await this.metricsCollector.collectMetrics(currentOwner);
        
        // Create challenge
        const challenge: Challenge = {
            challengeId: this.generateChallengeId(),
            name,
            currentOwner,
            currentOwnerMetrics: ownerMetrics,
            challenger,
            challengerBond: bond,
            challengeReason: reason,
            evidence,
            timestamps: {
                created: Date.now(),
                responseDeadline: Date.now() + this.RESPONSE_PERIOD,
                evaluationDeadline: Date.now() + this.RESPONSE_PERIOD + this.EVALUATION_PERIOD
            },
            status: 'pending_response' as ChallengeStatus
        };
        
        // Save to database
        this.db.saveChallenge(challenge);
        
        return challenge;
    }
    
    async respondToChallenge(
        challengeId: string,
        responder: string,
        counterEvidence: Evidence[],
        counterBond: bigint
    ): Promise<Challenge> {
        const challenge = this.db.getChallenge(challengeId);
        
        if (!challenge) {
            throw new Error('Challenge not found');
        }
        
        // Validate responder
        if (responder !== challenge.currentOwner) {
            throw new Error('Only current owner can respond');
        }
        
        // Check deadline
        if (Date.now() > challenge.timestamps.responseDeadline) {
            throw new Error('Response deadline passed');
        }
        
        // Validate counter-bond
        if (counterBond < challenge.challengerBond) {
            throw new Error('Counter-bond must match or exceed challenge bond');
        }
        
        // Check if already responded
        if (challenge.response) {
            throw new Error('Challenge already has a response');
        }
        
        // Collect fresh metrics
        const metricsProof = await this.metricsCollector.collectMetrics(responder);
        
        // Create response
        const response: ChallengeResponse = {
            responder,
            counterBond,
            counterEvidence,
            metricsProof,
            timestamp: Date.now()
        };
        
        // Update challenge
        challenge.response = response;
        challenge.status = 'under_evaluation' as ChallengeStatus;
        
        // Save updated challenge
        this.db.saveChallenge(challenge);
        
        return challenge;
    }
    
    async resolveChallenge(challengeId: string): Promise<ChallengeResolution> {
        const challenge = this.db.getChallenge(challengeId);
        
        if (!challenge) {
            throw new Error('Challenge not found');
        }
        
        // Check if already resolved
        if (challenge.resolution) {
            throw new Error('Challenge already resolved');
        }
        
        // Check if evaluation period complete
        if (Date.now() < challenge.timestamps.evaluationDeadline) {
            throw new Error('Evaluation period not complete');
        }
        
        let resolution: ChallengeResolution;
        
        // No response case: challenger wins by default
        if (!challenge.response) {
            const challengerMetrics = await this.metricsCollector.collectMetrics(challenge.challenger);
            
            resolution = {
                winner: challenge.challenger,
                method: 'default' as ResolutionMethod,
                finalMetrics: {
                    owner: challenge.currentOwnerMetrics,
                    challenger: challengerMetrics
                },
                bondDistribution: {
                    winner: challenge.challengerBond,
                    validators: 0n,
                    burned: 0n
                }
            };
        } else {
            // Automatic resolution via metrics
            resolution = await this.resolveViaMetrics(challenge);
        }
        
        // Update challenge
        challenge.resolution = resolution;
        challenge.status = resolution.winner === challenge.challenger
            ? 'resolved_challenger_wins' as ChallengeStatus
            : 'resolved_owner_wins' as ChallengeStatus;
        challenge.timestamps.resolved = Date.now();
        
        // Save resolved challenge
        this.db.saveChallenge(challenge);
        
        return resolution;
    }
    
    private async resolveViaMetrics(challenge: Challenge): Promise<ChallengeResolution> {
        const ownerMetrics = challenge.response!.metricsProof;
        const challengerMetrics = await this.metricsCollector.collectMetrics(challenge.challenger);
        
        const ownerScore = ownerMetrics.usageScore;
        const challengerScore = challengerMetrics.usageScore;
        
        // Calculate score difference
        const maxScore = Math.max(ownerScore, challengerScore);
        const scoreDiff = Math.abs(ownerScore - challengerScore) / Math.max(maxScore, 1);
        
        let winner: string;
        let method: ResolutionMethod = 'automatic_metrics' as ResolutionMethod;
        
        // Require significant difference (20% threshold)
        if (scoreDiff < this.RESOLUTION_THRESHOLD) {
            // Too close: would escalate to community vote in Phase 2
            // For Phase 1, slight edge to current owner (status quo bias)
            winner = challenge.currentOwner;
        } else {
            // Clear winner based on metrics
            winner = ownerScore > challengerScore ? challenge.currentOwner : challenge.challenger;
        }
        
        // Calculate bond distribution
        const totalBond = challenge.challengerBond + challenge.response!.counterBond;
        const validatorFee = totalBond / 10n; // 10% to validators (Phase 2)
        const burnAmount = totalBond / 20n;   // 5% burned
        const winnerAmount = totalBond - validatorFee - burnAmount;
        
        return {
            winner,
            method,
            finalMetrics: {
                owner: ownerMetrics,
                challenger: challengerMetrics
            },
            bondDistribution: {
                winner: winnerAmount,
                validators: validatorFee,
                burned: burnAmount
            }
        };
    }
    
    getChallengeStatus(challengeId: string): Challenge | null {
        return this.db.getChallenge(challengeId);
    }
    
    listChallenges(filter?: {
        owner?: string;
        challenger?: string;
        status?: ChallengeStatus;
    }): Challenge[] {
        return this.db.listChallenges(filter);
    }
    
    private generateChallengeId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 10);
        return `chal_${timestamp}${random}`;
    }
}
