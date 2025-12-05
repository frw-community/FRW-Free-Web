import chalk from 'chalk';
import ora from 'ora';
import { DistributedRegistryV2 } from '@frw/ipfs';
import { logger } from '../utils/logger.js';
import { BOOTSTRAP_NODES } from '../utils/constants.js';

export async function lookupCommand(name: string): Promise<void> {
  const spinner = ora(`Resolving "${name}"...`).start();

  try {
    const registry = new DistributedRegistryV2({
      bootstrapNodes: BOOTSTRAP_NODES
    });

    const result = await registry.resolveName(name);

    if (result) {
      spinner.succeed('Name found');
      logger.info('');
      logger.info(`Name: ${chalk.bold(result.record.name)}`);
      
      if (result.record.contentCID) {
        logger.info(`Content CID: ${chalk.green(result.record.contentCID)}`);
        logger.info(`Gateway URL: ${chalk.cyan(`https://ipfs.io/ipfs/${result.record.contentCID}`)}`);
      } else {
        logger.info(`Content CID: ${chalk.yellow('(empty)')} ${chalk.dim('- Name registered but no content published yet')}`);
      }

      // Handle V1 vs V2 owner key display
      const ownerKey = (result.record as any).owner || (result.record as any).publicKey;
      logger.info(`Owner Key: ${chalk.dim(ownerKey || 'Unknown')}`);
      logger.info(`Source: ${chalk.dim(result.source)}`);
      
      if ((result as any).version === 2) {
        logger.info(`Security: ${chalk.magenta('Quantum-Resistant (Dilithium3)')}`);
      }
      
      logger.info('');
    } else {
      spinner.fail('Name not found');
      logger.error(`Could not resolve "${name}" on the distributed network.`);
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Resolution failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function infoCommand(name: string): Promise<void> {
  const spinner = ora(`Getting detailed info for "${name}"...`).start();

  try {
    const registry = new DistributedRegistryV2({
      bootstrapNodes: BOOTSTRAP_NODES
    });

    const result = await registry.resolveName(name);

    if (result) {
      spinner.succeed('Record retrieved');
      logger.info('');
      logger.section('Distributed Name Record');
      logger.info(`Name:        ${chalk.bold(result.record.name)}`);
      
      const version = (result as any).version || result.record.version || 1;
      logger.info(`Version:     v${version}`);
      
      // Handle timestamp (V1 uses 'registered', V2 might use 'timestamp' or 'created')
      const registered = (result.record as any).registered || (result.record as any).timestamp;
      if (registered) {
          logger.info(`Registered:  ${new Date(registered).toLocaleString()}`);
      }
      
      if ((result.record as any).expires) {
          logger.info(`Expires:     ${new Date((result.record as any).expires).toLocaleString()}`);
      }
      logger.info('');
      
      logger.section('Content');
      if (result.record.contentCID) {
        logger.info(`CID:         ${chalk.green(result.record.contentCID)}`);
        // IPNS key might be different in V2 or optional
        if ((result.record as any).ipnsKey) {
            logger.info(`IPNS:        ${chalk.dim((result.record as any).ipnsKey)}`);
        }
        logger.info(`Frw URL:     frw://${name}`);
      } else {
        logger.info(`CID:         ${chalk.yellow('Not Set')}`);
        logger.info(`Status:      ${chalk.yellow('Awaiting Content (Use `frw publish`)')}`);
      }
      logger.info('');

      logger.section('Identity');
      const ownerKey = (result.record as any).owner || (result.record as any).publicKey;
      logger.info(`Owner Key:   ${chalk.dim(ownerKey || 'Unknown')}`);
      
      if ((result.record as any).did) {
        logger.info(`DID:         ${chalk.dim((result.record as any).did)}`);
      }
      
      // Handle signature display safely
      const sig = (result.record as any).signature;
      if (sig) {
          const sigStr = typeof sig === 'string' ? sig : Buffer.from(sig).toString('hex');
          logger.info(`Signature:   ${chalk.dim(sigStr.substring(0, 32))}...`);
      }
      logger.info('');

      logger.section('Resolution Metadata');
      logger.info(`Source:      ${result.source.toUpperCase()}`);
      logger.info(`Latency:     ${result.latencyMs}ms`);
      logger.info(`Verified:    ${result.verified ? chalk.green('YES') : chalk.red('NO')}`);
      
      if ((result.record as any).proof) {
        logger.info(`POW Nonce:   ${(result.record as any).proof.nonce}`);
      }
      logger.info('');

    } else {
      spinner.fail('Name not found');
      logger.error(`Could not resolve "${name}" on the distributed network.`);
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Resolution failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function listNamesCommand(): Promise<void> {
  const spinner = ora('Querying bootstrap nodes for registered names...').start();

  // Try to fetch list from the first available bootstrap node
  for (const node of BOOTSTRAP_NODES) {
    if (node.includes('localhost')) continue; // Skip localhost unless strictly necessary

    try {
      spinner.text = `Querying ${node}...`;
      
      // Fetch V1 names
      const responseV1 = await fetch(`${node}/api/list`);
      const v1Data = responseV1.ok ? await responseV1.json() as { names: any[] } : { names: [] };

      // Fetch V2 names
      const responseV2 = await fetch(`${node}/api/v2/names`);
      const v2Data = responseV2.ok ? await responseV2.json() as { names: any[] } : { names: [] };

      const allNames = [...(v1Data.names || []), ...(v2Data.names || [])];
      
      // Deduplicate by name
      const uniqueNames = new Map();
      allNames.forEach(record => {
        uniqueNames.set(record.name, record);
      });
      
      const sortedNames = Array.from(uniqueNames.values()).sort((a, b) => b.timestamp - a.timestamp);
      
      if (sortedNames.length >= 0) { // Allow empty list if successful
        spinner.succeed(`Retrieved ${sortedNames.length} names from network`);
        logger.info('');
        
        if (sortedNames.length === 0) {
          logger.info(chalk.yellow('No names found in the registry yet.'));
          return;
        }

        logger.info(`${chalk.bold('Registered Names')} (${sortedNames.length})`);
        logger.info('────────────────────────────────');
        
        // Basic table display
        sortedNames.forEach((record: any) => {
            const date = new Date(record.timestamp).toLocaleDateString();
            const hasContent = record.contentCID ? chalk.green('✓') : chalk.dim('○');
            const isV2 = record.version === 2 || record.publicKey_dilithium3;
            const versionBadge = isV2 ? chalk.magenta('V2') : chalk.dim('V1');
            
            // Pad name for alignment
            const paddedName = record.name.padEnd(25);
            logger.info(`${hasContent} ${chalk.cyan(paddedName)} ${versionBadge} ${chalk.dim(date)}`);
        });
        logger.info('');
        return;
      }
    } catch (error) {
      // Try next node
      continue;
    }
  }

  spinner.fail('Failed to list names');
  logger.error('Could not connect to any bootstrap nodes to retrieve the list.');
}
