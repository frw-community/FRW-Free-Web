#!/usr/bin/env node

// Generic PoW Regenerator
// Usage: node scripts/regenerate-pow.js <name>

const { generatePOWV2 } = require('../packages/pow-v2/dist/index.js');
const { KeyManagerV2 } = require('../packages/crypto-pq/dist/index.js');
const fs = require('fs');
const path = require('path');

async function regeneratePoW() {
  // 1. Parse arguments
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: node scripts/regenerate-pow.js <name>');
    process.exit(1);
  }

  console.log(`Regenerating PoW for "${name}"...\n`);

  // 2. Load Key
  // Try to find the FRW config directory
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  const frwDir = path.join(homeDir, '.frw');
  const keyPath = path.join(frwDir, 'keys', 'default-v2.json');
  const configPath = path.join(frwDir, 'config.json');

  if (!fs.existsSync(keyPath)) {
    console.error(`Error: Key file not found at ${keyPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(configPath)) {
    console.error(`Error: Config file not found at ${configPath}`);
    process.exit(1);
  }

  const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const keyManager = new KeyManagerV2();
  const keyPair = keyManager.importKeyPair(keyData);
  console.log('✓ Key loaded');

  // 3. Generate PoW
  console.log('Starting PoW generation (this may take a moment)...');
  const pow = await generatePOWV2(name, keyPair.publicKey_dilithium3, (progress) => {
    process.stdout.write(`\rAttempts: ${progress.attempts} | Speed: ${progress.hashes_per_sec.toFixed(2)} H/s`);
  });
  console.log('\n✓ PoW Generated!');
  console.log(pow);

  // 4. Update Config
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (!config.v2Registrations) {
    config.v2Registrations = {};
  }

  // Preserve existing registration data if any (like contentCID), or create new
  const existingReg = config.v2Registrations[name] || {};
  
  config.v2Registrations[name] = {
    ...existingReg,
    name: name,
    pow: {
      nonce: pow.nonce.toString(),
      timestamp: pow.timestamp,
      hash: Buffer.from(pow.hash).toString('hex'),
      leading_zeros: pow.difficulty,
      memory_mib: pow.memory_cost_mib,
      iterations: pow.time_cost
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✓ Config updated for "${name}"`);
}

regeneratePoW().catch((err) => {
  console.error('\nFatal Error:', err.message);
  process.exit(1);
});
