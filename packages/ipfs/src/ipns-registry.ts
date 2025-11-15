// FRW IPNS Registry
// Centralized registry published via IPNS for name resolution fallback

import { create as createIPFSClient, IPFSHTTPClient } from 'ipfs-http-client';
import { SignatureManager } from '@frw/crypto';
import type { NameRecord } from './dht.js';

/**
 * Registry structure stored in IPNS
 */
export interface Registry {
  version: number;
  updated: number;  // Unix timestamp
  names: {
    [name: string]: RegistryEntry;
  };
}

/**
 * Single name entry in registry
 */
export interface RegistryEntry {
  publicKey: string;
  ipnsKey: string;
  registered: number;
  lastUpdate: number;
  cid?: string;  // Optional: latest content CID
}

/**
 * IPNS Registry Manager
 * Manages a centralized registry published to IPNS
 * This serves as fallback when DHT is unavailable
 */
export class IPNSRegistryManager {
  private ipfs: IPFSHTTPClient;
  private registryIPNS: string | null = null;

  constructor(ipfsUrl = 'http://localhost:5001') {
    this.ipfs = createIPFSClient({ url: ipfsUrl });
  }

  /**
   * Set the IPNS key for the registry
   */
  setRegistryKey(ipnsKey: string): void {
    this.registryIPNS = ipnsKey;
  }

  /**
   * Download and parse the current registry
   */
  async downloadRegistry(): Promise<Registry> {
    if (!this.registryIPNS) {
      throw new Error('Registry IPNS key not set');
    }

    try {
      console.log(`[Registry] Resolving IPNS key: ${this.registryIPNS}...`);
      
      // Resolve IPNS to get latest CID
      const resolved = await this.resolveIPNS(this.registryIPNS);
      
      console.log(`[Registry] Downloading from ${resolved}...`);
      
      // Download content
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfs.cat(resolved)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks).toString('utf-8');
      const registry: Registry = JSON.parse(content);
      
      console.log(`[Registry] Downloaded registry with ${Object.keys(registry.names).length} names`);
      
      return registry;
    } catch (error) {
      console.warn('[Registry] Failed to download registry, creating new one:', error);
      
      // Return empty registry if download fails
      return {
        version: 1,
        updated: Date.now(),
        names: {}
      };
    }
  }

  /**
   * Resolve a single name from the registry
   */
  async resolveName(name: string): Promise<RegistryEntry | null> {
    try {
      const registry = await this.downloadRegistry();
      return registry.names[name.toLowerCase()] || null;
    } catch (error) {
      console.error('[Registry] Failed to resolve name:', error);
      return null;
    }
  }

  /**
   * Get all names registered by a public key
   */
  async getNamesByPublicKey(publicKey: string): Promise<string[]> {
    try {
      const registry = await this.downloadRegistry();
      
      return Object.keys(registry.names).filter(
        name => registry.names[name].publicKey === publicKey
      );
    } catch (error) {
      console.error('[Registry] Failed to get names by public key:', error);
      return [];
    }
  }

  /**
   * Export registry as JSON string
   */
  exportRegistry(registry: Registry): string {
    return JSON.stringify(registry, null, 2);
  }

  /**
   * Resolve IPNS key to CID
   */
  private async resolveIPNS(ipnsKey: string): Promise<string> {
    // Try to resolve IPNS
    for await (const result of this.ipfs.name.resolve(ipnsKey)) {
      // result is like "/ipfs/QmXxx..."
      return result.replace('/ipfs/', '');
    }
    
    throw new Error('Failed to resolve IPNS key');
  }
}

/**
 * Registry Publisher
 * Publishes updated registry to IPNS
 * This should only be used by authorized registry maintainers
 */
export class IPNSRegistryPublisher {
  private ipfs: IPFSHTTPClient;
  private privateKey: Uint8Array;
  private publicKey: string;

  constructor(
    privateKey: Uint8Array,
    publicKey: string,
    ipfsUrl = 'http://localhost:5001'
  ) {
    this.ipfs = createIPFSClient({ url: ipfsUrl });
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  /**
   * Add a name to the registry and publish
   */
  async addName(name: string, record: NameRecord): Promise<string> {
    // Download current registry
    const manager = new IPNSRegistryManager();
    manager.setRegistryKey(this.publicKey);
    
    const registry = await manager.downloadRegistry();

    // Add new entry
    registry.names[name.toLowerCase()] = {
      publicKey: record.publicKey,
      ipnsKey: record.ipnsKey,
      registered: record.timestamp,
      lastUpdate: Date.now()
    };

    registry.updated = Date.now();

    // Publish updated registry
    return await this.publishRegistry(registry);
  }

  /**
   * Update an existing name's content CID
   */
  async updateNameContent(name: string, cid: string): Promise<string> {
    const manager = new IPNSRegistryManager();
    manager.setRegistryKey(this.publicKey);
    
    const registry = await manager.downloadRegistry();

    const entry = registry.names[name.toLowerCase()];
    if (!entry) {
      throw new Error(`Name "${name}" not found in registry`);
    }

    entry.cid = cid;
    entry.lastUpdate = Date.now();
    registry.updated = Date.now();

    return await this.publishRegistry(registry);
  }

  /**
   * Publish registry to IPFS and update IPNS
   */
  async publishRegistry(registry: Registry): Promise<string> {
    try {
      console.log(`[Registry] Publishing registry with ${Object.keys(registry.names).length} names...`);

      // Convert to JSON
      const content = JSON.stringify(registry, null, 2);

      // Upload to IPFS
      const result = await this.ipfs.add(content);
      const cid = result.cid.toString();

      console.log(`[Registry] Uploaded to IPFS: ${cid}`);

      // Publish to IPNS (this makes it resolvable via the public key)
      console.log(`[Registry] Publishing to IPNS...`);
      
      // Note: In real implementation, we'd need to manage IPNS keys properly
      // For now, this is a placeholder - IPNS publishing requires key management
      console.warn('[Registry] IPNS publishing requires additional key management setup');
      
      return cid;
    } catch (error) {
      throw new Error(`Failed to publish registry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Get the official FRW registry IPNS key
 * This should be hardcoded and known to all clients
 * 
 * Note: IPNS is a future feature for v2.0
 * Current system uses CID-based addressing + bootstrap nodes (works great)
 * This function is here for future IPNS support
 */
export function getOfficialRegistryKey(): string {
  // Future v2.0: Set official IPNS key for mutable registry
  // Current system doesn't need this - bootstrap nodes maintain the index
  return process.env.FRW_REGISTRY_IPNS || '';
}
