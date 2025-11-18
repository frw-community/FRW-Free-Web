import { readFile } from 'fs/promises';
import ora from 'ora';
import { KeyManagerV2 } from '@frw/crypto-pq';
import { generatePOWV2 } from '@frw/pow-v2';
import { RecordManagerV2, serializeFull } from '@frw/protocol-v2';
import { DistributedRegistryV2 } from '@frw/ipfs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import inquirer from 'inquirer';
import { getRequiredDifficulty, estimateTime } from '@frw/pow-v2';

interface RegisterV2Options {
  key?: string;
}

export async function registerV2Command(name: string, options: RegisterV2Options): Promise<void> {
  logger.section(`Register V2 Name: ${name} (Quantum-Resistant)`);

  // Validate name format
  const nameRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  if (!nameRegex.test(name)) {
    logger.error('Invalid name format');
    logger.info('Names must be:');
    logger.info('  - 3-63 characters');
    logger.info('  - Lowercase letters, numbers, hyphens');
    logger.info('  - Start and end with letter/number');
    process.exit(1);
  }

  // Get V2 key path
  const keyPath = options.key || config.get('defaultV2KeyPath');
  if (!keyPath) {
    logger.error('No V2 key found. Run ' + logger.code('frw init-v2') + ' first');
    process.exit(1);
  }

  // Load V2 keypair
  const spinner = ora('Loading V2 keypair...').start();
  let keyPair;
  try {
    const keyData = JSON.parse(await readFile(keyPath, 'utf-8'));
    
    // Check if encrypted
    let password: string | undefined;
    if (keyData.encrypted) {
      spinner.stop();
      const { keyPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'keyPassword',
          message: 'Enter V2 key password:',
          mask: '*'
        }
      ]);
      password = keyPassword;
      spinner.start('Loading V2 keypair...');
    }

    const keyManager = new KeyManagerV2();
    keyPair = keyManager.importKeyPair(keyData, password);
    spinner.succeed('V2 keypair loaded');
  } catch (error) {
    spinner.fail('Failed to load V2 keypair');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  logger.info('');
  logger.info('Your V2 DID: ' + logger.code(keyPair.did));
  logger.info('');

  // Generate Proof of Work V2 (Argon2id-based)
  logger.info('Generating V2 Proof of Work (Argon2id memory-hard)...');
  const difficulty = getRequiredDifficulty(name);
  const estimate = estimateTime(difficulty);
  
  logger.info(`Name length: ${name.length} characters`);
  logger.info(`Required: ${difficulty.leading_zeros} leading zeros, ${difficulty.memory_mib} MiB memory, ${difficulty.iterations} iterations`);
  logger.info(`Estimated time: ${estimate.description}`);
  
  if (estimate.seconds > 300) {
    logger.warn('⚠ This will take a long time! Consider a longer name for instant registration.');
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue anyway?',
        default: false
      }
    ]);
    if (!proceed) {
      logger.info('Registration cancelled');
      process.exit(0);
    }
  }
  
  logger.info('');
  
  const powSpinner = ora('Generating V2 proof...').start();
  const startTime = Date.now();
  
  let lastUpdate = startTime;
  const proof = await generatePOWV2(name, keyPair.publicKey_dilithium3, (attempts) => {
    const now = Date.now();
    if (now - lastUpdate > 5000) {  // Update every 5 seconds
      powSpinner.text = `Generating V2 proof... (${attempts.toLocaleString()} attempts)`;
      lastUpdate = now;
    }
  });
  
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  powSpinner.succeed(`V2 Proof of Work generated in ${elapsed} seconds`);
  logger.info(`  Attempts: ${proof.nonce.toString()}`);
  logger.info(`  Hash: ${Buffer.from(proof.hash).toString('hex').substring(0, 32)}...`);
  logger.info('');

  // Create V2 record
  spinner.start('Creating V2 distributed name record...');
  const recordManager = new RecordManagerV2();
  
  const record = recordManager.createRecord(
    name,
    '', // Content CID (empty for now, will be set on first publish)
    '', // IPNS key (will be generated on publish)
    keyPair,
    proof
  );
  
  spinner.succeed('V2 name record created');

  // Publish to distributed V2 network
  spinner.start('Publishing to global V2 network (quantum-resistant)...');
  try {
    const registry = new DistributedRegistryV2({
      bootstrapNodes: [
        'http://83.228.214.189:3100',  // Swiss Bootstrap #1
        'http://83.228.213.45:3100',   // Swiss Bootstrap #2
        'http://83.228.213.240:3100',  // Swiss Bootstrap #3
        'http://83.228.214.72:3100',   // Swiss Bootstrap #4
        'http://localhost:3100'         // Local dev
      ]
    });
    
    await registry.registerV2(record);
    spinner.succeed('✓ Published to V2 network!');
    logger.info('');
    logger.success('Your V2 name is now globally resolvable!');
    logger.info('Anyone in the world can now access frw://' + name);
    logger.info('This registration is QUANTUM-RESISTANT and future-proof!');
    logger.info('');
  } catch (error) {
    spinner.fail('Failed to publish to V2 network');
    logger.error(error instanceof Error ? error.message : String(error));
    logger.warn('');
    logger.warn('Name record created but not published globally.');
    logger.warn('Make sure bootstrap nodes are running and accessible.');
    logger.info('');
    logger.info('You can retry by running this command again.');
    process.exit(1);
  }

  // Save to config
  const registeredV2Names: Record<string, string> = config.get('registeredV2Names') || {};
  registeredV2Names[name] = keyPair.did;
  config.set('registeredV2Names', registeredV2Names);
  
  // Save to registrations format with full metadata including PoW
  const v2Registrations: Record<string, any> = config.get('v2Registrations') || {};
  v2Registrations[name] = {
    did: keyPair.did,
    publicKey_dilithium3: Buffer.from(keyPair.publicKey_dilithium3).toString('base64'),
    publicKey_ed25519: Buffer.from(keyPair.publicKey_ed25519).toString('base64'),
    registered: Date.now(),
    version: 2,
    pqSecure: true,
    pow: {
      leading_zeros: proof.difficulty,
      memory_mib: proof.memory_cost_mib,
      iterations: proof.time_cost,
      nonce: Number(proof.nonce),
      hash: Buffer.from(proof.hash).toString('hex'),
      timestamp: proof.timestamp
    }
  };
  config.set('v2Registrations', v2Registrations);

  logger.section('V2 Registration Complete');
  logger.success(`Name "${name}" registered with V2 (Quantum-Resistant)!`);
  logger.info('');
  logger.info('Name: ' + logger.code(name));
  logger.info('DID: ' + logger.code(keyPair.did));
  logger.info('Version: ' + logger.code('V2 (Post-Quantum)'));
  logger.info('Security: ' + logger.code('✓ 128-bit Quantum-Resistant'));
  logger.info('Algorithm: ' + logger.code('ML-DSA-65 (Dilithium3)'));
  logger.info('');
  logger.info('Your site will be accessible at:');
  logger.info('  ' + logger.url(`frw://${name}/`));
  logger.info('  ' + logger.url(`frw://${keyPair.did}/`));
  logger.info('');
  logger.info('Next: Create content and run ' + logger.code('frw publish --v2'));
  logger.info('');
  logger.success('✓ Your name is protected against quantum computers!');
}
