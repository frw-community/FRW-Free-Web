import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import { KeyManagerV2 } from '@frw/crypto-pq';
import { config, getConfigPath, getKeysPath } from '../utils/config.js';
import { logger } from '../utils/logger.js';

interface InitV2Options {
  force?: boolean;
}

export async function initV2Command(options: InitV2Options): Promise<void> {
  logger.section('FRW V2 Initialization (Quantum-Resistant)');

  const configPath = getConfigPath();
  const keysPath = getKeysPath();

  // Check if V2 key already exists
  const v2KeyPath = `${keysPath}/default-v2.json`;
  if (existsSync(v2KeyPath) && !options.force) {
    logger.warn('V2 keypair already exists');
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite existing V2 keypair?',
        default: false
      }
    ]);

    if (!overwrite) {
      logger.info('Initialization cancelled');
      return;
    }
  }

  // Create directories
  const spinner = ora('Creating directories...').start();
  try {
    await mkdir(configPath, { recursive: true });
    await mkdir(keysPath, { recursive: true });
    spinner.succeed('Directories created');
  } catch (error) {
    spinner.fail('Failed to create directories');
    throw error;
  }

  // Generate V2 keypair (Dilithium3 + Ed25519 hybrid)
  spinner.start('Generating quantum-resistant keypair (Dilithium3 + Ed25519)...');
  logger.info('');
  logger.info('This may take 10-30 seconds...');
  
  const keyManager = new KeyManagerV2();
  const keyPair = await keyManager.generateKeyPair();
  
  spinner.succeed('Quantum-resistant keypair generated');

  // Ask for key name
  const { keyName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'keyName',
      message: 'Name for this V2 key:',
      default: 'default-v2'
    }
  ]);

  // Ask for password protection
  const { usePassword } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'usePassword',
      message: 'Password-protect private key?',
      default: true
    }
  ]);

  let password: string | undefined;
  if (usePassword) {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter password:',
        mask: '*'
      },
      {
        type: 'password',
        name: 'confirmPassword',
        message: 'Confirm password:',
        mask: '*'
      }
    ]);

    if (answers.password !== answers.confirmPassword) {
      logger.error('Passwords do not match');
      process.exit(1);
    }
    password = answers.password;
  }

  // Export keypair (with optional encryption)
  spinner.start('Saving V2 keypair...');
  const exported = keyManager.exportKeyPair(keyPair, password);
  const finalKeyPath = `${keysPath}/${keyName}.json`;
  
  await writeFile(finalKeyPath, JSON.stringify(exported, null, 2));
  
  if (password) {
    spinner.succeed('V2 keypair saved (encrypted)');
  } else {
    spinner.succeed('V2 keypair saved');
  }

  // Update config
  config.set('defaultKeyPathV2', finalKeyPath);

  logger.section('V2 Initialization Complete');
  logger.success('Quantum-resistant identity created!');
  logger.info('');
  logger.info('Your V2 DID: ' + logger.code(keyPair.did));
  logger.info('Key file: ' + finalKeyPath);
  logger.info('');
  logger.info('Key Details:');
  logger.info('  Ed25519 public key: ' + Buffer.from(keyPair.publicKey_ed25519).toString('base64').substring(0, 32) + '...');
  logger.info('  Dilithium3 public key: ' + Buffer.from(keyPair.publicKey_dilithium3).toString('base64').substring(0, 32) + '...');
  logger.info('  Security: Post-quantum secure (128-bit)');
  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Register a V2 name: ' + logger.code('frw register-v2 myname'));
  logger.info('  2. Publish content: ' + logger.code('frw publish'));
  logger.info('');
  logger.warn('Note: V2 names are quantum-resistant and future-proof!');
}
