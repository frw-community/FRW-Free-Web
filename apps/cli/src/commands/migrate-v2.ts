import { readFile } from 'fs/promises';
import ora from 'ora';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { KeyManagerV2 } from '@frw/crypto-pq';
import { generatePOWV2, getRequiredDifficulty, estimateTime } from '@frw/pow-v2';
import { RecordManagerV2 } from '@frw/protocol-v2';
import { DistributedNameRegistry } from '@frw/ipfs';
import { DistributedRegistryV2 } from '@frw/ipfs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import inquirer from 'inquirer';

interface MigrateV2Options {
  v1Key?: string;
  v2Key?: string;
  force?: boolean;
}

export async function migrateV2Command(name: string, options: MigrateV2Options): Promise<void> {
  logger.section(`Migrate Name to V2: ${name}`);
  logger.info('This will upgrade your V1 name to quantum-resistant V2');
  logger.info('');

  // Check if name is registered in V1
  const registrations = config.get('registrations') || {};
  const v1Registration = registrations[name];
  
  if (!v1Registration) {
    logger.error(`Name "${name}" is not registered in V1`);
    logger.info('Use ' + logger.code('frw register-v2 ' + name) + ' to register a new V2 name');
    process.exit(1);
  }

  // Check if already migrated to V2
  const v2Registrations: Record<string, any> = config.get('v2Registrations') || {};
  if (v2Registrations[name] && !options.force) {
    logger.warn(`Name "${name}" is already migrated to V2`);
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Migrate again?',
        default: false
      }
    ]);
    
    if (!overwrite) {
      logger.info('Migration cancelled');
      return;
    }
  }

  logger.info('Migration Steps:');
  logger.info('1. Load V1 keypair (Ed25519)');
  logger.info('2. Generate V2 keypair (Ed25519 + Dilithium3)');
  logger.info('3. Generate V2 Proof of Work');
  logger.info('4. Create V2 record with V1 content');
  logger.info('5. Publish V2 record to network');
  logger.info('6. V1 record remains active (backward compatibility)');
  logger.info('');

  const { proceed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with migration?',
      default: true
    }
  ]);

  if (!proceed) {
    logger.info('Migration cancelled');
    return;
  }

  // Load V1 keypair
  const v1KeyPath = options.v1Key || config.get('defaultKeyPath');
  if (!v1KeyPath) {
    logger.error('No V1 key found. Run ' + logger.code('frw init') + ' first');
    process.exit(1);
  }

  const spinner = ora('Loading V1 keypair...').start();
  let v1KeyPair;
  try {
    const keyData = JSON.parse(await readFile(v1KeyPath, 'utf-8'));
    
    let password: string | undefined;
    if (typeof keyData.privateKey === 'object') {
      spinner.stop();
      const { keyPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'keyPassword',
          message: 'Enter V1 key password:',
          mask: '*'
        }
      ]);
      password = keyPassword;
      spinner.start('Loading V1 keypair...');
    }

    v1KeyPair = KeyManager.importKeyPair(keyData, password);
    spinner.succeed('V1 keypair loaded');
  } catch (error) {
    spinner.fail('Failed to load V1 keypair');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Get V1 record details from distributed registry
  spinner.start('Fetching V1 record details...');
  let v1ContentCID = '';
  let v1IpnsKey = '';
  try {
    const registry = new DistributedNameRegistry({
      bootstrapNodes: [
        'http://83.228.214.189:3100',
        'http://83.228.213.45:3100',
        'http://83.228.213.240:3100',
        'http://83.228.214.72:3100',
        'http://localhost:3100',
        "http://155.117.46.244:3100",
        "http://165.73.244.107:3100",
        "http://165.73.244.74:3100"
      ]
    });
    
    const resolved = await registry.resolveName(name);
    if (resolved) {
      v1ContentCID = resolved.record.contentCID;
      v1IpnsKey = resolved.record.ipnsKey;
      spinner.succeed('V1 record fetched');
    } else {
      spinner.warn('V1 record not found on network (will use empty content)');
    }
  } catch (error) {
    spinner.warn('Could not fetch V1 record (will use empty content)');
  }

  // Load or generate V2 keypair
  const v2KeyPath = options.v2Key || config.get('defaultV2KeyPath');
  let v2KeyPair;
  
  if (v2KeyPath) {
    spinner.start('Loading V2 keypair...').start();
    try {
      const keyData = JSON.parse(await readFile(v2KeyPath, 'utf-8'));
      
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
      v2KeyPair = keyManager.importKeyPair(keyData, password);
      spinner.succeed('V2 keypair loaded');
    } catch (error) {
      spinner.fail('Failed to load V2 keypair');
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  } else {
    spinner.start('Generating new V2 keypair...');
    logger.info('');
    logger.info('No V2 key found, generating new one...');
    logger.info('This may take 10-30 seconds...');
    
    const keyManager = new KeyManagerV2();
    v2KeyPair = keyManager.generateKeyPair();
    spinner.succeed('V2 keypair generated');
    
    logger.info('');
    logger.warn('New V2 DID: ' + v2KeyPair.did);
    logger.warn('Save this DID! Run ' + logger.code('frw init-v2') + ' to save V2 keys permanently');
    logger.info('');
  }

  // Generate V2 PoW
  logger.info('Generating V2 Proof of Work...');
  const difficulty = getRequiredDifficulty(name);
  const estimate = estimateTime(difficulty);
  
  logger.info(`Name length: ${name.length} characters`);
  logger.info(`Required: ${difficulty.leading_zeros} leading zeros`);
  logger.info(`Estimated time: ${estimate.description}`);
  logger.info('');
  
  const powSpinner = ora('Generating V2 proof...').start();
  const startTime = Date.now();
  
  let lastUpdate = startTime;
  const proof = await generatePOWV2(name, v2KeyPair.publicKey_dilithium3, (attempts) => {
    const now = Date.now();
    if (now - lastUpdate > 5000) {
      powSpinner.text = `Generating V2 proof... (${attempts.toLocaleString()} attempts)`;
      lastUpdate = now;
    }
  });
  
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  powSpinner.succeed(`V2 Proof of Work generated in ${elapsed} seconds`);
  logger.info('');

  // Create V2 record with V1 content
  spinner.start('Creating V2 migration record...');
  const recordManager = new RecordManagerV2();
  
  const record = recordManager.createRecord(
    name,
    v1ContentCID || '',  // Preserve V1 content
    v1IpnsKey || '',     // Preserve V1 IPNS
    v2KeyPair,
    proof
  );
  
  spinner.succeed('V2 migration record created');

  // Publish to V2 network
  spinner.start('Publishing to V2 network...');
  try {
    const registryV2 = new DistributedRegistryV2({
      bootstrapNodes: [
        'http://83.228.214.189:3100',
        'http://83.228.213.45:3100',
        'http://83.228.213.240:3100',
        'http://83.228.214.72:3100',
        'http://localhost:3100',
        "http://155.117.46.244:3100",
        "http://165.73.244.107:3100",
        "http://165.73.244.74:3100"
      ]
    });
    
    await registryV2.registerV2(record);
    spinner.succeed('✓ Published to V2 network!');
    logger.info('');
  } catch (error) {
    spinner.fail('Failed to publish to V2 network');
    logger.error(error instanceof Error ? error.message : String(error));
    logger.warn('');
    logger.warn('Migration record created but not published globally.');
    process.exit(1);
  }

  // Save migration record to config
  v2Registrations[name] = {
    did: v2KeyPair.did,
    publicKey_dilithium3: Buffer.from(v2KeyPair.publicKey_dilithium3).toString('base64'),
    publicKey_ed25519: Buffer.from(v2KeyPair.publicKey_ed25519).toString('base64'),
    migrated: Date.now(),
    migratedFrom: 'v1',
    v1PublicKey: SignatureManager.encodePublicKey(v1KeyPair.publicKey),
    version: 2,
    pqSecure: true
  };
  config.set('v2Registrations', v2Registrations);

  logger.section('Migration Complete');
  logger.success(`Name "${name}" successfully migrated to V2!`);
  logger.info('');
  logger.info('Name: ' + logger.code(name));
  logger.info('V1 Public Key: ' + logger.code(SignatureManager.encodePublicKey(v1KeyPair.publicKey).substring(0, 32) + '...'));
  logger.info('V2 DID: ' + logger.code(v2KeyPair.did));
  logger.info('Version: ' + logger.code('V2 (Post-Quantum)'));
  logger.info('Security: ' + logger.code('✓ 128-bit Quantum-Resistant'));
  logger.info('');
  logger.info('Both V1 and V2 records are active:');
  logger.info('  V1 clients will continue to resolve via Ed25519');
  logger.info('  V2 clients will resolve via Dilithium3 (quantum-safe)');
  logger.info('');
  if (v1ContentCID) {
    logger.success('✓ V1 content preserved in V2 record');
  }
  logger.success('✓ Your name is now protected against quantum computers!');
}
