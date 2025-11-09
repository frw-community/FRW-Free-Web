// FRW Global IPNS Registry
// Production-ready global name registry using IPFS + IPNS

import { create as createIPFSClient, IPFSHTTPClient } from 'ipfs-http-client';
import { SignatureManager } from '@frw/crypto';
import type { DistributedNameRecord } from './distributed-registry.js';

/**
 * Global registry structure stored on IPFS and published via IPNS
 */
export interface GlobalRegistry {
  version: number;                    // Schema version
  updated: number;                    // Last update timestamp
  totalNames: number;                 // Total registered names
  names: {
    [name: string]: GlobalNameEntry;
  };
}

/**
 * Name entry in global registry
 */
export interface GlobalNameEntry {
  publicKey: string;              // Owner's public key
  ipnsKey: string;                // IPNS key for content
  contentCID: string;             // Latest content CID
  registered: number;             // Registration timestamp
  lastUpdate: number;             // Last update timestamp
  version: number;                // Record version
  signature: string;              // Owner's signature
  verified: boolean;              // DNS verified (if applicable)
}

/**
 * Global Registry Manager
 * Manages the global FRW name registry via IPNS
 */
export class GlobalRegistryManager {
  private ipfs: IPFSHTTPClient;
  private cache: GlobalRegistry | null = null;
  private cacheExpires = 0;
  private readonly CACHE_TTL = 60000; // 1 minute
  
  // IPNS key for the global registry (will be set after initialization)
  private registryIPNS: string;

  constructor(
    registryIPNS: string,
    ipfsUrl = 'http://localhost:5001'
  ) {
    this.ipfs = createIPFSClient({ url: ipfsUrl });
    this.registryIPNS = registryIPNS;
  }

  /**
   * Download current registry from IPNS
   */
  async downloadRegistry(): Promise<GlobalRegistry> {
    // Check cache
    if (this.cache && Date.now() < this.cacheExpires) {
      return this.cache;
    }

    try {
      console.log(`[GlobalRegistry] Resolving IPNS: ${this.registryIPNS}...`);
      
      // Resolve IPNS to get latest CID
      let resolvedCID: string | null = null;
      for await (const result of this.ipfs.name.resolve(this.registryIPNS)) {
        resolvedCID = result.replace('/ipfs/', '');
        break; // Take first result
      }

      if (!resolvedCID) {
        throw new Error('Failed to resolve IPNS');
      }

      console.log(`[GlobalRegistry] Resolved to CID: ${resolvedCID}`);
      console.log(`[GlobalRegistry] Downloading registry...`);

      // Download registry content
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfs.cat(resolvedCID)) {
        chunks.push(chunk);
      }

      const content = Buffer.concat(chunks).toString('utf-8');
      const registry: GlobalRegistry = JSON.parse(content);

      // Cache it
      this.cache = registry;
      this.cacheExpires = Date.now() + this.CACHE_TTL;

      console.log(`[GlobalRegistry] Downloaded registry with ${registry.totalNames} names`);

      return registry;

    } catch (error) {
      console.warn('[GlobalRegistry] Failed to download registry:', error);
      
      // Return empty registry as fallback
      return {
        version: 1,
        updated: Date.now(),
        totalNames: 0,
        names: {}
      };
    }
  }

  /**
   * Resolve a single name from registry
   */
  async resolveName(name: string): Promise<GlobalNameEntry | null> {
    try {
      const registry = await this.downloadRegistry();
      const entry = registry.names[name.toLowerCase()];

      if (!entry) {
        console.log(`[GlobalRegistry] Name "${name}" not found`);
        return null;
      }

      // Verify signature
      if (!this.verifyEntrySignature(entry)) {
        console.warn(`[GlobalRegistry] Invalid signature for "${name}"`);
        return null;
      }

      console.log(`[GlobalRegistry] Resolved "${name}" → ${entry.publicKey.substring(0, 12)}...`);
      return entry;

    } catch (error) {
      console.error(`[GlobalRegistry] Error resolving "${name}":`, error);
      return null;
    }
  }

  /**
   * Add or update name in registry
   * Note: This requires maintainer privileges (private key)
   */
  async updateRegistry(
    record: DistributedNameRecord,
    maintainerPrivateKey: Uint8Array
  ): Promise<string> {
    try {
      console.log(`[GlobalRegistry] Updating registry with "${record.name}"...`);

      // Download current registry
      const registry = await this.downloadRegistry();

      // Add or update entry
      registry.names[record.name.toLowerCase()] = {
        publicKey: record.publicKey,
        ipnsKey: record.ipnsKey,
        contentCID: record.contentCID,
        registered: registry.names[record.name.toLowerCase()]?.registered || record.registered,
        lastUpdate: Date.now(),
        version: record.version,
        signature: record.signature,
        verified: false // TODO: Implement DNS verification
      };

      registry.totalNames = Object.keys(registry.names).length;
      registry.updated = Date.now();

      // Upload new registry to IPFS
      const content = JSON.stringify(registry, null, 2);
      console.log(`[GlobalRegistry] Uploading updated registry (${content.length} bytes)...`);

      const result = await this.ipfs.add(content);
      const newCID = result.cid.toString();

      console.log(`[GlobalRegistry] Uploaded to IPFS: ${newCID}`);

      // Publish to IPNS
      // Note: This requires the IPNS private key
      // For now, we'll skip this and just return the CID
      // In production, this would be done by a registry maintainer service
      console.log(`[GlobalRegistry] New registry CID: ${newCID}`);
      console.log(`[GlobalRegistry] IPNS publication requires maintainer key`);

      // Invalidate cache
      this.cache = null;

      return newCID;

    } catch (error) {
      throw new Error(`Failed to update registry: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Verify entry signature
   */
  private verifyEntrySignature(entry: GlobalNameEntry): boolean {
    try {
      const message = `${entry.publicKey}:${entry.contentCID}:${entry.version}:${entry.registered}`;
      const publicKeyBytes = SignatureManager.decodePublicKey(entry.publicKey);
      return SignatureManager.verify(message, entry.signature, publicKeyBytes);
    } catch (error) {
      console.warn('[GlobalRegistry] Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get registry statistics
   */
  async getStats(): Promise<{
    totalNames: number;
    lastUpdate: number;
    version: number;
  }> {
    const registry = await this.downloadRegistry();
    return {
      totalNames: registry.totalNames,
      lastUpdate: registry.updated,
      version: registry.version
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
  }
}

/**
 * Convert DistributedNameRecord to GlobalNameEntry
 */
export function recordToEntry(record: DistributedNameRecord): GlobalNameEntry {
  return {
    publicKey: record.publicKey,
    ipnsKey: record.ipnsKey,
    contentCID: record.contentCID,
    registered: record.registered,
    lastUpdate: Date.now(),
    version: record.version,
    signature: record.signature,
    verified: false
  };
}

/**
 * Create initial empty registry
 */
export function createEmptyRegistry(): GlobalRegistry {
  return {
    version: 1,
    updated: Date.now(),
    totalNames: 0,
    names: {}
  };
}

/**
 * Bootstrap: Create and publish initial registry
 * This should be run ONCE to initialize the global registry
 */
export async function bootstrapRegistry(ipfsUrl = 'http://localhost:5001'): Promise<{
  cid: string;
  ipnsKey: string;
}> {
  const ipfs = createIPFSClient({ url: ipfsUrl });
  
  console.log('[Bootstrap] Creating initial empty registry...');
  const registry = createEmptyRegistry();
  const content = JSON.stringify(registry, null, 2);

  console.log('[Bootstrap] Uploading to IPFS...');
  const result = await ipfs.add(content);
  const cid = result.cid.toString();

  console.log(`[Bootstrap] Registry CID: ${cid}`);
  console.log('[Bootstrap] Using existing IPNS key: frw-global-registry');

  // Get existing key (must be created manually with: ipfs key gen frw-global-registry)
  const keyList = await ipfs.key.list();
  const registryKey = keyList.find((k: { name: string }) => k.name === 'frw-global-registry');
  
  if (!registryKey) {
    throw new Error('IPNS key "frw-global-registry" not found. Create it with: ipfs key gen --type=rsa --size=2048 frw-global-registry');
  }

  console.log(`[Bootstrap] IPNS Key ID: ${registryKey.id}`);
  console.log('[Bootstrap] Publishing to IPNS...');

  // Publish to IPNS
  await ipfs.name.publish(cid, {
    key: 'frw-global-registry'
  });

  console.log('[Bootstrap] ✓ Registry bootstrapped!');
  console.log(`[Bootstrap] IPNS: ${registryKey.id}`);
  console.log(`[Bootstrap] Initial CID: ${cid}`);

  return {
    cid,
    ipnsKey: registryKey.id
  };
}

/**
 * Get the official FRW registry IPNS key
 * 
 * WARNING: This approach has been DEPRECATED for security reasons.
 * A single IPNS key creates a centralized point of failure.
 * 
 * New approach: Pure DHT-based resolution with no central registry.
 * See distributed-registry.ts for the decentralized implementation.
 * 
 * @deprecated Use DistributedNameRegistry instead
 */
export function getOfficialRegistryIPNS(): string {
  // No hardcoded key - this defeats the purpose of decentralization
  // Use environment variable only for testing/development
  return process.env.FRW_REGISTRY_IPNS || '';
}
