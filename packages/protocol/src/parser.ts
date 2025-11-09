import type { FRWURL } from '@frw/common';
import { ProtocolError, FRW_PROTOCOL, sanitizePath } from '@frw/common';

export class FRWParser {
  private static readonly NAME_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  private static readonly PUBKEY_REGEX = /^[A-Za-z0-9]{32,}$/;

  static parse(url: string): FRWURL {
    if (!url.startsWith(`${FRW_PROTOCOL}://`)) {
      throw new ProtocolError(`Invalid protocol: must start with ${FRW_PROTOCOL}://`);
    }

    const match = url.match(/^frw:\/\/([^\/]+)(\/.*)?$/);
    if (!match) {
      throw new ProtocolError('Invalid FRW URL format');
    }

    const identifier = match[1];
    
    // Validate identifier is either a valid name or public key
    if (!this.isValidName(identifier) && !this.isValidPublicKey(identifier)) {
      throw new ProtocolError('Invalid identifier: must be a name or public key');
    }

    return {
      protocol: FRW_PROTOCOL,
      publicKey: identifier, // Will be resolved to actual key if it's a name
      path: sanitizePath(match[2] || '/index.frw')
    };
  }

  static isValidName(name: string): boolean {
    return this.NAME_REGEX.test(name);
  }

  static isValidPublicKey(key: string): boolean {
    return this.PUBKEY_REGEX.test(key);
  }

  static isName(identifier: string): boolean {
    return this.isValidName(identifier) && !this.isValidPublicKey(identifier);
  }

  static build(publicKey: string, path: string = '/index.frw'): string {
    return `${FRW_PROTOCOL}://${publicKey}${sanitizePath(path)}`;
  }

  static validate(url: string): boolean {
    try {
      this.parse(url);
      return true;
    } catch {
      return false;
    }
  }

  static extractPublicKey(url: string): string {
    return this.parse(url).publicKey;
  }

  static extractPath(url: string): string {
    return this.parse(url).path;
  }
}
