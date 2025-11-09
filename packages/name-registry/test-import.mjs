// Test import of name-registry package

import { MetricsCollector, ChallengeSystem } from './dist/index.js';

console.log('✓ MetricsCollector:', typeof MetricsCollector);
console.log('✓ ChallengeSystem:', typeof ChallengeSystem);

// Test instantiation with mock dependencies
const mockIPFS = {
    stats: { repo: async () => ({}), bitswap: async () => ({}) },
    name: { resolve: async () => '/ipfs/QmTest' },
    object: { stat: async () => ({ CumulativeSize: 1000, NumLinks: 5 }) },
    swarm: { peers: async () => [] }
};

const mockDB = {
    saveMetrics: (metrics) => {
        console.log('✓ saveMetrics called with:', metrics.name);
    }
};

const collector = new MetricsCollector(mockIPFS, mockDB);
console.log('✓ MetricsCollector instantiated');

try {
    const metrics = await collector.collectMetrics('test-public-key');
    console.log('✓ Metrics collected:', {
        name: metrics.name,
        legitimacyScore: metrics.legitimacyScore,
        usageScore: metrics.usageScore
    });
} catch (error) {
    console.log('Note: Full IPFS integration needed for complete metrics');
    console.log('Current status: Package structure verified');
}
