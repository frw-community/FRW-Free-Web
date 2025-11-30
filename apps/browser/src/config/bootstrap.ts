/**
 * Bootstrap Configuration for FRW Browser
 * 
 * Centralized configuration for bootstrap nodes and name resolution.
 * Used by both main process (Electron) and renderer process (React).
 */

import { DistributedNameRegistry } from '@frw/ipfs';
import type { DistributedNameRecord } from '@frw/ipfs';

/**
 * Bootstrap node URLs for distributed name registry
 * These are HTTP endpoints that maintain the global name index
 */
export function getBootstrapUrls(): string[] {
  return [
    'http://83.228.214.189:3100',
    'http://83.228.213.45:3100',
    'http://83.228.213.240:3100',
    'http://83.228.214.72:3100',
    "http://155.117.46.244:3100",
    "http://165.73.244.107:3100",
    "http://165.73.244.74:3100"
  ];
}

/**
 * Query name from distributed registry
 * Used by renderer process (ContentViewer component)
 * 
 * @param name - The name to resolve (e.g., 'example')
 * @returns Name record with content CID, public key, timestamp, etc.
 */
export async function queryName(name: string): Promise<{
  name: string;
  publicKey: string;
  contentCID: string;
  timestamp: number;
  signature: string;
}> {
  // Try bootstrap nodes directly (fast HTTP queries)
  const bootstrapNodes = getBootstrapUrls();
  
  for (const node of bootstrapNodes) {
    try {
      const response = await fetch(`${node}/api/resolve/${name}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout per node
      });
      
      if (response.ok) {
        const data = await response.json() as {
          name: string;
          publicKey: string;
          contentCID: string;
          timestamp: number;
          signature: string;
        };
        return {
          name: data.name,
          publicKey: data.publicKey,
          contentCID: data.contentCID,
          timestamp: data.timestamp,
          signature: data.signature,
        };
      }
    } catch (error) {
      console.warn(`[Bootstrap] Failed to query ${node}:`, error);
      // Continue to next bootstrap node
    }
  }
  
  // All bootstrap nodes failed
  throw new Error(`Name '${name}' not found in distributed registry`);
}

/**
 * Initialize distributed registry instance
 * Used by main process for full registry capabilities
 * 
 * @param ipfsUrl - Optional IPFS HTTP API URL (default: http://localhost:5001)
 * @returns Initialized DistributedNameRegistry instance
 */
export function createRegistry(ipfsUrl?: string): DistributedNameRegistry {
  return new DistributedNameRegistry({
    ipfsUrl: ipfsUrl || 'http://localhost:5001',
    bootstrapNodes: [
      ...getBootstrapUrls(),
      'http://localhost:3100'  // Local dev (if running)
    ],
  });
}
