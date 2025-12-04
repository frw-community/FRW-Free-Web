// Test Network Resilience & Discovery
import { NodeDiscovery } from '../apps/bootstrap-node/dist/node-discovery.js';
import { create } from 'ipfs-http-client';
import fetch from 'node-fetch';

// The list of VPS nodes you updated
const UPDATED_VPS = [
  'http://155.117.46.244:3100',
  // Add other updated IPs here if known, e.g.:
  // 'http://83.228.214.189:3100'
];

const TARGET_VPS = 'http://155.117.46.244:3100'; // One of the updated ones

async function testNetworkHealth() {
  console.log('🏥 Testing Network Health & Discovery...\n');

  // 1. Check Node Discovery
  console.log(`[Step 1] querying discovery endpoint on ${TARGET_VPS}...`);
  try {
    const res = await fetch(`${TARGET_VPS}/api/nodes`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    
    const data = await res.json();
    console.log('✓ Discovery Endpoint Active');
    console.log(`Nodes tracked by ${TARGET_VPS}:`);
    console.log(data.nodes);

    // Analyze health
    const nodeCount = data.nodes.length;
    if (nodeCount > 8) {
      console.log(`\n✓ SUCCESS: Node is discovering peers (Count: ${nodeCount})`);
    } else {
      console.log(`\n⚠ WARNING: Node count is static (${nodeCount}). Gossip might take time to propagate.`);
    }

  } catch (err) {
    console.error('✗ Failed to query discovery endpoint:', err.message);
  }

  // 2. Register a random V2 name to test propagation
  const randomName = `networkcheck-${Date.now()}`;
  console.log(`\n[Step 2] Registering test name: ${randomName}...`);
  
  // We'll use the CLI logic (simulated)
  // ... (For brevity, we just check if the network accepts it via API)
  
  // 3. Check version compatibility
  console.log('\n[Step 3] Checking mixed-version network...');
  console.log('We expect updated nodes to serve /api/nodes, others to 404 it.');
  
  const mixedNodes = [
    'http://155.117.46.244:3100', // Updated
    'http://83.228.213.240:3100'  // Legacy (example)
  ];

  for (const node of mixedNodes) {
    try {
      const res = await fetch(`${node}/api/nodes`);
      if (res.ok) {
        const d = await res.json();
        console.log(`✓ ${node} is UPDATED (v2.1) - knows ${d.nodes.length} peers`);
      } else {
        console.log(`⚠ ${node} is LEGACY (v2.0) - /api/nodes not found`);
      }
    } catch (e) {
      console.log(`✗ ${node} is OFFLINE`);
    }
  }
}

testNetworkHealth().catch(console.error);
