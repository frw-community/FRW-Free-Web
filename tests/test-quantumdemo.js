// Test quantumdemo validation
const { toJSON, fromJSON, createRecordV2 } = require('./packages/protocol-v2/dist/index.js');
const { KeyManagerV2 } = require('./packages/crypto-pq/dist/index.js');
const { verifyRecordV2 } = require('./packages/protocol-v2/dist/verification.js');
const fs = require('fs');
const path = require('path');

async function testQuantumdemo() {
  console.log('Testing quantumdemo validation...\n');
  
  const keyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.frw', 'keys', 'default-v2.json');
  const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const keyManager = new KeyManagerV2();
  const keyPair = keyManager.importKeyPair(keyData);
  
  const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.frw', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const registration = config.v2Registrations['quantumdemo'];
  
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
  
  const recordV2 = createRecordV2('quantumdemo', 'QmTest123', '/ipns/test', keyPair, proofV2);
  const recordJSON = toJSON(recordV2);
  const deserialized = fromJSON(recordJSON);
  
  console.log('Verifying...');
  const verification = await verifyRecordV2(deserialized);
  
  console.log('\nResult:', verification.valid ? '✓ VALID' : '✗ INVALID');
  console.log('PQ Secure:', verification.pqSecure);
  console.log('Errors:', verification.errors);
  
  if (!verification.valid) {
    console.error('\n✗ FAILED!');
    process.exit(1);
  }
  console.log('\n✓ SUCCESS! Ready to publish to VPS!');
}

testQuantumdemo().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
