import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as crypto from 'crypto';
import type { FRWKeyPair } from '@frw/common';
import { SignatureError, HASH_ALGORITHM } from '@frw/common';

export class SignatureManager {
  static generateKeyPair(): FRWKeyPair {
    const keyPair = nacl.sign.keyPair();
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
  }

  static sign(content: string | Buffer, privateKey: Uint8Array): string {
    try {
      const hash = crypto.createHash(HASH_ALGORITHM).update(content).digest();
      const signature = nacl.sign.detached(hash, privateKey);
      return Buffer.from(signature).toString('base64');
    } catch (error) {
      throw new SignatureError('Failed to sign content', error);
    }
  }

  static verify(
    content: string | Buffer,
    signature: string,
    publicKey: Uint8Array
  ): boolean {
    try {
      const hash = crypto.createHash(HASH_ALGORITHM).update(content).digest();
      const sig = Buffer.from(signature, 'base64');
      return nacl.sign.detached.verify(hash, sig, publicKey);
    } catch {
      return false;
    }
  }

  static encodePublicKey(publicKey: Uint8Array): string {
    return bs58.encode(Buffer.from(publicKey));
  }

  static decodePublicKey(encoded: string): Uint8Array {
    try {
      return new Uint8Array(bs58.decode(encoded));
    } catch (error) {
      throw new SignatureError('Invalid public key encoding', error);
    }
  }

  static extractSignature(htmlContent: string): string | null {
    const match = htmlContent.match(/[ \t]*<meta name="frw-signature" content="([^"]+)"/);
    return match ? match[1] : null;
  }

  static removeSignature(htmlContent: string): string {
    return htmlContent.replace(/[ \t]*<meta name="frw-signature" content="[^"]+">\n?/g, '');
  }

  static signPage(htmlContent: string, privateKey: Uint8Array): string {
    const canonical = this.removeSignature(htmlContent);
    const signature = this.sign(canonical, privateKey);
    
    const signatureMeta = `  <meta name="frw-signature" content="${signature}">\n`;
    
    if (!canonical.includes('</head>')) {
      throw new SignatureError('Invalid HTML: missing </head> tag');
    }
    
    return canonical.replace('</head>', signatureMeta + '</head>');
  }

  static verifyPage(htmlContent: string, publicKey: Uint8Array): boolean {
    const signature = this.extractSignature(htmlContent);
    if (!signature) return false;
    
    const canonical = this.removeSignature(htmlContent);
    return this.verify(canonical, signature, publicKey);
  }
}
