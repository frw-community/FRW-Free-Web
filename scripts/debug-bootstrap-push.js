
const { KeyManagerV2 } = require('../packages/crypto-pq/dist/index.js');
const { generatePOWV2 } = require('../packages/pow-v2/dist/index.js');
const { RecordManagerV2, toJSON } = require('../packages/protocol-v2/dist/index.js');
const fetch = require('node-fetch');

// IPs to test (Updated nodes)
const NODES = [
  'http://83.228.214.189:3100'
];

async function debugPush() {
  console.log('🔍 Debugging Bootstrap V2 Push...');
  
  const keyManager = new KeyManagerV2();
  const keyPair = await keyManager.generateKeyPair();
  const name = 'debug-' + Date.now();
  
  console.log(`Generating record for ${name}...`);
  const proof = await generatePOWV2(name, keyPair.publicKey_dilithium3);
  const recordManager = new RecordManagerV2();
  
  // MANUAL TIMESTAMP ADJUSTMENT (Backdate 10 minutes to fix local clock skew)
  const record = recordManager.createRecord(name, '', '', keyPair, proof);
  record.registered = Date.now() - 600000; // -10 mins
  
  // Dynamic imports
  const { SignatureManagerV2 } = await import('../packages/crypto-pq/dist/index.js');
  const { serializeCanonical } = await import('../packages/protocol-v2/dist/serialization.js');
  
  const sigManager = new SignatureManagerV2();
  
  // 1. Serialize (this uses the record's current properties, including the modified timestamp)
  const canonical = serializeCanonical(record);
  
  // 2. Re-sign using the full keypair and timestamp
  const signature = await sigManager.sign(canonical, keyPair, record.registered);
  
  // 3. Apply new signatures
  record.signature_ed25519 = signature.signature_ed25519;
  record.signature_dilithium3 = signature.signature_dilithium3;
  
  const jsonBody = toJSON(record);
  console.log('Payload size:', jsonBody.length);
  console.log('Timestamp adjusted to:', new Date(record.registered).toISOString());

  for (const url of NODES) {
    console.log(`\n👉 Attempting push to: ${url}/api/submit/v2`);
    try {
      const start = Date.now();
      const res = await fetch(`${url}/api/submit/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonBody,
        timeout: 10000
      });
      const latency = Date.now() - start;
      
      console.log(`   Status: ${res.status} ${res.statusText}`);
      console.log(`   Latency: ${latency}ms`);
      
      const text = await res.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
      
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
      if (err.code) console.log(`   Code: ${err.code}`);
    }
  }
}

debugPush();
