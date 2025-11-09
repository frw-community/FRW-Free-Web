import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as crypto from 'crypto';
import type { FRWKeyPair } from '@frw/common';
import { SignatureError } from '@frw/common';

interface EncryptedKey {
  encrypted: string;
  iv: string;
  salt: string;
}

interface ExportedKeyPair {
  publicKey: string;
  privateKey: string | EncryptedKey;
}

export class KeyManager {
  static generateKeyPair(seed?: Uint8Array): FRWKeyPair {
    const keyPair = seed ? nacl.sign.keyPair.fromSeed(seed) : nacl.sign.keyPair();
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
  }

  static deriveSeed(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  static encryptPrivateKey(privateKey: Uint8Array, password: string): EncryptedKey {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(privateKey)),
      cipher.final()
    ]);

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      salt: salt.toString('base64')
    };
  }

  static decryptPrivateKey(
    encrypted: string,
    iv: string,
    salt: string,
    password: string
  ): Uint8Array {
    try {
      const key = crypto.pbkdf2Sync(
        password,
        Buffer.from(salt, 'base64'),
        100000,
        32,
        'sha256'
      );
      
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        key,
        Buffer.from(iv, 'base64')
      );
      
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64')),
        decipher.final()
      ]);

      return new Uint8Array(decrypted);
    } catch (error) {
      throw new SignatureError('Failed to decrypt private key', error);
    }
  }

  static exportKeyPair(keyPair: FRWKeyPair, password?: string): ExportedKeyPair {
    const publicKey = bs58.encode(Buffer.from(keyPair.publicKey));
    
    if (password) {
      const privateKey = this.encryptPrivateKey(keyPair.privateKey, password);
      return { publicKey, privateKey };
    }
    
    const privateKey = Buffer.from(keyPair.privateKey).toString('base64');
    return { publicKey, privateKey };
  }

  static importKeyPair(data: ExportedKeyPair, password?: string): FRWKeyPair {
    const publicKey = new Uint8Array(bs58.decode(data.publicKey));
    
    let privateKey: Uint8Array;
    if (typeof data.privateKey === 'object') {
      if (!password) {
        throw new SignatureError('Password required for encrypted key');
      }
      privateKey = this.decryptPrivateKey(
        data.privateKey.encrypted,
        data.privateKey.iv,
        data.privateKey.salt,
        password
      );
    } else {
      privateKey = new Uint8Array(Buffer.from(data.privateKey, 'base64'));
    }
    
    return { publicKey, privateKey };
  }

  static validateKeyPair(keyPair: FRWKeyPair): boolean {
    return (
      keyPair.publicKey.length === 32 &&
      keyPair.privateKey.length === 64
    );
  }
}
