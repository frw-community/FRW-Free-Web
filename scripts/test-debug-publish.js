
const { KeyManagerV2 } = require('../packages/crypto-pq/dist/index.js');
const { generatePOWV2 } = require('../packages/pow-v2/dist/index.js');
const { RecordManagerV2, toJSON } = require('../packages/protocol-v2/dist/index.js');
const fetch = require('node-fetch');

async function testPublish() {
  console.log('Generating V2 Record...');
  const keyManager = new KeyManagerV2();
  const keyPair = await keyManager.generateKeyPair();
  
  const name = 'debug-test-' + Date.now();
  const proof = await generatePOWV2(name, keyPair.publicKey_dilithium3);
  
  const recordManager = new RecordManagerV2();
  const record = recordManager.createRecord(name, '', '', keyPair, proof);
  
  const jsonBody = toJSON(record);
  console.log('Record size:', jsonBody.length, 'bytes');

  const target = 'http://155.117.46.244:3100/api/submit/v2'; // Known good node
  console.log('Posting to:', target);
  
  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBody
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response:', text);
    
  } catch (err) {
    console.error('Network Error:', err);
  }
}

testPublish();
