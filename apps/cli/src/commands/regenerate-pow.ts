import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import ora from 'ora';
import { KeyManagerV2 } from '@frw/crypto-pq';
import { generatePOWV2 } from '@frw/pow-v2';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export async function regeneratePowCommand(name: string): Promise<void> {
  logger.section(`Regenerate PoW for "${name}"`);

  // 1. Validate config existence
  const configPath = config.path;
  if (!configPath) {
    logger.error('Config file not found');
    process.exit(1);
  }

  // 2. Load Key
  const keyPath = config.get('defaultV2KeyPath') as string;
  if (!keyPath) {
    logger.error('Default V2 key path not found in config');
    process.exit(1);
  }

  let keyPair;
  try {
    const keyData = JSON.parse(await readFile(keyPath, 'utf-8'));
    const keyManager = new KeyManagerV2();
    keyPair = keyManager.importKeyPair(keyData); // Password handling omitted for simplicity or should match register-v2 logic
    logger.success('V2 Key loaded');
  } catch (error) {
    logger.error(`Failed to load key: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // 3. Generate PoW
  logger.info('Starting PoW generation...');
  const spinner = ora('Generating V2 proof...').start();
  
  const startTime = Date.now();
  let lastUpdate = startTime;

  const proof = await generatePOWV2(name, keyPair.publicKey_dilithium3, (progress) => {
    const now = Date.now();
    if (now - lastUpdate > 5000) {
      spinner.text = `Generating V2 proof... (${progress.attempts.toLocaleString()} attempts)`;
      lastUpdate = now;
    }
  });

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  spinner.succeed(`PoW Generated in ${elapsed}s`);
  
  logger.info(`  Nonce: ${proof.nonce}`);
  logger.info(`  Difficulty: ${proof.difficulty}`);
  logger.info(`  Memory: ${proof.memory_cost_mib} MiB`);

  // 4. Update Config
  const currentConfig = JSON.parse(await readFile(configPath, 'utf-8'));
  
  if (!currentConfig.v2Registrations) {
    currentConfig.v2Registrations = {};
  }

  const existingReg = currentConfig.v2Registrations[name] || {};

  currentConfig.v2Registrations[name] = {
    ...existingReg,
    name: name,
    pow: {
      nonce: proof.nonce.toString(),
      timestamp: proof.timestamp,
      hash: Buffer.from(proof.hash).toString('hex'),
      leading_zeros: proof.difficulty,
      memory_mib: proof.memory_cost_mib,
      iterations: proof.time_cost
    }
  };

  await writeFile(configPath, JSON.stringify(currentConfig, null, 2));
  logger.success(`Configuration updated for "${name}"`);
}
