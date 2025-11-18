// Test V2 record serialization
const { toJSON, fromJSON } = require('./packages/protocol-v2/dist/serialization.js');
const { createRecordV2 } = require('./packages/protocol-v2/dist/record.js');
const { KeyManagerV2 } = require('./packages/crypto-pq/dist/index.js');
const fs = require('fs');
const path = require('path');

async function testV2Record() {
  console.log('Testing V2 record serialization...\n');
  
  // Load the key
  const keyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.frw', 'keys', 'default-v2.json');
  console.log('Loading key from:', keyPath);
  
  const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const keyManager = new KeyManagerV2();
  const keyPair = keyManager.importKeyPair(keyData);
  
  console.log('✓ Key loaded:', keyPair.did, '\n');
  
  // Load registration (for PoW)
  const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.frw', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const registration = config.v2Registrations['codequantum1234'];
  
  if (!registration || !registration.pow) {
    console.error('✗ No registration found for codequantum1234');
    process.exit(1);
  }
  
  console.log('✓ Registration found');
  console.log('  PoW nonce:', registration.pow.nonce);
  console.log('  PoW difficulty:', registration.pow.leading_zeros);
  console.log('');
  
  // Convert PoW format
  const proofV2 = {
    version: 2,
    nonce: BigInt(registration.pow.nonce),
    timestamp: registration.pow.timestamp,
    hash: Buffer.from(registration.pow.hash, 'hex'),
    difficulty: registration.pow.leading_zeros,
    memory_cost_mib: registration.pow.memory_mib,
    time_cost: registration.pow.iterations,
    parallelism: 4
  };
  
  // Create record
  const record = createRecordV2(
    'codequantum1234',
    'QmTest123',
    '/ipns/test',
    keyPair,
    proofV2
  );
  
  console.log('✓ Record created');
  console.log('  Version:', record.version);
  console.log('  Name:', record.name);
  console.log('  DID:', record.did);
  console.log('');
  
  // Serialize to JSON
  const jsonString = toJSON(record);
  console.log('✓ Serialized to JSON (length:', jsonString.length, 'bytes)');
  
  // Parse back
  const jsonObj = JSON.parse(jsonString);
  console.log('✓ JSON parsed');
  console.log('  publicKey_ed25519 format:', typeof jsonObj.publicKey_ed25519, '(should be string/base64)');
  console.log('  hash_sha256 format:', typeof jsonObj.hash_sha256, '(should be string/hex)');
  console.log('  proof_v2.hash format:', typeof jsonObj.proof_v2.hash, '(should be string/hex)');
  console.log('  proof_v2.nonce format:', typeof jsonObj.proof_v2.nonce, '(should be string)');
  console.log('');
  
  // Deserialize from JSON
  try {
    const deserialized = fromJSON(jsonString);
    console.log('✓ Deserialized from JSON');
    console.log('  publicKey_ed25519 format:', deserialized.publicKey_ed25519.constructor.name, '(should be Uint8Array)');
    console.log('  hash_sha256 format:', deserialized.hash_sha256.constructor.name, '(should be Uint8Array)');
    console.log('  proof_v2.hash format:', deserialized.proof_v2.hash.constructor.name, '(should be Uint8Array)');
    console.log('  proof_v2.nonce format:', typeof deserialized.proof_v2.nonce, '(should be bigint)');
    console.log('');
    
    // Verify the record
    const { verifyRecordV2 } = require('./packages/protocol-v2/dist/verification.js');
    console.log('Verifying record...');
    const verification = await verifyRecordV2(deserialized);
    
    console.log('\nVerification result:');
    console.log('  Valid:', verification.valid);
    console.log('  PQ Secure:', verification.pqSecure);
    console.log('  Errors:', verification.errors);
    console.log('  Checks:', JSON.stringify(verification.checks, null, 2));
    
    if (!verification.valid) {
      console.error('\n✗ VALIDATION FAILED!');
      console.error('This is the issue the VPS nodes are seeing!');
      process.exit(1);
    } else {
      console.log('\n✓ SUCCESS! Record is valid!');
    }
    
  } catch (error) {
    console.error('\n✗ Deserialization failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testV2Record().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
