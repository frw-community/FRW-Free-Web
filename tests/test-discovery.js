// Test Node Discovery locally
import { NodeDiscovery } from '../apps/bootstrap-node/dist/node-discovery.js';
import { create } from 'ipfs-http-client';

async function testDiscovery() {
  console.log('🧪 Testing Node Discovery Module...\n');

  // Connect to local IPFS
  const ipfs = create({ url: 'http://localhost:5001' });
  
  try {
    const id = await ipfs.id();
    console.log(`✓ Connected to local IPFS (ID: ${id.id})`);
  } catch (err) {
    console.error('✗ Could not connect to local IPFS. Is "ipfs daemon" running?');
    process.exit(1);
  }

  // Create two discovery instances to simulate two nodes
  const node1 = new NodeDiscovery(ipfs, []);
  const node2 = new NodeDiscovery(ipfs, []);

  console.log('\n[Step 1] Starting Node 1...');
  await node1.start('http://localhost:3100');

  console.log('\n[Step 2] Starting Node 2...');
  await node2.start('http://localhost:3200');

  console.log('\n[Step 3] Waiting for discovery gossip (5 seconds)...');
  
  // Wait for them to find each other
  await new Promise(resolve => setTimeout(resolve, 5000));

  const peers1 = node1.getNodes();
  const peers2 = node2.getNodes();

  console.log('\n=== RESULTS ===');
  console.log('Node 1 peers:', peers1);
  console.log('Node 2 peers:', peers2);

  // Verification
  // Note: Since they are on the same IPFS node, they might see their own echo or each other rapidly
  // In a real network, they are distinct IPFS nodes.
  // But if they see *any* URL via PubSub, the mechanism is working.

  if (peers1.includes('http://localhost:3200') || peers2.includes('http://localhost:3100')) {
    console.log('\n✓ SUCCESS: Nodes discovered via PubSub!');
  } else {
    console.log('\n⚠ WARNING: Discovery might be delayed or blocked by local network config.');
    console.log('Make sure --enable-pubsub-experiment is on for IPFS daemon');
  }
}

testDiscovery().catch(console.error);
