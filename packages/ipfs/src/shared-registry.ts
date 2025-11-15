// FRW Shared Registry
// Simple, distributed name registry using IPFS + Pubsub

import { create as createIPFSClient, IPFSHTTPClient } from 'ipfs-http-client';
import { SignatureManager } from '@frw/crypto';
import type { ProofOfWork } from '@frw/name-registry';

/**
 * Name entry in shared registry
 */
export interface NameEntry {
  name: string;
  publicKey: string;
  ipnsKey: string;
  cid?: string;           // Latest content CID
  registered: number;     // Timestamp
  lastUpdate: number;     // Timestamp
  signature: string;      // Signature proving ownership
  proof?: ProofOfWork;    // Proof of work (optional for verification)
}

/**
 * Shared registry structure
 */
export interface SharedRegistry {
  version: number;
  updated: number;
  names: {
    [name: string]: NameEntry;
  };
}

/**
 * Registry update message (sent via pubsub)
 */
interface RegistryUpdate {
  type: 'registry-update';
  cid: string;            // New registry CID
  timestamp: number;
  signature: string;      // Signature by updater
}

/**
 * Shared Registry Manager
 * Manages a shared JSON registry on IPFS with pubsub updates
 */
export class SharedRegistryManager {
  private ipfs: IPFSHTTPClient;
  private cache: SharedRegistry | null = null;
  private cacheExpires = 0;
  private readonly CACHE_TTL = 60000; // 1 minute
  private readonly PUBSUB_TOPIC = 'frw-registry-updates';
  
  // Bootstrap registry CID (will be updated via pubsub)
  private currentRegistryCID: string;

  constructor(
    bootstrapCID: string = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn', // Default empty registry
    ipfsUrl = 'http://localhost:5001'
  ) {
    this.ipfs = createIPFSClient({ url: ipfsUrl });
    this.currentRegistryCID = bootstrapCID;
    
    // Start listening for updates
    this.startListening();
  }

  /**
   * Get current registry CID
   */
  getCurrentCID(): string {
    return this.currentRegistryCID;
  }

  /**
   * Set registry CID (for manual updates)
   */
  setCurrentCID(cid: string): void {
    this.currentRegistryCID = cid;
    this.cache = null; // Invalidate cache
  }

  /**
   * Download and parse registry from IPFS
   */
  async downloadRegistry(): Promise<SharedRegistry> {
    // Check cache first
    if (this.cache && Date.now() < this.cacheExpires) {
      return this.cache;
    }

    try {
      console.log(`[SharedRegistry] Downloading from ${this.currentRegistryCID}...`);
      
      // Download from IPFS
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfs.cat(this.currentRegistryCID)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks).toString('utf-8');
      const registry: SharedRegistry = JSON.parse(content);
      
      // Cache it
      this.cache = registry;
      this.cacheExpires = Date.now() + this.CACHE_TTL;
      
      console.log(`[SharedRegistry] Downloaded ${Object.keys(registry.names).length} names`);
      
      return registry;
    } catch (error) {
      console.error('[SharedRegistry] Failed to download:', error);
      
      // Return empty registry as fallback
      return {
        version: 1,
        updated: Date.now(),
        names: {}
      };
    }
  }

  /**
   * Resolve a name to its entry
   */
  async resolveName(name: string): Promise<NameEntry | null> {
    try {
      const registry = await this.downloadRegistry();
      const entry = registry.names[name.toLowerCase()];
      
      if (!entry) {
        console.log(`[SharedRegistry] Name "${name}" not found`);
        return null;
      }
      
      // Verify signature
      if (!this.verifyEntrySignature(entry)) {
        console.warn(`[SharedRegistry] Invalid signature for "${name}"`);
        return null;
      }
      
      console.log(`[SharedRegistry] Resolved "${name}" → ${entry.publicKey.substring(0, 12)}...`);
      return entry;
    } catch (error) {
      console.error(`[SharedRegistry] Error resolving "${name}":`, error);
      return null;
    }
  }

  /**
   * Add or update a name in the registry
   * Returns the new registry CID
   */
  async updateRegistry(entry: NameEntry): Promise<string> {
    try {
      console.log(`[SharedRegistry] Updating registry with "${entry.name}"...`);
      
      // Download current registry
      const registry = await this.downloadRegistry();
      
      // Add or update entry
      registry.names[entry.name.toLowerCase()] = entry;
      registry.updated = Date.now();
      
      // Upload new registry to IPFS
      const content = JSON.stringify(registry, null, 2);
      const result = await this.ipfs.add(content);
      const newCID = result.cid.toString();
      
      console.log(`[SharedRegistry] New registry CID: ${newCID}`);
      
      // Update local CID
      this.currentRegistryCID = newCID;
      this.cache = registry;
      this.cacheExpires = Date.now() + this.CACHE_TTL;
      
      // Broadcast update via pubsub
      await this.broadcastUpdate(newCID);
      
      return newCID;
    } catch (error) {
      throw new Error(`Failed to update registry: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Broadcast registry update via pubsub
   */
  private async broadcastUpdate(newCID: string): Promise<void> {
    try {
      const update = {
        type: 'registry-update',
        cid: newCID,
        timestamp: Date.now(),
        signature: '' // Future v1.1: Sign with registry key (optional, individual names are already signed)
      };
      
      const message = JSON.stringify(update);
      await this.ipfs.pubsub.publish(this.PUBSUB_TOPIC, Buffer.from(message));
      
      console.log(`[SharedRegistry] Broadcast update: ${newCID}`);
    } catch (error) {
      console.warn('[SharedRegistry] Failed to broadcast update:', error);
      // Non-critical error, registry still updated
    }
  }

  /**
   * Listen for registry updates via pubsub
   */
  private async startListening(): Promise<void> {
    try {
      console.log('[SharedRegistry] Subscribing to updates...');
      
      await this.ipfs.pubsub.subscribe(this.PUBSUB_TOPIC, (msg) => {
        this.handleUpdate(msg);
      });
      
      console.log('[SharedRegistry] Listening for updates');
    } catch (error) {
      console.warn('[SharedRegistry] Failed to subscribe to updates:', error);
      // Non-critical, will work with manual polling
    }
  }

  /**
   * Handle incoming registry update
   */
  private handleUpdate(msg: any): void {
    try {
      const update: RegistryUpdate = JSON.parse(msg.data.toString());
      
      if (update.type === 'registry-update' && update.cid !== this.currentRegistryCID) {
        console.log(`[SharedRegistry] Received update: ${update.cid}`);
        
        // Update CID and invalidate cache
        this.currentRegistryCID = update.cid;
        this.cache = null;
        
        // Trigger download in background (don't await)
        this.downloadRegistry().catch(err => {
          console.warn('[SharedRegistry] Failed to download updated registry:', err);
        });
      }
    } catch (error) {
      console.warn('[SharedRegistry] Failed to parse update:', error);
    }
  }

  /**
   * Verify entry signature
   */
  private verifyEntrySignature(entry: NameEntry): boolean {
    try {
      const message = `${entry.name}:${entry.publicKey}:${entry.registered}`;
      const publicKeyBytes = SignatureManager.decodePublicKey(entry.publicKey);
      
      return SignatureManager.verify(message, entry.signature, publicKeyBytes);
    } catch (error) {
      console.warn('[SharedRegistry] Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get all names registered by a public key
   */
  async getNamesByPublicKey(publicKey: string): Promise<string[]> {
    const registry = await this.downloadRegistry();
    
    return Object.keys(registry.names).filter(
      name => registry.names[name].publicKey === publicKey
    );
  }

  /**
   * Check if a name exists
   */
  async nameExists(name: string): Promise<boolean> {
    const entry = await this.resolveName(name);
    return entry !== null;
  }
}

/**
 * Create a signed name entry
 */
export function createNameEntry(
  name: string,
  publicKey: string,
  ipnsKey: string,
  privateKey: Uint8Array,
  cid?: string,
  proof?: ProofOfWork
): NameEntry {
  const registered = Date.now();
  const message = `${name}:${publicKey}:${registered}`;
  const signature = SignatureManager.sign(message, privateKey);
  
  return {
    name,
    publicKey,
    ipnsKey,
    cid,
    registered,
    lastUpdate: registered,
    signature,
    proof
  };
}

/**
 * Get the bootstrap registry CID
 * This is the initial registry that all clients start with
 */
export function getBootstrapRegistryCID(): string {
  // This will be set to the actual bootstrap CID once we create it
  // For now, return a placeholder
  return process.env.FRW_REGISTRY_CID || 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn';
}
