import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import { KeyManagerV2 } from '@frw/crypto-pq';
import { config, getConfigPath, getKeysPath } from '../utils/config.js';
import { logger } from '../utils/logger.js';

interface InitOptions {
  force?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  logger.section('FRW Initialization (Quantum-Resistant)');

  const configPath = getConfigPath();
  const keysPath = getKeysPath();

  // Check if already initialized
  if (existsSync(configPath) && !options.force) {
    logger.warn('FRW is already initialized');
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite existing configuration?',
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
  
  spinner.succeed('Keypair generated');

  // Ask for key name
  const { keyName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'keyName',
      message: 'Name for this key:',
      default: 'default'
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

  // Export keypair
  spinner.start('Saving keypair...');
  const exported = keyManager.exportKeyPair(keyPair, password);
  const keyPath = `${keysPath}/${keyName}.json`;
  
  await writeFile(keyPath, JSON.stringify(exported, null, 2));
  spinner.succeed('Keypair saved');

  // Update config
  config.set('defaultKeyPathV2', keyPath); // Use standard key path for V2

  logger.section('Initialization Complete');
  logger.success('FRW identity created (Post-Quantum Secure)!');
  logger.info('');
  logger.info('Your DID: ' + logger.code(keyPair.did));
  logger.info('Key file: ' + keyPath);
  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Register a name: ' + logger.code('frw register myname'));
  logger.info('  2. Publish content: ' + logger.code('frw publish'));
}
