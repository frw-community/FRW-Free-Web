// Rate Limiter for Name Registrations
// Prevent rapid-fire bot registrations

export interface RateLimitConfig {
    perMinute: number;
    perHour: number;
    perDay: number;
    perMonth: number;
    lifetime: number;
}

export interface RegistrationRecord {
    publicKey: string;
    name: string;
    timestamp: number;
}

export class RateLimiter {
    private config: RateLimitConfig;
    private records: Map<string, RegistrationRecord[]>;
    
    constructor(config?: Partial<RateLimitConfig>) {
        this.config = {
            perMinute: 1,      // Max 1 per minute
            perHour: 5,        // Max 5 per hour
            perDay: 20,        // Max 20 per day
            perMonth: 100,     // Max 100 per month
            lifetime: 1000,    // Max 1000 total per account
            ...config
        };
        
        this.records = new Map();
    }
    
    /**
     * Check if registration is allowed
     */
    checkLimit(publicKey: string): {
        allowed: boolean;
        reason?: string;
        retryAfter?: number;  // Seconds until next allowed
    } {
        const records = this.getRecords(publicKey);
        const now = Date.now();
        
        // Check lifetime limit
        if (records.length >= this.config.lifetime) {
            return {
                allowed: false,
                reason: `Lifetime limit reached (${this.config.lifetime} names)`
            };
        }
        
        // Check monthly limit
        const monthRecords = this.filterByAge(records, 30 * 86400000);
        if (monthRecords.length >= this.config.perMonth) {
            const oldestMonth = monthRecords[0].timestamp;
            const retryAfter = Math.ceil((oldestMonth + 30 * 86400000 - now) / 1000);
            return {
                allowed: false,
                reason: `Monthly limit reached (${this.config.perMonth}/month)`,
                retryAfter
            };
        }
        
        // Check daily limit
        const dayRecords = this.filterByAge(records, 86400000);
        if (dayRecords.length >= this.config.perDay) {
            const oldestDay = dayRecords[0].timestamp;
            const retryAfter = Math.ceil((oldestDay + 86400000 - now) / 1000);
            return {
                allowed: false,
                reason: `Daily limit reached (${this.config.perDay}/day)`,
                retryAfter
            };
        }
        
        // Check hourly limit
        const hourRecords = this.filterByAge(records, 3600000);
        if (hourRecords.length >= this.config.perHour) {
            const oldestHour = hourRecords[0].timestamp;
            const retryAfter = Math.ceil((oldestHour + 3600000 - now) / 1000);
            return {
                allowed: false,
                reason: `Hourly limit reached (${this.config.perHour}/hour)`,
                retryAfter
            };
        }
        
        // Check per-minute limit
        const minuteRecords = this.filterByAge(records, 60000);
        if (minuteRecords.length >= this.config.perMinute) {
            const oldestMinute = minuteRecords[0].timestamp;
            const retryAfter = Math.ceil((oldestMinute + 60000 - now) / 1000);
            return {
                allowed: false,
                reason: `Rate limit: 1 registration per minute`,
                retryAfter
            };
        }
        
        return { allowed: true };
    }
    
    /**
     * Record a registration
     */
    recordRegistration(publicKey: string, name: string): void {
        const records = this.getRecords(publicKey);
        
        records.push({
            publicKey,
            name,
            timestamp: Date.now()
        });
        
        this.records.set(publicKey, records);
        
        // Cleanup old records (older than 1 year)
        this.cleanupOldRecords(publicKey, 365 * 86400000);
    }
    
    /**
     * Get registration statistics
     */
    getStats(publicKey: string): {
        total: number;
        lastMinute: number;
        lastHour: number;
        lastDay: number;
        lastMonth: number;
        nextAllowed: Date | null;
    } {
        const records = this.getRecords(publicKey);
        
        const stats = {
            total: records.length,
            lastMinute: this.filterByAge(records, 60000).length,
            lastHour: this.filterByAge(records, 3600000).length,
            lastDay: this.filterByAge(records, 86400000).length,
            lastMonth: this.filterByAge(records, 30 * 86400000).length,
            nextAllowed: null as Date | null
        };
        
        // Calculate when next registration is allowed
        const check = this.checkLimit(publicKey);
        if (!check.allowed && check.retryAfter) {
            stats.nextAllowed = new Date(Date.now() + check.retryAfter * 1000);
        }
        
        return stats;
    }
    
    /**
     * Get records for public key
     */
    private getRecords(publicKey: string): RegistrationRecord[] {
        return this.records.get(publicKey) || [];
    }
    
    /**
     * Filter records by age
     */
    private filterByAge(
        records: RegistrationRecord[],
        maxAge: number
    ): RegistrationRecord[] {
        const cutoff = Date.now() - maxAge;
        return records.filter(r => r.timestamp >= cutoff);
    }
    
    /**
     * Cleanup old records
     */
    private cleanupOldRecords(publicKey: string, maxAge: number): void {
        const records = this.getRecords(publicKey);
        const filtered = this.filterByAge(records, maxAge);
        
        if (filtered.length < records.length) {
            this.records.set(publicKey, filtered);
        }
    }
    
    /**
     * Load records from database
     */
    async loadFromDatabase(
        db: any,
        publicKey?: string
    ): Promise<void> {
        // Load registration history from database
        const query = publicKey
            ? 'SELECT public_key, name, created FROM registrations WHERE public_key = ?'
            : 'SELECT public_key, name, created FROM registrations';
        
        const params = publicKey ? [publicKey] : [];
        const rows = db.prepare(query).all(...params);
        
        for (const row of rows) {
            const records = this.getRecords(row.public_key);
            records.push({
                publicKey: row.public_key,
                name: row.name,
                timestamp: row.created
            });
            this.records.set(row.public_key, records);
        }
    }
}

/**
 * Adaptive rate limiting based on reputation
 */
export class AdaptiveRateLimiter extends RateLimiter {
    constructor(
        private getReputation: (publicKey: string) => Promise<number>
    ) {
        super();
    }
    
    /**
     * Adjust limits based on reputation
     */
    async getAdjustedConfig(publicKey: string): Promise<RateLimitConfig> {
        const reputation = await this.getReputation(publicKey);
        const baseConfig = {
            perMinute: 1,
            perHour: 5,
            perDay: 20,
            perMonth: 100,
            lifetime: 1000
        };
        
        // Higher reputation = higher limits
        if (reputation >= 750) {  // PLATINUM
            return {
                ...baseConfig,
                perHour: 10,
                perDay: 50,
                perMonth: 200,
                lifetime: 5000
            };
        }
        
        if (reputation >= 500) {  // GOLD
            return {
                ...baseConfig,
                perHour: 8,
                perDay: 35,
                perMonth: 150,
                lifetime: 2000
            };
        }
        
        if (reputation >= 250) {  // SILVER
            return {
                ...baseConfig,
                perHour: 6,
                perDay: 25,
                perMonth: 120,
                lifetime: 1500
            };
        }
        
        // New users: stricter limits
        if (reputation < 100) {
            return {
                ...baseConfig,
                perHour: 3,
                perDay: 10,
                perMonth: 50,
                lifetime: 500
            };
        }
        
        return baseConfig;
    }
}
