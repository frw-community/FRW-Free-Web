import type { FRWURL } from '@frw/common';
import { ProtocolError, FRW_PROTOCOL, sanitizePath } from '@frw/common';

export class FRWParser {
  static parse(url: string): FRWURL {
    if (!url.startsWith(`${FRW_PROTOCOL}://`)) {
      throw new ProtocolError(`Invalid protocol: must start with ${FRW_PROTOCOL}://`);
    }

    const match = url.match(/^frw:\/\/([^\/]+)(\/.*)?$/);
    if (!match) {
      throw new ProtocolError('Invalid FRW URL format');
    }

    return {
      protocol: FRW_PROTOCOL,
      publicKey: match[1],
      path: sanitizePath(match[2] || '/index.frw')
    };
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
