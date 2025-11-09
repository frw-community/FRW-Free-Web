// Bootstrap FRW Global Registry
// This creates the initial IPNS registry and should only be run ONCE

import ora from 'ora';
import { bootstrapRegistry } from '@frw/ipfs';
import { logger } from '../utils/logger.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

interface BootstrapOptions {
  ipfs?: string;
  save?: boolean;
}

export async function bootstrapRegistryCommand(options: BootstrapOptions): Promise<void> {
  logger.section('Bootstrap FRW Global Registry');
  logger.warn('⚠️  This should only be run ONCE to initialize the global registry!');
  logger.info('');

  const ipfsUrl = options.ipfs || 'http://localhost:5001';
  logger.info(`Using IPFS: ${ipfsUrl}`);
  logger.info('');

  const spinner = ora('Creating initial registry...').start();

  try {
    const result = await bootstrapRegistry(ipfsUrl);
    
    spinner.succeed('Registry bootstrapped successfully!');
    logger.info('');

    logger.section('Registry Information');
    logger.success(`IPNS Key: ${result.ipnsKey}`);
    logger.success(`Initial CID: ${result.cid}`);
    logger.info('');

    logger.section('Next Steps');
    logger.info('1. Save the IPNS key securely (you need it to update the registry)');
    logger.info('2. Add to code: FRW_REGISTRY_IPNS=' + result.ipnsKey);
    logger.info('3. Share the IPNS key publicly (everyone needs it to read the registry)');
    logger.info('');

    // Save to file if requested
    if (options.save) {
      const configPath = join(process.cwd(), 'frw-registry-config.json');
      const config = {
        ipnsKey: result.ipnsKey,
        initialCID: result.cid,
        bootstrapped: new Date().toISOString(),
        ipfsUrl
      };

      await writeFile(configPath, JSON.stringify(config, null, 2));
      logger.success(`✓ Configuration saved to: ${configPath}`);
      logger.info('');
    }

    logger.section('How to Update Registry');
    logger.info('The registry IPNS key is stored in IPFS under the name "frw-global-registry"');
    logger.info('To update the registry:');
    logger.info('  1. Download current registry');
    logger.info('  2. Add/update names');
    logger.info('  3. Upload to IPFS → get new CID');
    logger.info('  4. Publish CID to IPNS using the key');
    logger.info('');
    logger.code('ipfs name publish <new-cid> --key=frw-global-registry');
    logger.info('');

    logger.success('✓ Bootstrap complete!');

  } catch (error) {
    spinner.fail('Bootstrap failed');
    logger.error(error instanceof Error ? error.message : String(error));
    logger.info('');
    logger.info('Common issues:');
    logger.info('  - IPFS daemon not running: ipfs daemon');
    logger.info('  - Network connectivity');
    logger.info('  - IPFS API not accessible');
    process.exit(1);
  }
}
