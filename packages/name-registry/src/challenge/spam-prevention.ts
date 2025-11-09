// Challenge Spam Prevention
// Prevents flooding the system with fake challenges

export interface ChallengeSpamConfig {
    // Rate limits
    maxPerHour: number;
    maxPerDay: number;
    maxPerMonth: number;
    maxActivePerUser: number;
    
    // Progressive bond increases
    baseBond: bigint;
    lostChallengeMultiplier: number;
    recentChallengeMultiplier: number;
    
    // Cooling off period after lost challenge
    lostChallengeCooldown: number;
}

export interface ChallengeHistory {
    publicKey: string;
    challenges: Array<{
        challengeId: string;
        name: string;
        timestamp: number;
        outcome: 'pending' | 'won' | 'lost' | 'withdrawn';
    }>;
}

export class ChallengeSpamPrevention {
    private config: ChallengeSpamConfig;
    private history: Map<string, ChallengeHistory>;
    
    constructor(config?: Partial<ChallengeSpamConfig>) {
        this.config = {
            maxPerHour: 2,
            maxPerDay: 5,
            maxPerMonth: 20,
            maxActivePerUser: 3,
            baseBond: 1_000_000n,
            lostChallengeMultiplier: 2.0,
            recentChallengeMultiplier: 1.5,
            lostChallengeCooldown: 7 * 86400000, // 7 days
            ...config
        };
        
        this.history = new Map();
    }
    
    /**
     * Check if user can create a challenge
     */
    canCreateChallenge(publicKey: string): {
        allowed: boolean;
        reason?: string;
        requiredBond?: bigint;
        cooldownEnd?: Date;
    } {
        const history = this.getHistory(publicKey);
        const now = Date.now();
        
        // Check cooling off period after lost challenge
        const recentLosses = history.challenges.filter(
            c => c.outcome === 'lost' && 
                 (now - c.timestamp) < this.config.lostChallengeCooldown
        );
        
        if (recentLosses.length > 0) {
            const lastLoss = recentLosses[recentLosses.length - 1];
            const cooldownEnd = new Date(lastLoss.timestamp + this.config.lostChallengeCooldown);
            
            return {
                allowed: false,
                reason: `Cooling off period after lost challenge`,
                cooldownEnd
            };
        }
        
        // Check active challenges limit
        const active = history.challenges.filter(c => c.outcome === 'pending');
        if (active.length >= this.config.maxActivePerUser) {
            return {
                allowed: false,
                reason: `Maximum ${this.config.maxActivePerUser} active challenges reached`
            };
        }
        
        // Check hourly limit
        const lastHour = history.challenges.filter(
            c => (now - c.timestamp) < 3600000
        );
        if (lastHour.length >= this.config.maxPerHour) {
            return {
                allowed: false,
                reason: `Hourly limit: ${this.config.maxPerHour} challenges/hour`
            };
        }
        
        // Check daily limit
        const lastDay = history.challenges.filter(
            c => (now - c.timestamp) < 86400000
        );
        if (lastDay.length >= this.config.maxPerDay) {
            return {
                allowed: false,
                reason: `Daily limit: ${this.config.maxPerDay} challenges/day`
            };
        }
        
        // Check monthly limit
        const lastMonth = history.challenges.filter(
            c => (now - c.timestamp) < 30 * 86400000
        );
        if (lastMonth.length >= this.config.maxPerMonth) {
            return {
                allowed: false,
                reason: `Monthly limit: ${this.config.maxPerMonth} challenges/month`
            };
        }
        
        // Calculate required bond
        const requiredBond = this.calculateRequiredBond(publicKey);
        
        return {
            allowed: true,
            requiredBond
        };
    }
    
    /**
     * Calculate required bond based on history
     */
    calculateRequiredBond(publicKey: string): bigint {
        const history = this.getHistory(publicKey);
        const now = Date.now();
        
        let bond = this.config.baseBond;
        
        // Count lost challenges (all time)
        const lostCount = history.challenges.filter(c => c.outcome === 'lost').length;
        if (lostCount > 0) {
            // Exponential increase for repeat offenders
            const multiplier = Math.pow(this.config.lostChallengeMultiplier, lostCount);
            bond = BigInt(Math.floor(Number(bond) * multiplier));
        }
        
        // Count recent challenges (last 7 days)
        const recentCount = history.challenges.filter(
            c => (now - c.timestamp) < 7 * 86400000
        ).length;
        
        if (recentCount > 0) {
            // Progressive increase for frequent challengers
            const multiplier = Math.pow(this.config.recentChallengeMultiplier, recentCount);
            bond = BigInt(Math.floor(Number(bond) * multiplier));
        }
        
        return bond;
    }
    
    /**
     * Record a new challenge
     */
    recordChallenge(
        publicKey: string,
        challengeId: string,
        name: string
    ): void {
        const history = this.getHistory(publicKey);
        
        history.challenges.push({
            challengeId,
            name,
            timestamp: Date.now(),
            outcome: 'pending'
        });
        
        this.history.set(publicKey, history);
    }
    
    /**
     * Update challenge outcome
     */
    updateOutcome(
        publicKey: string,
        challengeId: string,
        outcome: 'won' | 'lost' | 'withdrawn'
    ): void {
        const history = this.getHistory(publicKey);
        
        const challenge = history.challenges.find(c => c.challengeId === challengeId);
        if (challenge) {
            challenge.outcome = outcome;
            this.history.set(publicKey, history);
        }
    }
    
    /**
     * Get challenge statistics for user
     */
    getStats(publicKey: string): {
        total: number;
        active: number;
        won: number;
        lost: number;
        withdrawn: number;
        winRate: number;
        requiredBond: string;
        canChallenge: boolean;
    } {
        const history = this.getHistory(publicKey);
        
        const total = history.challenges.length;
        const active = history.challenges.filter(c => c.outcome === 'pending').length;
        const won = history.challenges.filter(c => c.outcome === 'won').length;
        const lost = history.challenges.filter(c => c.outcome === 'lost').length;
        const withdrawn = history.challenges.filter(c => c.outcome === 'withdrawn').length;
        
        const completed = won + lost;
        const winRate = completed > 0 ? (won / completed) * 100 : 0;
        
        const check = this.canCreateChallenge(publicKey);
        
        return {
            total,
            active,
            won,
            lost,
            withdrawn,
            winRate,
            requiredBond: check.requiredBond?.toString() || '0',
            canChallenge: check.allowed
        };
    }
    
    /**
     * Check for suspicious patterns
     */
    detectSuspiciousActivity(publicKey: string): {
        suspicious: boolean;
        reasons: string[];
    } {
        const history = this.getHistory(publicKey);
        const reasons: string[] = [];
        
        // Pattern 1: High volume of challenges
        const last24h = history.challenges.filter(
            c => (Date.now() - c.timestamp) < 86400000
        );
        if (last24h.length > 10) {
            reasons.push('Unusually high challenge volume');
        }
        
        // Pattern 2: Low win rate with many challenges
        const completed = history.challenges.filter(
            c => c.outcome === 'won' || c.outcome === 'lost'
        );
        const won = history.challenges.filter(c => c.outcome === 'won').length;
        const winRate = completed.length > 0 ? won / completed.length : 0;
        
        if (completed.length > 10 && winRate < 0.2) {
            reasons.push('Low win rate (<20%) with high volume');
        }
        
        // Pattern 3: Multiple withdrawn challenges
        const withdrawn = history.challenges.filter(c => c.outcome === 'withdrawn').length;
        if (withdrawn > 5) {
            reasons.push('Many withdrawn challenges (possible harassment)');
        }
        
        // Pattern 4: Challenges against many different names
        const uniqueNames = new Set(history.challenges.map(c => c.name));
        if (uniqueNames.size > 50) {
            reasons.push('Challenges against many different names');
        }
        
        return {
            suspicious: reasons.length > 0,
            reasons
        };
    }
    
    /**
     * Get challenge history
     */
    private getHistory(publicKey: string): ChallengeHistory {
        if (!this.history.has(publicKey)) {
            this.history.set(publicKey, {
                publicKey,
                challenges: []
            });
        }
        
        return this.history.get(publicKey)!;
    }
    
    /**
     * Load history from database
     */
    async loadFromDatabase(db: any): Promise<void> {
        const rows = await db.all(`
            SELECT 
                c.challenger as public_key,
                c.challenge_id,
                c.name,
                c.created as timestamp,
                CASE 
                    WHEN c.status LIKE 'resolved_challenger_wins' THEN 'won'
                    WHEN c.status LIKE 'resolved_owner_wins' THEN 'lost'
                    WHEN c.status = 'withdrawn' THEN 'withdrawn'
                    ELSE 'pending'
                END as outcome
            FROM challenges c
            WHERE c.created > ?
            ORDER BY c.created DESC
        `, [Date.now() - 365 * 86400000]); // Last year
        
        for (const row of rows) {
            const history = this.getHistory(row.public_key);
            
            history.challenges.push({
                challengeId: row.challenge_id,
                name: row.name,
                timestamp: row.timestamp,
                outcome: row.outcome
            });
            
            this.history.set(row.public_key, history);
        }
    }
}
