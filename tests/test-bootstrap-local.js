
const spawn = require('child_process').spawn;
const fetch = require('node-fetch');
const { KeyManagerV2 } = require('../packages/crypto-pq/dist/index.js');
const { generatePOWV2 } = require('../packages/pow-v2/dist/index.js');
const { RecordManagerV2, toJSON } = require('../packages/protocol-v2/dist/index.js');

const PORT = 3200; // Test port

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBootstrapNode() {
  console.log('🧪 Starting Local Bootstrap Node Test...');

  // 1. Start Bootstrap Node in background
  const env = { ...process.env, HTTP_PORT: PORT, NODE_ID: 'test-bootstrap' };
  const bootstrap = spawn('node', ['apps/bootstrap-node/dist/index.js'], { env });

  bootstrap.stdout.on('data', (data) => {
    console.log(`[Node]: ${data}`); // Uncomment for full logs
    if (data.toString().includes('HTTP server listening')) {
      console.log('✅ Bootstrap Node Started');
    }
  });
  
  bootstrap.stderr.on('data', (data) => console.error(`[Node Error]: ${data}`));

  // Wait for startup
  await sleep(5000);

  try {
    // 2. Check Health
    const health = await fetch(`http://localhost:${PORT}/health`).then(r => r.json());
    if (health.status === 'ok') {
      console.log('✅ Health Check Passed');
    } else {
      throw new Error('Health check failed');
    }

    // 3. Create V2 Record
    console.log('Generating Test Record...');
    const keyManager = new KeyManagerV2();
    const keyPair = await keyManager.generateKeyPair();
    const name = 'local-test-v2-' + Date.now();
    const proof = await generatePOWV2(name, keyPair.publicKey_dilithium3);
    const recordManager = new RecordManagerV2();
    const record = recordManager.createRecord(name, '', '', keyPair, proof);
    const jsonBody = toJSON(record);

    // 4. Submit V2 Record
    console.log(`Submitting ${name} to /api/submit/v2...`);
    const submitRes = await fetch(`http://localhost:${PORT}/api/submit/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBody
    });

    const submitData = await submitRes.json();
    if (submitRes.ok && submitData.success) {
      console.log('✅ Submission Accepted');
    } else {
      console.error('❌ Submission Failed:', submitData);
      throw new Error('Submission failed');
    }

    // 5. Resolve V2 Record
    console.log(`Resolving ${name}...`);
    const resolveRes = await fetch(`http://localhost:${PORT}/api/resolve/${name}`);
    const resolveData = await resolveRes.json();

    // Check flat structure returned by createUnifiedResponse
    if (resolveRes.ok && resolveData.name === name && resolveData.version === 2) {
      console.log('✅ Resolution Verified');
      console.log('✅ Protocol Version:', resolveData.version);
    } else {
      console.error('❌ Resolution Failed. Status:', resolveRes.status);
      console.error('Response Body:', JSON.stringify(resolveData, null, 2));
      throw new Error('Resolution failed');
    }

    // 6. Verify V1 Rejection (Protocol Unification Check)
    console.log('Checking V1 Rejection...');
    const v1Res = await fetch(`http://localhost:${PORT}/api/resolve/some-fake-name`);
    const v1Data = await v1Res.json();
    if (v1Res.status === 404 && v1Data.error.includes('V1 is deprecated')) {
      console.log('✅ V1 Deprecation Confirmed');
    } else {
      console.error('❌ V1 Check Failed (Expected deprecation message):', v1Data);
    }

  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    bootstrap.kill();
    console.log('✅ Test Cleanup Complete');
  }
}

testBootstrapNode();
