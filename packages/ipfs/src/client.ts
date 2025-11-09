import { create, type IPFSHTTPClient } from 'ipfs-http-client';
import type { IPFSConfig, IPFSAddResult } from '@frw/common';
import { IPFSError } from '@frw/common';

export class IPFSClient {
  private client: IPFSHTTPClient | null = null;
  private ready = false;

  constructor(private config: IPFSConfig) {}

  async init(): Promise<boolean> {
    try {
      this.client = create({
        host: this.config.host,
        port: this.config.port,
        protocol: this.config.protocol
      });
      await this.client.id();
      this.ready = true;
      return true;
    } catch (error) {
      throw new IPFSError('IPFS initialization failed', error);
    }
  }

  async add(content: string | Buffer): Promise<IPFSAddResult> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    
    const result = await this.client.add(content);
    return {
      cid: result.cid.toString(),
      size: result.size
    };
  }

  async addFile(path: string, content: Buffer): Promise<string> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    
    const result = await this.client.add({ path, content });
    return result.cid.toString();
  }

  async addDirectory(files: Array<{ path: string; content: Buffer }>): Promise<string> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    
    let rootCid = '';
    for await (const result of this.client.addAll(files, { wrapWithDirectory: true })) {
      rootCid = result.cid.toString();
    }
    return rootCid;
  }

  async get(cid: string): Promise<Buffer> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    
    const chunks: Uint8Array[] = [];
    for await (const chunk of this.client.cat(cid)) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async getFile(cid: string, path: string): Promise<Buffer> {
    const fullPath = `${cid}/${path}`;
    return this.get(fullPath);
  }

  async pin(cid: string): Promise<void> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    await this.client.pin.add(cid);
  }

  async unpin(cid: string): Promise<void> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    await this.client.pin.rm(cid);
  }

  async listPins(): Promise<string[]> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    
    const pins: string[] = [];
    for await (const { cid } of this.client.pin.ls()) {
      pins.push(cid.toString());
    }
    return pins;
  }

  async resolveName(name: string): Promise<string> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    
    for await (const result of this.client.name.resolve(name)) {
      return result.replace('/ipfs/', '');
    }
    throw new IPFSError('IPNS resolution returned no results');
  }

  async publishName(cid: string, key = 'self'): Promise<string> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    
    const result = await this.client.name.publish(cid, { key });
    return result.name;
  }

  async exists(cid: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
        break;
      }
      return chunks.length > 0;
    } catch {
      return false;
    }
  }

  async getNodeInfo(): Promise<unknown> {
    if (!this.ready || !this.client) {
      throw new IPFSError('IPFS client not initialized');
    }
    return this.client.id();
  }
}
