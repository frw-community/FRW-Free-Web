// Database Cleanup and Maintenance
// Prevents storage exhaustion

export interface CleanupConfig {
    maxDatabaseSize: number;           // Maximum database size in bytes
    maxRecordsPerUser: number;         // Maximum names per user
    maxEvidenceSize: number;           // Maximum evidence size per challenge
    metricsRetention: number;          // How long to keep metrics (ms)
    challengeRetention: number;        // How long to keep resolved challenges (ms)
    nonceRetention: number;            // How long to keep nonces (ms)
}

export class DatabaseCleanup {
    private config: CleanupConfig;
    
    constructor(config?: Partial<CleanupConfig>) {
        this.config = {
            maxDatabaseSize: 1_000_000_000,      // 1GB
            maxRecordsPerUser: 1000,
            maxEvidenceSize: 10_000_000,         // 10MB
            metricsRetention: 365 * 86400000,    // 1 year
            challengeRetention: 180 * 86400000,  // 6 months
            nonceRetention: 86400000,            // 1 day
            ...config
        };
    }
    
    /**
     * Check if database size is approaching limit
     */
    async checkSize(dbPath: string): Promise<{
        currentSize: number;
        maxSize: number;
        percentage: number;
        needsCleanup: boolean;
    }> {
        const fs = await import('fs');
        const stats = fs.statSync(dbPath);
        const currentSize = stats.size;
        const percentage = (currentSize / this.config.maxDatabaseSize) * 100;
        
        return {
            currentSize,
            maxSize: this.config.maxDatabaseSize,
            percentage,
            needsCleanup: percentage > 80  // Cleanup at 80% capacity
        };
    }
    
    /**
     * Perform full database cleanup
     */
    async cleanup(db: any): Promise<{
        metricsDeleted: number;
        challengesDeleted: number;
        noncesDeleted: number;
        totalDeleted: number;
        spaceFreed: number;
    }> {
        const startSize = await this.getDatabaseSize(db);
        
        // Clean up old metrics
        const metricsDeleted = await this.cleanupMetrics(db);
        
        // Clean up old challenges
        const challengesDeleted = await this.cleanupChallenges(db);
        
        // Clean up old nonces
        const noncesDeleted = await this.cleanupNonces(db);
        
        const totalDeleted = metricsDeleted + challengesDeleted + noncesDeleted;
        
        // Vacuum database to reclaim space
        await db.exec('VACUUM');
        
        const endSize = await this.getDatabaseSize(db);
        const spaceFreed = startSize - endSize;
        
        return {
            metricsDeleted,
            challengesDeleted,
            noncesDeleted,
            totalDeleted,
            spaceFreed
        };
    }
    
    /**
     * Clean up old metrics
     */
    async cleanupMetrics(db: any): Promise<number> {
        const cutoff = Date.now() - this.config.metricsRetention;
        
        const result = await db.run(`
            DELETE FROM metrics 
            WHERE timestamp < ?
        `, [cutoff]);
        
        return result.changes || 0;
    }
    
    /**
     * Clean up old resolved challenges
     */
    async cleanupChallenges(db: any): Promise<number> {
        const cutoff = Date.now() - this.config.challengeRetention;
        
        // Only delete resolved challenges
        const result = await db.run(`
            DELETE FROM challenges 
            WHERE status IN ('resolved_owner_wins', 'resolved_challenger_wins')
            AND resolved < ?
        `, [cutoff]);
        
        return result.changes || 0;
    }
    
    /**
     * Clean up old nonces
     */
    async cleanupNonces(db: any): Promise<number> {
        const cutoff = Date.now() - this.config.nonceRetention;
        
        const result = await db.run(`
            DELETE FROM nonces 
            WHERE timestamp < ?
        `, [cutoff]);
        
        return result.changes || 0;
    }
    
    /**
     * Enforce user registration limits
     */
    async enforceUserLimits(db: any, publicKey: string): Promise<boolean> {
        // Count user's registrations
        const result = await db.get(`
            SELECT COUNT(*) as count 
            FROM registrations 
            WHERE public_key = ?
        `, [publicKey]);
        
        return result.count < this.config.maxRecordsPerUser;
    }
    
    /**
     * Validate evidence size
     */
    validateEvidenceSize(evidence: any[] | string): {
        valid: boolean;
        totalSize: number;
        maxSize: number;
        size: number;
        reason?: string;
    } {
        let totalSize = 0;
        
        // Handle string input (for tests)
        if (typeof evidence === 'string') {
            totalSize = evidence.length;
        } else {
            // Handle array input
            for (const item of evidence) {
                // Estimate size (rough approximation)
                totalSize += JSON.stringify(item).length;
            }
        }
        
        const valid = totalSize <= this.config.maxEvidenceSize;
        
        return {
            valid,
            totalSize,
            maxSize: this.config.maxEvidenceSize,
            size: totalSize,  // Alias for tests
            reason: valid ? undefined : `Evidence size ${totalSize} exceeds maximum ${this.config.maxEvidenceSize}`
        };
    }
    
    /**
     * Get database statistics
     */
    async getStats(db: any): Promise<{
        totalRecords: number;
        metricsRecords: number;
        challengeRecords: number;
        nonceRecords: number;
        registrationRecords: number;
        oldestMetric: Date | null;
        oldestChallenge: Date | null;
    }> {
        const metrics = await db.get('SELECT COUNT(*) as count, MIN(timestamp) as oldest FROM metrics');
        const challenges = await db.get('SELECT COUNT(*) as count, MIN(created) as oldest FROM challenges');
        const nonces = await db.get('SELECT COUNT(*) as count FROM nonces');
        const registrations = await db.get('SELECT COUNT(*) as count FROM registrations');
        
        return {
            totalRecords: metrics.count + challenges.count + nonces.count + registrations.count,
            metricsRecords: metrics.count,
            challengeRecords: challenges.count,
            nonceRecords: nonces.count,
            registrationRecords: registrations.count,
            oldestMetric: metrics.oldest ? new Date(metrics.oldest) : null,
            oldestChallenge: challenges.oldest ? new Date(challenges.oldest) : null
        };
    }
    
    /**
     * Get database size
     */
    private async getDatabaseSize(db: any): Promise<number> {
        const result = await db.get('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()');
        return result.size || 0;
    }
    
    /**
     * Check database size using db object (convenience method for tests)
     */
    async checkDatabaseSize(db: any): Promise<{
        currentSize: number;
        maxSize: number;
        percentage: number;
        percentageUsed: number;
        needsCleanup: boolean;
    }> {
        const currentSize = await this.getDatabaseSize(db);
        const percentage = (currentSize / this.config.maxDatabaseSize) * 100;
        
        return {
            currentSize,
            maxSize: this.config.maxDatabaseSize,
            percentage,
            percentageUsed: percentage,  // Alias for tests
            needsCleanup: percentage > 80
        };
    }
    
    /**
     * Check user limits with detailed stats (convenience method for tests)
     */
    async checkUserLimits(db: any, publicKey: string): Promise<{
        allowed: boolean;
        currentCount: number;
        maxCount: number;
        maxAllowed: number;
        remaining: number;
    }> {
        const result = await db.get(`
            SELECT COUNT(*) as count 
            FROM registrations 
            WHERE public_key = ?
        `, [publicKey]);
        
        const currentCount = result.count || 0;
        const allowed = currentCount < this.config.maxRecordsPerUser;
        
        return {
            allowed,
            currentCount,
            maxCount: this.config.maxRecordsPerUser,
            maxAllowed: this.config.maxRecordsPerUser,  // Alias for tests
            remaining: Math.max(0, this.config.maxRecordsPerUser - currentCount)
        };
    }
    
    /**
     * Get cleanup statistics with configuration
     */
    async getCleanupStats(db?: any) {
        if (!db) {
            // Return config only if no db provided
            return {
                totalRecords: 0,
                metricsRecords: 0,
                challengeRecords: 0,
                nonceRecords: 0,
                registrationRecords: 0,
                oldestMetric: null,
                oldestChallenge: null,
                metricsRetentionDays: Math.floor(this.config.metricsRetention / 86400000),
                challengesRetentionDays: Math.floor(this.config.challengeRetention / 86400000),
                noncesRetentionDays: Math.floor(this.config.nonceRetention / 86400000),
                maxDatabaseSize: this.config.maxDatabaseSize,
                maxRecordsPerUser: this.config.maxRecordsPerUser,
                maxEvidenceSize: this.config.maxEvidenceSize
            };
        }
        
        const stats = await this.getStats(db);
        return {
            ...stats,
            metricsRetentionDays: Math.floor(this.config.metricsRetention / 86400000),
            challengesRetentionDays: Math.floor(this.config.challengeRetention / 86400000),
            noncesRetentionDays: Math.floor(this.config.nonceRetention / 86400000),
            maxDatabaseSize: this.config.maxDatabaseSize,
            maxRecordsPerUser: this.config.maxRecordsPerUser,
            maxEvidenceSize: this.config.maxEvidenceSize
        };
    }
    
    /**
     * Schedule automatic cleanup
     */
    startAutomaticCleanup(db: any, intervalHours: number = 24): NodeJS.Timeout {
        const interval = intervalHours * 3600000;
        
        return setInterval(async () => {
            console.log('Starting automatic database cleanup...');
            
            const sizeCheck = await this.checkSize(db.name);
            
            if (sizeCheck.needsCleanup) {
                const result = await this.cleanup(db);
                console.log('Cleanup complete:', result);
            } else {
                console.log(`Database at ${sizeCheck.percentage.toFixed(2)}% capacity - no cleanup needed`);
            }
        }, interval);
    }
}
