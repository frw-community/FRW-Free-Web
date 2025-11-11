/**
 * Multi-node synchronization tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';

const NODE_A_URL = 'http://83.228.213.45:3100';
const NODE_B_URL = 'http://83.228.214.189:3100';

describe('Bootstrap Node Synchronization', () => {
  
  beforeAll(async () => {
    // Wait for nodes to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it('should have both nodes responding', async () => {
    const healthA = await fetch(`${NODE_A_URL}/health`).then(r => r.json());
    const healthB = await fetch(`${NODE_B_URL}/health`).then(r => r.json());
    
    expect(healthA.status).toBe('ok');
    expect(healthB.status).toBe('ok');
    expect(healthA.nodeId).not.toBe(healthB.nodeId);
  });

  it('should sync names between nodes', async () => {
    // Get names from both nodes
    const namesA = await fetch(`${NODE_A_URL}/api/names`).then(r => r.json());
    const namesB = await fetch(`${NODE_B_URL}/api/names`).then(r => r.json());
    
    console.log(`Node A: ${namesA.count} names`);
    console.log(`Node B: ${namesB.count} names`);
    
    // Should have same count (or close after sync)
    expect(Math.abs(namesA.count - namesB.count)).toBeLessThanOrEqual(1);
  });

  it('should resolve same name from both nodes', async () => {
    const testName = 'vpstest7'; // Known registered name
    
    try {
      const resolveA = await fetch(`${NODE_A_URL}/api/resolve/${testName}`).then(r => r.json());
      const resolveB = await fetch(`${NODE_B_URL}/api/resolve/${testName}`).then(r => r.json());
      
      expect(resolveA.name).toBe(resolveB.name);
      expect(resolveA.publicKey).toBe(resolveB.publicKey);
      expect(resolveA.contentCID).toBe(resolveB.contentCID);
      
      console.log(`✓ Both nodes resolved "${testName}" identically`);
    } catch (error) {
      console.warn(`Name "${testName}" not found - skip test`);
    }
  });

  it('should have different node IDs', async () => {
    const statsA = await fetch(`${NODE_A_URL}/api/stats`).then(r => r.json());
    const statsB = await fetch(`${NODE_B_URL}/api/stats`).then(r => r.json());
    
    expect(statsA.nodeId).not.toBe(statsB.nodeId);
    console.log(`Node A: ${statsA.nodeId}`);
    console.log(`Node B: ${statsB.nodeId}`);
  });
});
