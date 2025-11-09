// Bond Calculation System
// Economic barrier to mass registration

export interface BondConfig {
    baseAmounts: {
        3: bigint;  // 3-letter names
        4: bigint;  // 4-letter names
        5: bigint;  // 5-letter names
        6: bigint;  // 6+ letter names
    };
    progressiveMultiplier: number;  // Exponential increase per registration
    lockPeriod: number;             // Minimum lock period (ms)
}

export class BondCalculator {
    private config: BondConfig;
    
    constructor(config?: Partial<BondConfig>) {
        this.config = {
            baseAmounts: {
                3: 10_000_000n,   // 10M units
                4: 5_000_000n,    // 5M units
                5: 1_000_000n,    // 1M units
                6: 100_000n       // 100k units
            },
            progressiveMultiplier: 1.1,
            lockPeriod: 90 * 86400000,  // 90 days
            ...config
        };
    }
    
    /**
     * Calculate required bond for a single name
     */
    calculateBaseBond(name: string): bigint {
        const length = Math.min(name.length, 6);
        
        if (length === 3) return this.config.baseAmounts[3];
        if (length === 4) return this.config.baseAmounts[4];
        if (length === 5) return this.config.baseAmounts[5];
        return this.config.baseAmounts[6];
    }
    
    /**
     * Calculate bond with progressive pricing
     * More names owned = exponentially higher cost
     */
    calculateProgressiveBond(
        name: string,
        existingNamesCount: number
    ): bigint {
        const baseBond = this.calculateBaseBond(name);
        
        // Progressive multiplier: base * (1.1 ^ existing_count)
        const multiplier = Math.pow(
            this.config.progressiveMultiplier,
            existingNamesCount
        );
        
        // Convert to bigint safely
        const bondAmount = BigInt(Math.floor(Number(baseBond) * multiplier));
        
        return bondAmount;
    }
    
    /**
     * Calculate total bond for multiple registrations
     */
    calculateBulkBond(
        names: string[],
        existingNamesCount: number
    ): bigint {
        let totalBond = 0n;
        
        for (let i = 0; i < names.length; i++) {
            const currentCount = existingNamesCount + i;
            const bond = this.calculateProgressiveBond(names[i], currentCount);
            totalBond += bond;
        }
        
        return totalBond;
    }
    
    /**
     * Check if bond can be returned based on usage
     */
    canReturnBond(
        registration: {
            timestamp: number;
            ipnsUpdates: number;
            contentSize: number;
            challengesLost: number;
        }
    ): {
        canReturn: boolean;
        reason?: string;
        percentage: number;
    } {
        const age = Date.now() - registration.timestamp;
        
        // Must be locked for minimum period
        if (age < this.config.lockPeriod) {
            return {
                canReturn: false,
                reason: 'Lock period not complete',
                percentage: 0
            };
        }
        
        // Lost challenge = forfeit bond
        if (registration.challengesLost > 0) {
            return {
                canReturn: false,
                reason: 'Lost challenge',
                percentage: 0
            };
        }
        
        // Calculate return percentage based on usage
        let percentage = 0;
        
        // Active content (10MB+): 50%
        if (registration.contentSize >= 10_000_000) {
            percentage += 50;
        } else if (registration.contentSize >= 1_000_000) {
            percentage += 25;
        }
        
        // Regular updates (20+): 50%
        if (registration.ipnsUpdates >= 20) {
            percentage += 50;
        } else if (registration.ipnsUpdates >= 10) {
            percentage += 25;
        }
        
        return {
            canReturn: percentage > 0,
            percentage,
            reason: percentage === 0 ? 'Insufficient usage' : undefined
        };
    }
    
    /**
     * Calculate bond return amount
     */
    calculateBondReturn(
        bondAmount: bigint,
        returnPercentage: number
    ): bigint {
        const percentage = BigInt(returnPercentage);
        return (bondAmount * percentage) / 100n;
    }
}

/**
 * Bond amounts reference table
 */
export function generateBondTable(): Array<{
    nameLength: number;
    existingNames: number;
    bondRequired: string;
}> {
    const calculator = new BondCalculator();
    const table: Array<{
        nameLength: number;
        existingNames: number;
        bondRequired: string;
    }> = [];
    
    for (const length of [3, 4, 5, 6]) {
        for (const count of [0, 10, 50, 100, 500, 1000]) {
            const name = 'x'.repeat(length);
            const bond = calculator.calculateProgressiveBond(name, count);
            
            table.push({
                nameLength: length,
                existingNames: count,
                bondRequired: bond.toString()
            });
        }
    }
    
    return table;
}
