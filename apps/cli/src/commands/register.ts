import { readFile } from 'fs/promises';
import ora from 'ora';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { FRWNamingSystem } from '@frw/protocol';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import inquirer from 'inquirer';

interface RegisterOptions {
  key?: string;
}

export async function registerCommand(name: string, options: RegisterOptions): Promise<void> {
  logger.section(`Register Name: ${name}`);

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

  // Get key path
  const keyPath = options.key || config.get('defaultKeyPath');
  if (!keyPath) {
    logger.error('No key found. Run ' + logger.code('frw init') + ' first');
    process.exit(1);
  }

  // Load key
  const spinner = ora('Loading keypair...').start();
  let keyPair;
  try {
    const keyData = JSON.parse(await readFile(keyPath, 'utf-8'));
    
    // Check if encrypted
    let password: string | undefined;
    if (typeof keyData.privateKey === 'object') {
      spinner.stop();
      const { keyPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'keyPassword',
          message: 'Enter key password:',
          mask: '*'
        }
      ]);
      password = keyPassword;
      spinner.start('Loading keypair...');
    }

    keyPair = KeyManager.importKeyPair(keyData, password);
    spinner.succeed('Keypair loaded');
  } catch (error) {
    spinner.fail('Failed to load keypair');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const publicKeyEncoded = SignatureManager.encodePublicKey(keyPair.publicKey);

  // Create name record
  spinner.start('Creating name record...');
  const namingSystem = new FRWNamingSystem();
  const ipnsName = `/ipns/${publicKeyEncoded}`;
  
  const record = namingSystem.createNameRecord(
    name,
    publicKeyEncoded,
    ipnsName,
    keyPair.privateKey,
    {
      description: `FRW site for ${name}`,
    }
  );
  spinner.succeed('Name record created');

  // Publish to DHT (placeholder - requires IPFS)
  spinner.start('Publishing to network...');
  try {
    await namingSystem.publishNameRecord(record);
    spinner.succeed('Published to network');
  } catch (error) {
    spinner.warn('Network publish not yet implemented');
    logger.debug('Name record created locally');
  }

  // Save to config
  const registeredNames = config.get('registeredNames') || {};
  registeredNames[name] = publicKeyEncoded;
  config.set('registeredNames', registeredNames);

  logger.section('Registration Complete');
  logger.success(`Name "${name}" registered successfully!`);
  logger.info('');
  logger.info('Name: ' + logger.code(name));
  logger.info('Public key: ' + logger.code(publicKeyEncoded));
  logger.info('IPNS: ' + logger.code(ipnsName));
  logger.info('');
  logger.info('Your site will be accessible at:');
  logger.info('  ' + logger.url(`frw://${name}/`));
  logger.info('  ' + logger.url(`frw://${publicKeyEncoded}/`));
  logger.info('');
  logger.info('Next: Create content and run ' + logger.code('frw publish'));
}
