// Diagnose the exact record being sent
const { toJSON, fromJSON, createRecordV2 } = require('./packages/protocol-v2/dist/index.js');
const { KeyManagerV2 } = require('./packages/crypto-pq/dist/index.js');
const fs = require('fs');
const path = require('path');

async function diagnose() {
  console.log('=== DIAGNOSING V2 RECORD ===\n');
  
  // Load key
  const keyPath = path.join(process.env.USERPROFILE, '.frw', 'keys', 'default-v2.json');
  const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const keyManager = new KeyManagerV2();
  const keyPair = keyManager.importKeyPair(keyData);
  
  // Load registration
  const configPath = path.join(process.env.USERPROFILE, '.frw', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const registration = config.v2Registrations['quantumdemo'];
  
  if (!registration || !registration.pow) {
    console.error('No registration found!');
    process.exit(1);
  }
  
  // Convert PoW
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
  
  console.log('PoW Details:');
  console.log('  Timestamp:', pow.timestamp, '(' + new Date(pow.timestamp).toISOString() + ')');
  console.log('  Age:', Math.floor((Date.now() - pow.timestamp) / 1000), 'seconds');
  console.log('  Age in hours:', Math.floor((Date.now() - pow.timestamp) / 3600000), 'hours');
  console.log('  Nonce:', pow.nonce);
  console.log('  Difficulty:', pow.leading_zeros);
  console.log('  Memory:', pow.memory_mib, 'MiB');
  console.log('  Iterations:', pow.iterations);
  console.log('  Hash:', pow.hash.substring(0, 32) + '...');
  console.log('');
  
  // Create record
  const record = createRecordV2(
    'quantumdemo',
    'QmTest123',
    '/ipns/test',
    keyPair,
    proofV2
  );
  
  console.log('Record Details:');
  console.log('  Name:', record.name);
  console.log('  Registered:', record.registered, '(' + new Date(record.registered).toISOString() + ')');
  console.log('  Expires:', record.expires, '(' + new Date(record.expires).toISOString() + ')');
  console.log('  Version:', record.version);
  console.log('  DID:', record.did);
  console.log('');
  
  // Serialize
  const jsonString = toJSON(record);
  const jsonObj = JSON.parse(jsonString);
  
  console.log('JSON PoW:');
  console.log('  nonce type:', typeof jsonObj.proof_v2.nonce);
  console.log('  nonce value:', jsonObj.proof_v2.nonce);
  console.log('  timestamp:', jsonObj.proof_v2.timestamp);
  console.log('  hash type:', typeof jsonObj.proof_v2.hash);
  console.log('  hash length:', jsonObj.proof_v2.hash.length);
  console.log('');
  
  // Check what VPS will receive
  const deserialized = fromJSON(jsonString);
  console.log('Deserialized PoW:');
  console.log('  nonce type:', typeof deserialized.proof_v2.nonce);
  console.log('  nonce value:', deserialized.proof_v2.nonce.toString());
  console.log('  timestamp:', deserialized.proof_v2.timestamp);
  console.log('  hash type:', deserialized.proof_v2.hash.constructor.name);
  console.log('  hash length:', deserialized.proof_v2.hash.length);
  console.log('  hash[0]:', deserialized.proof_v2.hash[0]);
  console.log('');
  
  // Manually verify PoW like VPS does
  const { verifyPOWV2 } = require('./packages/pow-v2/dist/index.js');
  console.log('=== RUNNING PoW VERIFICATION ===');
  const powValid = await verifyPOWV2(
    deserialized.name,
    deserialized.publicKey_dilithium3,
    deserialized.proof_v2
  );
  console.log('PoW Valid:', powValid);
  console.log('');
  
  if (!powValid) {
    console.error('❌ PoW VERIFICATION FAILED');
    console.error('This is the exact issue the VPS sees!');
    process.exit(1);
  }
  
  console.log('✅ PoW verification PASSED locally');
  console.log('The issue must be in VPS environment or Node.js modules');
}

diagnose().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
