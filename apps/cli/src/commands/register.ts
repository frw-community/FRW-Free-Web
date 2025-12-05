import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { KeyManagerV2, SignatureManagerV2 } from '@frw/crypto-pq';
import { createRecordV2, toJSON } from '@frw/protocol-v2';
import { generateProofOfWorkV2, getRequiredDifficultyV2 } from '@frw/pow-v2';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { BOOTSTRAP_NODES } from '../utils/constants.js';

interface RegisterOptions {
  key?: string;
  force?: boolean;
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

  // Get key path (default to V2)
  const keyPath = options.key || config.get('defaultKeyPathV2') as string || config.get('defaultKeyPath') as string;
  
  if (!keyPath) {
    logger.error('No key found. Run ' + logger.code('frw init-v2') + ' first');
    process.exit(1);
  }
  
  // Load key
  const spinner = ora('Loading keypair...').start();
  let keyPairV2: any;
  
  try {
    const keyData = JSON.parse(await readFile(keyPath, 'utf-8'));
    
    let password: string | undefined;
    if (typeof keyData.privateKey === 'object' || typeof keyData.privateKey_ed25519 === 'object') {
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

    // Try V2 import
    try {
        const keyManager = new KeyManagerV2();
        keyPairV2 = keyManager.importKeyPair(keyData, password);
        spinner.succeed('V2 Keypair loaded');
    } catch (e) {
        spinner.fail('Failed to load V2 keypair. Please use "frw init-v2" to generate a Quantum-Resistant key.');
        process.exit(1);
    }
  } catch (error) {
    spinner.fail('Failed to load keypair');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const did = keyPairV2.did;
  logger.info('');
  logger.info('Your DID: ' + logger.code(did));
  logger.info('');

  // Check for existing PoW in config
  const v2Registrations: Record<string, any> = config.get('v2Registrations') || {};
  const existingReg = v2Registrations[name];
  let proof;

  if (existingReg && existingReg.pow && !options.force) {
    // Verify if difficulty is still sufficient
    const required = getRequiredDifficultyV2(name);
    const stored = existingReg.pow;
    
    // Simple check if stored difficulty meets requirements
    if (stored.leading_zeros >= required.leading_zeros && stored.memory_mib >= required.memory_mib) {
      logger.success('✓ Found existing valid Proof of Work (reusing)');
      proof = {
        version: 2 as const,
        nonce: BigInt(stored.nonce),
        timestamp: stored.timestamp,
        hash: Buffer.from(stored.hash, 'hex'),
        difficulty: stored.leading_zeros,
        memory_cost_mib: stored.memory_mib,
        time_cost: stored.iterations,
        parallelism: 4
      };
    }
  }

  if (!proof) {
    // Generate Proof of Work V2 (Argon2id-based)
    logger.info('Generating Proof of Work (Argon2id memory-hard)...');
    const difficulty = getRequiredDifficultyV2(name);
    logger.info(`Name length: ${name.length} characters`);
    logger.info(`Required: ${difficulty.leading_zeros} leading zeros, ${difficulty.memory_mib} MiB memory`);
    
    // Estimate time (rough)
    const estimatedSecs = difficulty.leading_zeros <= 1 ? 1 : difficulty.leading_zeros * 2; 
    logger.info(`Estimated time: ~${estimatedSecs} seconds`);
    
    const powSpinner = ora('Mining PoW...').start();
    const startTime = Date.now();
    
    try {
        // Generate PoW binding the Name to the DID (Public Key)
        proof = await generateProofOfWorkV2(name, did, difficulty);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        powSpinner.succeed(`Proof of Work generated in ${elapsed} seconds`);
        
        logger.info(`  Nonce: ${proof.nonce}`);
        logger.info(`  Hash: ${proof.hash.toString('hex').substring(0, 32)}...`);
        logger.info('');
    } catch (e) {
        powSpinner.fail('PoW generation failed');
        logger.error(e instanceof Error ? e.message : String(e));
        process.exit(1);
    }
  }

  // Create V2 Record
  spinner.start('Creating V2 Name Record...');
  // Content CID is empty initially
  const ipnsKey = `/ipns/${did}`; 
  const recordV2 = createRecordV2(name, '', ipnsKey, keyPairV2, proof);
  spinner.succeed('Name record created');

  // Publish to Bootstrap Nodes
  spinner.start('Publishing to global network...');
  
  const nodes = BOOTSTRAP_NODES;
  const recordJSON = toJSON(recordV2);
  
  spinner.text = `Pushing to ${nodes.length} bootstrap nodes...`;

  const pushPromises = nodes.map(async (node: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${node}/api/submit/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: recordJSON,
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (response.ok) {
        return { node, success: true };
      } else {
        const errorText = await response.text();
        return { node, success: false, error: `Rejected: ${errorText}` };
      }
    } catch (err) {
      return { node, success: false, error: err instanceof Error ? err.message : 'Unreachable' };
    }
  });

  const results = await Promise.all(pushPromises);
  const successCount = results.filter((r: { success: boolean }) => r.success).length;

  if (successCount > 0) {
    spinner.succeed(`✓ Published to network!`);
    
    // Log successes/failures
    if (successCount < nodes.length) {
         // Optional: detail failures
    }
    
    // Update config
    const v2Regs = config.get('v2Registrations') as Record<string, any> || {};
    v2Regs[name] = {
        did: did,
        timestamp: Date.now(),
        pow: {
            nonce: proof.nonce.toString(),
            timestamp: proof.timestamp,
            hash: proof.hash.toString('hex'),
            leading_zeros: proof.difficulty,
            memory_mib: proof.memory_cost_mib,
            iterations: proof.time_cost
        }
    };
    config.set('v2Registrations', v2Regs);
    
    // Also set in registeredV2Names for quick lookup
    const regNames = config.get('registeredV2Names') as Record<string, string> || {};
    regNames[name] = did;
    config.set('registeredV2Names', regNames);

    logger.info('Publishing to global network...');
    logger.success('Your name is now globally resolvable!');
    logger.info('Anyone in the world can now access frw://' + name);
    logger.info('');
    
    logger.section('Registration Complete');
    logger.success(`Name "${name}" registered successfully!`);
    logger.info('');
    logger.info('Name: ' + logger.code(name));
    logger.info('DID: ' + logger.code(did));
    logger.info('Security: ' + logger.code('✓ Quantum-Resistant (Dilithium3)'));
    logger.info('');
    logger.info('Your site will be accessible at:');
    logger.info('  ' + logger.url(`frw://${name}/`));
    logger.info('  ' + logger.url(`frw://${did}/`));
    logger.info('');
    logger.info('Next: Create content and run ' + logger.code('frw publish'));

  } else {
    spinner.fail('Failed to publish to any bootstrap node');
    results.forEach((r: { node: string; error?: string }) => {
        logger.info(chalk.red(`  ✗ ${r.node}: `) + chalk.dim(r.error));
    });
    process.exit(1);
  }
}

