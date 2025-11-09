import type { FRWContent } from '@frw/common';
import { ContentNotFoundError, ProtocolError } from '@frw/common';
import { SignatureManager } from '@frw/crypto';
import { FRWParser } from './parser.js';

interface IPFSClientLike {
  resolveName(name: string): Promise<string>;
  getFile(cid: string, path: string): Promise<Buffer>;
}

export class FRWResolver {
  private cache: Map<string, FRWContent>;

  constructor(private ipfs: IPFSClientLike) {
    this.cache = new Map();
  }

  async resolve(url: string): Promise<FRWContent> {
    const { publicKey, path } = FRWParser.parse(url);
    
    const cacheKey = `${publicKey}${path}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let cid: string;
    try {
      cid = await this.ipfs.resolveName(publicKey);
    } catch (error) {
      throw new ProtocolError(`Failed to resolve IPNS name: ${publicKey}`, error);
    }

    let content: Buffer;
    try {
      const filePath = path.startsWith('/') ? path.slice(1) : path;
      content = await this.ipfs.getFile(cid, filePath);
    } catch (error) {
      throw new ContentNotFoundError(`Content not found: ${path}`, error);
    }

    const publicKeyBytes = SignatureManager.decodePublicKey(publicKey);
    const htmlContent = content.toString('utf-8');
    const verified = SignatureManager.verifyPage(htmlContent, publicKeyBytes);

    const result: FRWContent = {
      content,
      metadata: {
        version: '',
        author: publicKey,
        date: new Date().toISOString(),
        signature: SignatureManager.extractSignature(htmlContent) || ''
      },
      verified
    };
    
    this.cache.set(cacheKey, result);
    
    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }

  invalidate(url: string): void {
    const { publicKey, path } = FRWParser.parse(url);
    const cacheKey = `${publicKey}${path}`;
    this.cache.delete(cacheKey);
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
