
import chalk from 'chalk';
import ora from 'ora';
import { IPFSClient } from '@frw/ipfs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { BOOTSTRAP_NODES } from '../utils/constants.js';

export async function doctorCommand(): Promise<void> {
  logger.section('FRW Diagnostic Tool (The Doctor)');

  const results = {
    config: false,
    ipfs: false,
    network: 0,
    keys: false
  };

  // 1. Check Configuration
  const spinnerConfig = ora('Checking configuration...').start();
  try {
    const hasKeys = config.get('defaultKeyPathV2') || config.get('defaultKeyPath');
    if (hasKeys) {
      results.config = true;
      spinnerConfig.succeed('Configuration loaded');
    } else {
      spinnerConfig.warn('Configuration found but no identity initialized');
    }
  } catch (e) {
    spinnerConfig.fail('Configuration corrupted or missing');
  }

  // 2. Check IPFS
  const spinnerIpfs = ora('Checking IPFS connection...').start();
  const ipfsHost = config.get('ipfsHost') || '127.0.0.1';
  const ipfsPort = config.get('ipfsPort') || 5001;
  const ipfsUrl = `http://${ipfsHost}:${ipfsPort}`;

  try {
    const ipfsClient = new IPFSClient({ host: ipfsHost, port: ipfsPort, protocol: 'http' });
    await ipfsClient.init();
    // If init succeeds, we are connected.
    // Ideally we'd get version, but if client is private we assume connection is good.
    results.ipfs = true;
    spinnerIpfs.succeed(`IPFS Daemon connected`);
  } catch (e) {
    spinnerIpfs.fail(`IPFS Daemon unreachable at ${ipfsUrl}`);
    logger.info(chalk.dim('  Run "ipfs daemon" or install IPFS Desktop'));
  }

  // 3. Check Network (Bootstrap Nodes)
  const spinnerNet = ora(`Checking ${BOOTSTRAP_NODES.length} bootstrap nodes...`).start();
  let healthy = 0;
  
  const checks = BOOTSTRAP_NODES.map(async (node) => {
    if (node.includes('localhost')) return false; 
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${node}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  });

  const nodeResults = await Promise.all(checks);
  healthy = nodeResults.filter(Boolean).length;
  results.network = healthy;

  if (healthy === 0) {
    spinnerNet.fail('No bootstrap nodes reachable (Network might be down or you are offline)');
  } else if (healthy < BOOTSTRAP_NODES.length) {
    spinnerNet.warn(`Network degraded: ${healthy}/${BOOTSTRAP_NODES.length} nodes reachable`);
  } else {
    spinnerNet.succeed(`Network healthy: ${healthy}/${BOOTSTRAP_NODES.length} nodes reachable`);
  }

  // Summary
  logger.info('');
  logger.section('Diagnosis');
  
  if (results.config && results.ipfs && results.network > 0) {
    logger.success('✓ System is healthy and ready for FRW!');
  } else {
    logger.warn('⚠ System needs attention:');
    if (!results.config) logger.info('  - Run "frw init-v2" to set up your identity');
    if (!results.ipfs) logger.info('  - Start IPFS daemon to publish/browse');
    if (results.network === 0) logger.info('  - Check your internet connection');
  }
  logger.info('');
}
