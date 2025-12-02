import chalk from 'chalk';
import ora from 'ora';
import { DistributedNameRegistry } from '@frw/ipfs';
import { logger } from '../utils/logger.js';
import { fetch } from 'undici';

// Hardcoded bootstrap nodes (consistent with register.ts)
const BOOTSTRAP_NODES = [
  'http://83.228.214.189:3100',
  'http://83.228.213.45:3100',
  'http://83.228.213.240:3100',
  'http://83.228.214.72:3100',
  'http://localhost:3100',
  "http://155.117.46.244:3100",
  "http://165.73.244.107:3100",
  "http://165.73.244.74:3100"
];

export async function lookupCommand(name: string): Promise<void> {
  const spinner = ora(`Resolving "${name}"...`).start();

  try {
    const registry = new DistributedNameRegistry({
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

      logger.info(`Public Key: ${chalk.dim(result.record.publicKey)}`);
      logger.info(`Source: ${chalk.dim(result.source)}`);
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
    const registry = new DistributedNameRegistry({
      bootstrapNodes: BOOTSTRAP_NODES
    });

    const result = await registry.resolveName(name);

    if (result) {
      spinner.succeed('Record retrieved');
      logger.info('');
      logger.section('Distributed Name Record');
      logger.info(`Name:        ${chalk.bold(result.record.name)}`);
      logger.info(`Version:     v${result.record.version}`);
      logger.info(`Registered:  ${new Date(result.record.registered).toLocaleString()}`);
      logger.info(`Expires:     ${new Date(result.record.expires).toLocaleString()}`);
      logger.info('');
      
      logger.section('Content');
      if (result.record.contentCID) {
        logger.info(`CID:         ${chalk.green(result.record.contentCID)}`);
        logger.info(`IPNS:        ${chalk.dim(result.record.ipnsKey)}`);
        logger.info(`Frw URL:     frw://${name}`);
      } else {
        logger.info(`CID:         ${chalk.yellow('Not Set')}`);
        logger.info(`Status:      ${chalk.yellow('Awaiting Content (Use `frw publish`)')}`);
      }
      logger.info('');

      logger.section('Identity');
      logger.info(`Owner Key:   ${chalk.dim(result.record.publicKey)}`);
      logger.info(`DID:         ${chalk.dim(result.record.did)}`);
      logger.info(`Signature:   ${chalk.dim(result.record.signature.substring(0, 32))}...`);
      logger.info('');

      logger.section('Resolution Metadata');
      logger.info(`Source:      ${result.source.toUpperCase()}`);
      logger.info(`Latency:     ${result.latencyMs}ms`);
      logger.info(`Verified:    ${result.verified ? chalk.green('YES') : chalk.red('NO')}`);
      
      if (result.record.proof) {
        logger.info(`POW Nonce:   ${result.record.proof.nonce}`);
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
      const response = await fetch(`${node}/api/list`);
      
      if (response.ok) {
        const data = await response.json() as { count: number, names: any[] };
        
        spinner.succeed(`Retrieved ${data.count} names from network`);
        logger.info('');
        
        if (data.names.length === 0) {
          logger.info(chalk.yellow('No names found in the registry yet.'));
          return;
        }

        logger.info(`${chalk.bold('Registered Names')} (${data.count})`);
        logger.info('────────────────────────────────');
        
        // Basic table display
        data.names.forEach((record: any) => {
            const date = new Date(record.timestamp).toLocaleDateString();
            const hasContent = record.contentCID ? chalk.green('✓') : chalk.dim('○');
            // Pad name for alignment
            const paddedName = record.name.padEnd(20);
            logger.info(`${hasContent} ${chalk.cyan(paddedName)} ${chalk.dim(date)}`);
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
