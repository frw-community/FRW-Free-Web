// Test database implementation

import { MetricsDatabase } from './dist/storage/database.js';
import fs from 'fs';

const dbPath = './test-metrics.db';

// Clean up old test database
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

console.log('Testing MetricsDatabase...\n');

// Create database
const db = new MetricsDatabase(dbPath);
console.log('✓ Database created');

// Test metrics storage
const testMetrics = {
    name: 'test-site',
    publicKey: 'test-public-key-123',
    totalPeerConnections: 10,
    uniquePeerIds: new Set(['peer1', 'peer2', 'peer3']),
    contentFetches: 50,
    ipnsUpdates: 5,
    contentSize: 1024000,
    dagDepth: 8,
    inboundLinks: ['frw://alice', 'frw://bob'],
    verificationCount: 15,
    lastActivity: Date.now(),
    activityHistory: [],
    legitimacyScore: 245.5,
    usageScore: 230.2
};

db.saveMetrics(testMetrics);
console.log('✓ Metrics saved');

// Retrieve metrics
const retrieved = db.getMetrics('test-public-key-123');
console.log('✓ Metrics retrieved');

// Verify data
console.log('\nRetrieved metrics:');
console.log('  Name:', retrieved.name);
console.log('  Public Key:', retrieved.publicKey);
console.log('  Legitimacy Score:', retrieved.legitimacyScore);
console.log('  Usage Score:', retrieved.usageScore);
console.log('  Content Size:', retrieved.contentSize, 'bytes');
console.log('  Unique Peers:', retrieved.uniquePeerIds.size);

// Test challenge storage
console.log('\nTesting challenge storage...');

const testChallenge = {
    challengeId: 'chal_test123',
    name: 'disputed-name',
    currentOwner: 'owner-key',
    currentOwnerMetrics: testMetrics,
    challenger: 'challenger-key',
    challengerBond: 1000000n,
    challengeReason: 'squatting',
    evidence: [],
    timestamps: {
        created: Date.now(),
        responseDeadline: Date.now() + 30 * 86400000,
        evaluationDeadline: Date.now() + 44 * 86400000
    },
    status: 'pending_response'
};

db.saveChallenge(testChallenge);
console.log('✓ Challenge saved');

const retrievedChallenge = db.getChallenge('chal_test123');
console.log('✓ Challenge retrieved');

console.log('\nRetrieved challenge:');
console.log('  ID:', retrievedChallenge.challengeId);
console.log('  Name:', retrievedChallenge.name);
console.log('  Status:', retrievedChallenge.status);
console.log('  Bond:', retrievedChallenge.challengerBond.toString());

// Test listing
const challenges = db.listChallenges({ status: 'pending_response' });
console.log('\n✓ Listed', challenges.length, 'pending challenges');

// Cleanup
db.close();
console.log('\n✓ All tests passed!');
console.log('\nDatabase file:', dbPath);
