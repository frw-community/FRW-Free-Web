// Fast unit tests for difficulty calculation

import { describe, it, expect } from '@jest/globals';
import { getRequiredDifficulty, estimateTime, validateDifficulty, compareDifficulty } from '../difficulty-v2';

describe('Difficulty V2', () => {
  describe('getRequiredDifficulty', () => {
    it('should return correct difficulty for 8-char name', () => {
      const params = getRequiredDifficulty('testname');
      
      expect(params.leading_zeros).toBe(7);
      expect(params.memory_mib).toBe(128);
      expect(params.iterations).toBe(3);
    });

    it('should return higher difficulty for shorter names', () => {
      const params3 = getRequiredDifficulty('abc');
      const params8 = getRequiredDifficulty('testname');
      
      expect(params3.leading_zeros).toBeGreaterThan(params8.leading_zeros);
      expect(params3.memory_mib).toBeGreaterThan(params8.memory_mib);
    });

    it('should return no difficulty for long names', () => {
      const params = getRequiredDifficulty('verylongnamehere');
      
      expect(params.leading_zeros).toBe(0);
    });

    it('should scale difficulty with name length', () => {
      const difficulties = [
        { name: 'abcdefgh', zeros: 7 },        // 8 chars
        { name: 'abcdefg', zeros: 8 },         // 7 chars
        { name: 'abcdef', zeros: 9 },          // 6 chars
        { name: 'abcde', zeros: 10 },          // 5 chars
      ];

      difficulties.forEach(({ name, zeros }) => {
        const params = getRequiredDifficulty(name);
        expect(params.leading_zeros).toBe(zeros);
      });
    });
  });

  describe('estimateTime', () => {
    it('should estimate time for 8-char name', () => {
      const params = getRequiredDifficulty('testname');
      const estimate = estimateTime(params);
      
      // Just check it returns a valid estimate
      expect(estimate.seconds).toBeGreaterThan(0);
      expect(estimate.description).toBeTruthy();
    });

    it('should format time descriptions correctly', () => {
      const shortParams = { leading_zeros: 0, memory_mib: 16, iterations: 2 };
      const mediumParams = { leading_zeros: 5, memory_mib: 32, iterations: 2 };
      
      const shortEstimate = estimateTime(shortParams);
      const mediumEstimate = estimateTime(mediumParams);
      
      // Just check descriptions are generated
      expect(shortEstimate.description).toBeTruthy();
      expect(mediumEstimate.description).toBeTruthy();
    });
  });

  describe('validateDifficulty', () => {
    it('should validate correct difficulty params', () => {
      const params = {
        leading_zeros: 7,
        memory_mib: 128,
        iterations: 3
      };
      
      expect(validateDifficulty(params)).toBe(true);
    });

    it('should reject invalid difficulty params', () => {
      expect(validateDifficulty({
        leading_zeros: 25, // too high
        memory_mib: 128,
        iterations: 3
      })).toBe(false);

      expect(validateDifficulty({
        leading_zeros: 7,
        memory_mib: 10000, // too high
        iterations: 3
      })).toBe(false);
    });
  });

  describe('compareDifficulty', () => {
    it('should compare difficulties correctly', () => {
      const easy = { leading_zeros: 5, memory_mib: 64, iterations: 2 };
      const hard = { leading_zeros: 10, memory_mib: 1024, iterations: 5 };
      
      expect(compareDifficulty(easy, hard)).toBeLessThan(0);
      expect(compareDifficulty(hard, easy)).toBeGreaterThan(0);
      expect(compareDifficulty(easy, easy)).toBe(0);
    });
  });
});
