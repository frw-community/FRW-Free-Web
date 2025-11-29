// Test actual publish flow
const { toJSON, fromJSON, createRecordV2 } = require('./packages/protocol-v2/dist/index.js');
const { KeyManagerV2 } = require('./packages/crypto-pq/dist/index.js');
const { verifyRecordV2 } = require('./packages/protocol-v2/dist/verification.js');
const fs = require('fs');
const path = require('path');

async function testActualPublish() {
  console.log('Testing ACTUAL publish flow for testv2site...\n');
  
  // 1. Load the V2 key
  const keyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.frw', 'keys', 'default-v2.json');
  const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const keyManager = new KeyManagerV2();
  const keyPair = keyManager.importKeyPair(keyData);
  
  console.log('✓ Key loaded:', keyPair.did);
  
  // 2. Load the registration from config
  const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.frw', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const registration = config.v2Registrations['testv2site'];
  
  if (!registration || !registration.pow) {
    console.error('✗ No registration found for testv2site');
    process.exit(1);
  }
  
  console.log('✓ Registration loaded');
  console.log('  PoW:');
  console.log('    Nonce:', registration.pow.nonce);
  console.log('    Difficulty:', registration.pow.leading_zeros);
  console.log('    Memory:', registration.pow.memory_mib, 'MiB');
  console.log('    Iterations:', registration.pow.iterations);
  console.log('    Timestamp:', registration.pow.timestamp, '(' + new Date(registration.pow.timestamp).toISOString() + ')');
  console.log('    Hash:', registration.pow.hash);
  console.log('');
  
  // 3. Convert PoW to the exact format used in publish.ts
  const pow = registration.pow;
  const proofV2 = {
    version: 2,
    nonce: BigInt(pow.nonce),
    timestamp: pow.timestamp,
    hash: Buffer.from(pow.hash, 'hex'),
    difficulty: pow.leading_zeros,
    memory_cost_mib: pow.memory_mib,
    time_cost: pow.iterations,
    parallelism: 4
  };
  
  // 4. Create V2 record (exactly as in publish.ts)
  const rootCID = 'QmTest123';  // Fake CID
  const ipnsName = '/ipns/test';
  
  console.log('Creating V2 record...');
  const recordV2 = createRecordV2(
    'testv2site',
    rootCID,
    ipnsName,
    keyPair,
    proofV2
  );
  
  console.log('✓ Record created');
  console.log('  Name:', recordV2.name);
  console.log('  Version:', recordV2.version);
  console.log('  DID:', recordV2.did);
  console.log('  ContentCID:', recordV2.contentCID);
  console.log('');
  
  // 5. Serialize to JSON (exactly as in publish.ts)
  console.log('Serializing with toJSON...');
  const recordJSON = toJSON(recordV2);
  console.log('✓ Serialized (length:', recordJSON.length, 'bytes)');
  console.log('');
  
  // 6. Deserialize from JSON (exactly as bootstrap node does)
  console.log('Deserializing with fromJSON (as bootstrap node does)...');
  const deserialized = fromJSON(recordJSON);
  console.log('✓ Deserialized');
  console.log('');
  
  // 7. Verify the record (exactly as bootstrap node does)
  console.log('Verifying record (as bootstrap node does)...');
  console.log('─────────────────────────────────────────────');
  const verification = await verifyRecordV2(deserialized);
  console.log('─────────────────────────────────────────────');
  console.log('');
  
  console.log('VERIFICATION RESULT:');
  console.log('  Valid:', verification.valid);
  console.log('  PQ Secure:', verification.pqSecure);
  console.log('  Errors:', verification.errors);
  console.log('  Checks:');
  for (const [check, passed] of Object.entries(verification.checks)) {
    console.log(`    ${passed ? '✓' : '✗'} ${check}`);
  }
  console.log('');
  
  if (!verification.valid) {
    console.error('✗✗✗ VALIDATION FAILED! ✗✗✗');
    console.error('This is exactly what the VPS nodes are seeing!');
    console.error('');
    console.error('Failed checks:');
    for (const [check, passed] of Object.entries(verification.checks)) {
      if (!passed) {
        console.error(`  ✗ ${check}`);
      }
    }
    process.exit(1);
  } else {
    console.log('✓✓✓ SUCCESS! ✓✓✓');
    console.log('The record validates correctly!');
    console.log('If VPS is still rejecting, they need to pull latest code.');
  }

  // 8. Attempt submission to VPS nodes
  console.log('\n--- Testing Submission to VPS Nodes ---\n');
  const nodes = [
    'http://83.228.213.240:3100',
    'http://83.228.213.45:3100',
    'http://83.228.214.189:3100'
  ];

  for (const node of nodes) {
    console.log(`Submitting to ${node}...`);
    try {
      const response = await fetch(`${node}/api/submit/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: recordJSON
      });

      if (response.ok) {
        console.log(`✓ SUCCESS: ${node} accepted the record!`);
        const result = await response.json();
        console.log('  Response:', result);
      } else {
        console.log(`✗ FAILED: ${node} rejected the record (Status: ${response.status})`);
        const text = await response.text();
        console.log('  Reason:', text);
      }
    } catch (err) {
      console.log(`✗ ERROR: Could not connect to ${node}`);
      console.log('  Error:', err.message);
    }
    console.log('');
  }
}

testActualPublish().catch(err => {
  console.error('Fatal error:', err);
  console.error(err.stack);
  process.exit(1);
});
