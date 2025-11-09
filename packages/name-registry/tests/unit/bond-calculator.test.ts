// Unit tests for Bond Calculator
import { describe, it, expect, beforeEach } from '@jest/globals';
import { BondCalculator, generateBondTable } from '../../src/bonds/calculator';

describe('BondCalculator', () => {
    let calculator: BondCalculator;

    beforeEach(() => {
        calculator = new BondCalculator();
    });

    describe('calculateBaseBond', () => {
        it('should return correct base bond for 3-letter names', () => {
            const bond = calculator.calculateBaseBond('abc');
            expect(bond).toBe(10_000_000n);
        });

        it('should return correct base bond for 4-letter names', () => {
            const bond = calculator.calculateBaseBond('abcd');
            expect(bond).toBe(5_000_000n);
        });

        it('should return correct base bond for 5-letter names', () => {
            const bond = calculator.calculateBaseBond('abcde');
            expect(bond).toBe(1_000_000n);
        });

        it('should return correct base bond for 6+ letter names', () => {
            expect(calculator.calculateBaseBond('abcdef')).toBe(100_000n);
            expect(calculator.calculateBaseBond('verylongname')).toBe(100_000n);
        });
    });

    describe('calculateProgressiveBond', () => {
        it('should return base bond for first registration', () => {
            const bond = calculator.calculateProgressiveBond('test', 0);
            const baseBond = calculator.calculateBaseBond('test');
            expect(bond).toBe(baseBond);
        });

        it('should increase bond for subsequent registrations', () => {
            const bond0 = calculator.calculateProgressiveBond('test', 0);
            const bond1 = calculator.calculateProgressiveBond('test', 1);
            const bond10 = calculator.calculateProgressiveBond('test', 10);
            
            expect(bond1).toBeGreaterThan(bond0);
            expect(bond10).toBeGreaterThan(bond1);
        });

        it('should apply exponential increase (1.1^n)', () => {
            const base = calculator.calculateBaseBond('test');
            const bond10 = calculator.calculateProgressiveBond('test', 10);
            
            // After 10 registrations: base * (1.1 ^ 10) ≈ base * 2.59
            const expectedMultiplier = Math.pow(1.1, 10);
            const expected = BigInt(Math.floor(Number(base) * expectedMultiplier));
            
            expect(bond10).toBe(expected);
        });

        it('should handle large registration counts without overflow', () => {
            // 100 registrations should work (bond becomes very large)
            const bond100 = calculator.calculateProgressiveBond('test', 100);
            expect(bond100).toBeGreaterThan(0n);
            expect(typeof bond100).toBe('bigint');
        });

        it('should make mass registration prohibitively expensive', () => {
            const bond100 = calculator.calculateProgressiveBond('abc', 100);
            // After 100 names: 10M * (1.1^100) ≈ 137,806M
            expect(Number(bond100)).toBeGreaterThan(100_000_000_000);
        });
    });

    describe('calculateBulkBond', () => {
        it('should calculate total bond for multiple names', () => {
            const names = ['name1', 'name2', 'name3'];
            const totalBond = calculator.calculateBulkBond(names, 0);
            
            const individualBonds = names.map((name, i) => 
                calculator.calculateProgressiveBond(name, i)
            );
            const expected = individualBonds.reduce((sum, bond) => sum + bond, 0n);
            
            expect(totalBond).toBe(expected);
        });

        it('should account for existing names in bulk calculation', () => {
            const names = ['new1', 'new2'];
            const bondWithout = calculator.calculateBulkBond(names, 0);
            const bondWith10 = calculator.calculateBulkBond(names, 10);
            
            expect(bondWith10).toBeGreaterThan(bondWithout);
        });

        it('should handle empty array', () => {
            const bond = calculator.calculateBulkBond([], 0);
            expect(bond).toBe(0n);
        });
    });

    describe('canReturnBond', () => {
        it('should not allow return within lock period', () => {
            const registration = {
                timestamp: Date.now() - 1000, // 1 second ago
                ipnsUpdates: 100,
                contentSize: 50_000_000,
                challengesLost: 0
            };
            
            const result = calculator.canReturnBond(registration);
            expect(result.canReturn).toBe(false);
            expect(result.reason).toContain('Lock period');
            expect(result.percentage).toBe(0);
        });

        it('should not allow return if challenge was lost', () => {
            const registration = {
                timestamp: Date.now() - (91 * 86400000), // 91 days ago
                ipnsUpdates: 100,
                contentSize: 50_000_000,
                challengesLost: 1
            };
            
            const result = calculator.canReturnBond(registration);
            expect(result.canReturn).toBe(false);
            expect(result.reason).toContain('Lost challenge');
        });

        it('should calculate 100% return for active content with updates', () => {
            const registration = {
                timestamp: Date.now() - (91 * 86400000), // 91 days ago
                ipnsUpdates: 25,
                contentSize: 15_000_000,
                challengesLost: 0
            };
            
            const result = calculator.canReturnBond(registration);
            expect(result.canReturn).toBe(true);
            expect(result.percentage).toBe(100);
        });

        it('should calculate 50% return for content only', () => {
            const registration = {
                timestamp: Date.now() - (91 * 86400000),
                ipnsUpdates: 5,
                contentSize: 15_000_000,
                challengesLost: 0
            };
            
            const result = calculator.canReturnBond(registration);
            expect(result.canReturn).toBe(true);
            expect(result.percentage).toBe(50);
        });

        it('should calculate 50% return for updates only', () => {
            const registration = {
                timestamp: Date.now() - (91 * 86400000),
                ipnsUpdates: 25,
                contentSize: 500_000,
                challengesLost: 0
            };
            
            const result = calculator.canReturnBond(registration);
            expect(result.canReturn).toBe(true);
            expect(result.percentage).toBe(50);
        });

        it('should return 0% for insufficient usage', () => {
            const registration = {
                timestamp: Date.now() - (91 * 86400000),
                ipnsUpdates: 2,
                contentSize: 100_000,
                challengesLost: 0
            };
            
            const result = calculator.canReturnBond(registration);
            expect(result.canReturn).toBe(false);
            expect(result.percentage).toBe(0);
            expect(result.reason).toContain('Insufficient usage');
        });
    });

    describe('calculateBondReturn', () => {
        it('should calculate 100% return correctly', () => {
            const bond = 10_000_000n;
            const returned = calculator.calculateBondReturn(bond, 100);
            expect(returned).toBe(10_000_000n);
        });

        it('should calculate 50% return correctly', () => {
            const bond = 10_000_000n;
            const returned = calculator.calculateBondReturn(bond, 50);
            expect(returned).toBe(5_000_000n);
        });

        it('should calculate 0% return correctly', () => {
            const bond = 10_000_000n;
            const returned = calculator.calculateBondReturn(bond, 0);
            expect(returned).toBe(0n);
        });

        it('should handle partial percentages', () => {
            const bond = 10_000_000n;
            const returned = calculator.calculateBondReturn(bond, 75);
            expect(returned).toBe(7_500_000n);
        });
    });
});

describe('generateBondTable', () => {
    it('should generate bond table for all combinations', () => {
        const table = generateBondTable();
        
        // 4 name lengths * 6 existing counts = 24 entries
        expect(table.length).toBe(24);
    });

    it('should include all name lengths', () => {
        const table = generateBondTable();
        const lengths = [...new Set(table.map(row => row.nameLength))];
        expect(lengths).toEqual([3, 4, 5, 6]);
    });

    it('should include all existing name counts', () => {
        const table = generateBondTable();
        const counts = [...new Set(table.map(row => row.existingNames))];
        expect(counts).toEqual([0, 10, 50, 100, 500, 1000]);
    });

    it('should show increasing bonds for same length', () => {
        const table = generateBondTable();
        const threeLetterBonds = table
            .filter(row => row.nameLength === 3)
            .map(row => BigInt(row.bondRequired));
        
        // Each subsequent entry should be larger
        for (let i = 1; i < threeLetterBonds.length; i++) {
            expect(threeLetterBonds[i]).toBeGreaterThan(threeLetterBonds[i-1]);
        }
    });
});
