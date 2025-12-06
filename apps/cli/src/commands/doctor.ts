
import chalk from 'chalk';
import ora from 'ora';
import { IPFSClient } from '@frw/ipfs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { BOOTSTRAP_NODES } from '../utils/constants.js';

type NodeStatus = {
  url: string;
  status: string;
  responseTime?: number;
  nodeInfo?: {
    id?: string;
    v1Records?: number;
    v2Records?: number;
    uptime?: number;
  };
};

export async function doctorCommand(verbose: boolean = false): Promise<void> {
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
  const nodeStatus: NodeStatus[] = [];
  
  const checks = BOOTSTRAP_NODES.map(async (node) => {
    if (node.includes('localhost')) return { url: node, status: 'skipped (localhost)' }; 
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${node}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      
      if (res.ok) {
        const data = await res.json() as any;
        return { 
          url: node, 
          status: 'healthy', 
          responseTime,
          nodeInfo: {
            id: data.nodeId,
            v1Records: data.v1IndexSize,
            v2Records: data.v2IndexSize,
            uptime: data.uptime
          }
        };
      }
      return { url: node, status: `HTTP ${res.status}` };
    } catch (error) {
      return { url: node, status: 'timeout/connection failed' };
    }
  });

  const nodeResults = await Promise.all(checks);
  
  // Count healthy nodes and collect status
  nodeResults.forEach(result => {
    if (result.status === 'healthy') {
      healthy++;
    }
    nodeStatus.push(result);
  });
  
  results.network = healthy;

  if (healthy === 0) {
    spinnerNet.fail('No bootstrap nodes reachable (Network might be down or you are offline)');
  } else if (healthy < BOOTSTRAP_NODES.length) {
    spinnerNet.warn(`Network degraded: ${healthy}/${BOOTSTRAP_NODES.length} nodes reachable`);
  } else {
    spinnerNet.succeed(`Network healthy: ${healthy}/${BOOTSTRAP_NODES.length} nodes reachable`);
  }

  if (verbose) {
    logger.info('');
    logger.section('Bootstrap Node Details');
    nodeStatus.forEach((node) => {
      const statusColor =
        node.status === 'healthy'
          ? chalk.green(node.status)
          : node.status.startsWith('HTTP')
            ? chalk.yellow(node.status)
            : chalk.red(node.status);

      logger.info(
        `${chalk.cyan(node.url)} -> ${statusColor}${
          node.responseTime !== undefined ? chalk.dim(` (${node.responseTime} ms)`) : ''
        }`
      );

      if (node.nodeInfo) {
        logger.info(
          chalk.dim(
            `  id=${node.nodeInfo.id} v1=${node.nodeInfo.v1Records} v2=${node.nodeInfo.v2Records} uptime=${Math.round(
              node.nodeInfo.uptime ?? 0
            )}s`
          )
        );
      }
    });
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
