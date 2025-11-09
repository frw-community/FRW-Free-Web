import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import { SignatureManager, KeyManager } from '@frw/crypto';
import { config, getConfigPath, getKeysPath } from '../utils/config.js';
import { logger } from '../utils/logger.js';

interface InitOptions {
  force?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  logger.section('FRW Initialization');

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

  // Generate keypair
  spinner.start('Generating Ed25519 keypair...');
  const keyPair = SignatureManager.generateKeyPair();
  const publicKeyEncoded = SignatureManager.encodePublicKey(keyPair.publicKey);
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
  const exported = KeyManager.exportKeyPair(keyPair, password);
  const keyPath = `${keysPath}/${keyName}.json`;
  
  await writeFile(keyPath, JSON.stringify(exported, null, 2));
  spinner.succeed('Keypair saved');

  // Update config
  config.set('defaultKeyPath', keyPath);

  logger.section('Initialization Complete');
  logger.success('FRW has been initialized successfully!');
  logger.info('');
  logger.info('Your public key: ' + logger.code(publicKeyEncoded));
  logger.info('Key file: ' + keyPath);
  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Register a name: ' + logger.code('frw register myname'));
  logger.info('  2. Create a page: ' + logger.code('mkdir my-site && cd my-site'));
  logger.info('  3. Publish: ' + logger.code('frw publish'));
}
