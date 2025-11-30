#!/usr/bin/env node
// FRW Bootstrap Index Node
// Maintains global index of FRW names for fast resolution
// Can be run by anyone in the community

import { create as createIPFSClient } from 'ipfs-http-client';
import express from 'express';
import cors from 'cors';
import type { DistributedNameRecord } from '@frw/ipfs';
import { verifyProof, getRequiredDifficulty } from '@frw/name-registry';
import { SignatureManager } from '@frw/crypto';
import { V2RecordManager, createUnifiedResponse } from './v2-support.js';
import type { DistributedNameRecordV2 } from '@frw/protocol-v2';
import { fromJSON, toJSON } from '@frw/protocol-v2';

interface IndexEntry {
  name: string;
  publicKey: string;
  contentCID: string;
  ipnsKey: string;
  timestamp: number;
  signature: string;
}

class BootstrapIndexNode {
  private ipfs: any;
  private index: Map<string, IndexEntry>;
  private v2Manager: V2RecordManager;
  private app: express.Application;
  private nodeId: string;
  private lastPublished: number = 0;

  private readonly IPFS_URL = process.env.IPFS_URL || 'http://localhost:5001';
  private readonly HTTP_PORT = parseInt(process.env.HTTP_PORT || '3100');
  private readonly PUBLISH_INTERVAL = 3600000; // 1 hour
  private readonly PUBSUB_TOPIC = 'frw/names/updates/v1';
  private readonly SYNC_TOPIC = 'frw/sync/requests/v1';

  // Bootstrap nodes - seed nodes for the network
  private readonly BOOTSTRAP_NODES = [
    'http://83.228.214.189:3100',
    'http://83.228.213.45:3100',
    'http://83.228.213.240:3100',
    'http://83.228.214.72:3100',
    "http://155.117.46.244:3100",
    "http://165.73.244.107:3100",
    "http://165.73.244.74:3100",
    'http://localhost:3100'
  ];

  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.index = new Map();
    this.v2Manager = new V2RecordManager();
    this.app = express();
    this.ipfs = createIPFSClient({ url: this.IPFS_URL });

    this.setupExpress();
  }

  /**
   * Start the bootstrap node
   */
  async start(): Promise<void> {
    console.log(`[Bootstrap] Starting FRW Bootstrap Node: ${this.nodeId}`);
    console.log(`[Bootstrap] IPFS: ${this.IPFS_URL}`);
    console.log(`[Bootstrap] HTTP: ${this.HTTP_PORT}`);

    // Test IPFS connection
    try {
      const version = await this.ipfs.version();
      console.log(`[Bootstrap] ✓ Connected to IPFS ${version.version}`);
    } catch (error) {
      console.error('[Bootstrap] ✗ Failed to connect to IPFS:', error);
      process.exit(1);
    }

    // Subscribe to pubsub
    await this.subscribeToPubsub();

    // Sync with other nodes on startup
    await this.syncWithNetwork();

    // Start HTTP server
    this.app.listen(this.HTTP_PORT, '0.0.0.0', () => {
      console.log(`[Bootstrap] ✓ HTTP server listening on port ${this.HTTP_PORT}`);
    });

    // Periodic index publishing
    setInterval(() => this.publishIndex(), this.PUBLISH_INTERVAL);

    // Publish initial index
    await this.publishIndex();

    console.log('[Bootstrap] ✓ Bootstrap node ready!');
    console.log(`[Bootstrap] Node ID: ${this.nodeId}`);
    console.log(`[Bootstrap] API: http://localhost:${this.HTTP_PORT}`);
  }

  /**
   * Setup Express routes
   */
  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      const v2Stats = this.v2Manager.getStats();
      res.json({
        status: 'ok',
        nodeId: this.nodeId,
        v1IndexSize: this.index.size,
        v2IndexSize: v2Stats.totalV2Records,
        pqSecureRecords: v2Stats.pqSecureRecords,
        lastPublished: this.lastPublished,
        uptime: process.uptime()
      });
    });

    // Get all names
    this.app.get('/api/names', (req, res) => {
      const names = Array.from(this.index.entries()).map(([name, entry]) => ({
        name,
        publicKey: entry.publicKey,
        contentCID: entry.contentCID,
        timestamp: entry.timestamp
      }));

      res.json({
        count: names.length,
        names
      });
    });

    // Resolve single name (V1 or V2)
    this.app.get('/api/resolve/:name', (req, res): void => {
      const { name } = req.params;
      const lowerName = name.toLowerCase();

      // Try V2 first (newest format)
      const v2Entry = this.v2Manager.getRecord(lowerName);
      if (v2Entry) {
        res.json(createUnifiedResponse(v2Entry, 2, this.nodeId));
        return;
      }

      // Fallback to V1
      const v1Entry = this.index.get(lowerName);
      if (v1Entry) {
        res.json(createUnifiedResponse(v1Entry, 1, this.nodeId));
        return;
      }

      // Not found
      res.status(404).json({
        error: 'Name not found',
        name
      });
    });

    // Submit new name (backup to pubsub)
    this.app.post('/api/submit', async (req, res): Promise<void> => {
      try {
        const record: DistributedNameRecord = req.body;

        // Validate record
        if (!record.name || !record.publicKey || !record.signature || !record.proof) {
          res.status(400).json({
            error: 'Invalid record: missing required fields'
          });
          return;
        }

        // CRITICAL: Verify Proof of Work
        const powValid = verifyProof(record.name, record.publicKey, record.proof);
        if (!powValid) {
          res.status(400).json({
            error: 'Invalid proof of work',
            name: record.name
          });
          return;
        }

        // Verify POW difficulty matches name requirements
        const requiredDifficulty = getRequiredDifficulty(record.name);
        if (record.proof.difficulty < requiredDifficulty) {
          res.status(400).json({
            error: `Insufficient POW difficulty: expected ${requiredDifficulty}, got ${record.proof.difficulty}`,
            name: record.name
          });
          return;
        }

        // CRITICAL: Verify cryptographic signature
        try {
          const message = `${record.name}:${record.publicKey}:${record.contentCID}:${record.version}:${record.registered}`;
          const publicKeyBytes = SignatureManager.decodePublicKey(record.publicKey);
          const signatureValid = SignatureManager.verify(message, record.signature, publicKeyBytes);

          if (!signatureValid) {
            res.status(400).json({
              error: 'Invalid signature',
              name: record.name
            });
            return;
          }
        } catch (error) {
          res.status(400).json({
            error: 'Signature verification failed',
            details: error instanceof Error ? error.message : 'Unknown'
          });
          return;
        }

        // Add to index (now that it's fully validated)
        this.addToIndex(record);

        // Broadcast via pubsub
        await this.ipfs.pubsub.publish(
          this.PUBSUB_TOPIC,
          Buffer.from(JSON.stringify({
            type: 'name-register',
            record,
            submittedBy: this.nodeId,
            timestamp: Date.now()
          }))
        );

        res.json({
          success: true,
          name: record.name,
          message: 'Name registered and broadcasted'
        });

      } catch (error) {
        res.status(500).json({
          error: 'Failed to submit name',
          details: error instanceof Error ? error.message : 'Unknown'
        });
        return;
      }
    });

    // Submit V2 record (quantum-resistant)
    this.app.post('/api/submit/v2', async (req, res): Promise<void> => {
      try {
        // Use official protocol deserialization
        const record: DistributedNameRecordV2 = fromJSON(JSON.stringify(req.body));

        // Validate basic structure
        if (!record.name || !record.publicKey_dilithium3 || !record.did || !record.proof_v2) {
          res.status(400).json({
            error: 'Invalid V2 record: missing required fields'
          });
          return;
        }

        // Add to V2 index (verification happens inside)
        const success = await this.v2Manager.addRecord(record);

        if (!success) {
          res.status(400).json({
            error: 'V2 record validation failed',
            name: record.name
          });
          return;
        }

        // Try to broadcast via V2 pubsub (non-critical, may fail if pubsub disabled)
        try {
          const recordJSON = toJSON(record);
          await this.ipfs.pubsub.publish(
            this.v2Manager.getPubsubTopic(),
            Buffer.from(JSON.stringify({
              type: 'name-register-v2',
              record: JSON.parse(recordJSON),  // Already serialized
              submittedBy: this.nodeId,
              timestamp: Date.now()
            }))
          );
          console.log(`[V2] 📡 Broadcasted ${record.name} via pubsub`);
        } catch (pubsubError: any) {
          console.log(`[V2] ⚠ Pubsub broadcast failed (non-critical):`, pubsubError?.message || 'Unknown');
        }

        res.json({
          success: true,
          name: record.name,
          did: record.did,
          message: 'V2 name registered successfully'
        });

      } catch (error) {
        res.status(500).json({
          error: 'Failed to submit V2 name',
          details: error instanceof Error ? error.message : 'Unknown'
        });
        return;
      }
    });

    // Get index CID (for IPFS fallback)
    this.app.get('/api/index/cid', (req, res) => {
      res.json({
        nodeId: this.nodeId,
        lastPublished: this.lastPublished,
        message: 'Index CID will be available after first publish'
      });
    });

    // Statistics
    this.app.get('/api/stats', (req, res) => {
      res.json({
        nodeId: this.nodeId,
        totalNames: this.index.size,
        lastPublished: this.lastPublished,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        ipfsUrl: this.IPFS_URL
      });
    });
  }

  /**
   * Subscribe to IPFS pubsub for name updates
   */
  private async subscribeToPubsub(): Promise<void> {
    try {
      // Subscribe to V1 updates
      await this.ipfs.pubsub.subscribe(this.PUBSUB_TOPIC, (msg: any) => {
        this.handlePubsubMessage(msg);
      });
      console.log(`[Bootstrap] ✓ Subscribed to V1 pubsub: ${this.PUBSUB_TOPIC}`);

      // Subscribe to V2 updates
      await this.ipfs.pubsub.subscribe(this.v2Manager.getPubsubTopic(), (msg: any) => {
        this.handleV2PubsubMessage(msg);
      });
      console.log(`[Bootstrap] ✓ Subscribed to V2 pubsub: ${this.v2Manager.getPubsubTopic()}`);

    } catch (error) {
      console.error('[Bootstrap] ✗ Failed to subscribe to pubsub:', error);
    }
  }

  /**
   * Handle incoming pubsub message
   */
  private handlePubsubMessage(msg: any): void {
    try {
      const data = JSON.parse(msg.data.toString());

      if (data.type === 'name-register' && data.record) {
        const record: DistributedNameRecord = data.record;

        // CRITICAL: Verify POW before accepting from pubsub
        if (!this.validateRecord(record)) {
          console.warn(`[Bootstrap] ⚠ Invalid record rejected from pubsub: ${record.name}`);
          return;
        }

        this.addToIndex(record);
        console.log(`[Bootstrap] 📥 Received name via pubsub: ${record.name}`);
      }

      if (data.type === 'name-update' && data.record) {
        const record: DistributedNameRecord = data.record;

        // CRITICAL: Verify POW before accepting update
        if (!this.validateRecord(record)) {
          console.warn(`[Bootstrap] ⚠ Invalid update rejected from pubsub: ${record.name}`);
          return;
        }

        this.addToIndex(record); // addToIndex handles updates too
        console.log(`[Bootstrap] 📥 Received update via pubsub: ${record.name}`);
      }

      if (data.type === 'sync-request' && data.requesterId !== this.nodeId) {
        // Another node wants our index
        this.sendIndexSnapshot(data.requesterId);
      }

      if (data.type === 'index-snapshot' && data.nodeId !== this.nodeId) {
        // Received index from another node
        this.mergeIndex(data.names);
      }

    } catch (error) {
      console.error('[Bootstrap] Error handling pubsub message:', error);
    }
  }

  /**
   * Handle incoming V2 pubsub message
   */
  private async handleV2PubsubMessage(msg: any): Promise<void> {
    try {
      const data = JSON.parse(msg.data.toString());

      if (data.type === 'name-register-v2' && data.record) {
        const record: DistributedNameRecordV2 = data.record;

        // Verification happens inside addRecord
        const success = await this.v2Manager.addRecord(record);
        if (success) {
          console.log(`[Bootstrap] 📥 Received V2 name via pubsub: ${record.name}`);
        } else {
          console.warn(`[Bootstrap] ⚠ Invalid V2 record rejected from pubsub: ${record.name}`);
        }
      }

    } catch (error) {
      console.error('[Bootstrap] Error handling V2 pubsub message:', error);
    }
  }

  /**
   * Validate V1 record
   */
  private validateRecord(record: DistributedNameRecord): boolean {
    // Check required fields
    if (!record.name || !record.publicKey || !record.signature || !record.proof) {
      return false;
    }

    // Verify Proof of Work
    const powValid = verifyProof(record.name, record.publicKey, record.proof);
    if (!powValid) {
      return false;
    }

    // Verify POW difficulty
    const requiredDifficulty = getRequiredDifficulty(record.name);
    if (record.proof.difficulty < requiredDifficulty) {
      return false;
    }

    // Verify signature
    try {
      const message = `${record.name}:${record.publicKey}:${record.contentCID}:${record.version}:${record.registered}`;
      const publicKeyBytes = SignatureManager.decodePublicKey(record.publicKey);
      return SignatureManager.verify(message, record.signature, publicKeyBytes);
    } catch {
      return false;
    }
  }

  /**
   * Add name to index (or update if exists)
   */
  private addToIndex(record: DistributedNameRecord): void {
    const key = record.name.toLowerCase();
    const existing = this.index.get(key);

    // Only update if timestamp is newer or doesn't exist
    if (!existing || record.registered >= existing.timestamp) {
      const entry: IndexEntry = {
        name: record.name,
        publicKey: record.publicKey,
        contentCID: record.contentCID,
        ipnsKey: record.ipnsKey,
        timestamp: record.registered,
        signature: record.signature
      };

      this.index.set(key, entry);
      console.log(`[Bootstrap] ✓ ${existing ? 'Updated' : 'Added'} index: ${record.name} (${this.index.size} total)`);
    }
  }

  /**
   * Publish index to IPFS
   */
  private async publishIndex(): Promise<void> {
    try {
      console.log(`[Bootstrap] Publishing index (${this.index.size} names)...`);

      const indexData = {
        version: 1,
        nodeId: this.nodeId,
        published: Date.now(),
        totalNames: this.index.size,
        names: Object.fromEntries(this.index)
      };

      const content = JSON.stringify(indexData, null, 2);
      const result = await this.ipfs.add(content);
      const cid = result.cid.toString();

      this.lastPublished = Date.now();

      console.log(`[Bootstrap] ✓ Index published to IPFS: ${cid}`);
      console.log(`[Bootstrap] Access via: http://localhost:8080/ipfs/${cid}`);

      // Announce on pubsub
      await this.ipfs.pubsub.publish(
        'frw/index/updates',
        Buffer.from(JSON.stringify({
          type: 'index-update',
          nodeId: this.nodeId,
          cid,
          nameCount: this.index.size,
          timestamp: Date.now()
        }))
      );

    } catch (error) {
      console.error('[Bootstrap] ✗ Failed to publish index:', error);
    }
  }

  /**
   * Sync with other nodes on startup
   */
  private async syncWithNetwork(): Promise<void> {
    console.log('[Bootstrap] 🔄 Requesting sync from network...');

    try {
      // Subscribe to sync responses
      await this.ipfs.pubsub.subscribe(this.SYNC_TOPIC, (msg: any) => {
        this.handlePubsubMessage(msg);
      });

      // Request index from other nodes
      await this.ipfs.pubsub.publish(
        this.SYNC_TOPIC,
        Buffer.from(JSON.stringify({
          type: 'sync-request',
          requesterId: this.nodeId,
          timestamp: Date.now()
        }))
      );

      // Also try HTTP sync with known bootstrap nodes
      for (const nodeUrl of this.BOOTSTRAP_NODES) {
        if (nodeUrl.includes('localhost')) continue; // Skip self

        try {
          const response = await fetch(`${nodeUrl}/api/names`);
          if (response.ok) {
            const data = await response.json() as { count: number; names: { name: string; publicKey: string; contentCID: string; timestamp: number }[] };
            console.log(`[Bootstrap] 📥 Synced ${data.names.length} names from ${nodeUrl}`);
            // Merge into our index
            for (const name of data.names) {
              this.index.set(name.name.toLowerCase(), {
                name: name.name,
                publicKey: name.publicKey,
                contentCID: name.contentCID,
                ipnsKey: '', // Will be filled from full record if available
                timestamp: name.timestamp,
                signature: ''
              });
            }
          }
        } catch (error) {
          // Node might be offline, continue
        }
      }

    } catch (error) {
      console.warn('[Bootstrap] Sync failed (will operate independently):', error);
    }
  }

  /**
   * Send our index to a requesting node
   */
  private async sendIndexSnapshot(requesterId: string): Promise<void> {
    try {
      const snapshot = {
        type: 'index-snapshot',
        nodeId: this.nodeId,
        requesterId,
        timestamp: Date.now(),
        nameCount: this.index.size,
        names: Object.fromEntries(this.index)
      };

      await this.ipfs.pubsub.publish(
        this.SYNC_TOPIC,
        Buffer.from(JSON.stringify(snapshot))
      );

      console.log(`[Bootstrap] 📤 Sent index snapshot to ${requesterId} (${this.index.size} names)`);
    } catch (error) {
      console.warn('[Bootstrap] Failed to send index snapshot:', error);
    }
  }

  /**
   * Merge received index into ours
   */
  private mergeIndex(names: Record<string, IndexEntry>): void {
    let newCount = 0;
    let updatedCount = 0;

    for (const [key, entry] of Object.entries(names)) {
      const existing = this.index.get(key);

      if (!existing) {
        this.index.set(key, entry);
        newCount++;
      } else if (entry.timestamp > existing.timestamp) {
        this.index.set(key, entry);
        updatedCount++;
      }
    }

    if (newCount > 0 || updatedCount > 0) {
      console.log(`[Bootstrap] 📥 Merged index: +${newCount} new, ${updatedCount} updated (${this.index.size} total)`);
    }
  }
}

// Start node
const nodeId = process.env.NODE_ID || `bootstrap-${Date.now()}`;
const node = new BootstrapIndexNode(nodeId);

node.start().catch(error => {
  console.error('[Bootstrap] Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Bootstrap] Shutting down gracefully...');
  process.exit(0);
});
