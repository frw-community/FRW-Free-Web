import type { FRWKeyPair } from '@frw/common';
interface EncryptedKey {
    encrypted: string;
    iv: string;
    salt: string;
}
interface ExportedKeyPair {
    publicKey: string;
    privateKey: string | EncryptedKey;
}
export declare class KeyManager {
    static generateKeyPair(seed?: Uint8Array): FRWKeyPair;
    static deriveSeed(password: string, salt: string): Buffer;
    static encryptPrivateKey(privateKey: Uint8Array, password: string): EncryptedKey;
    static decryptPrivateKey(encrypted: string, iv: string, salt: string, password: string): Uint8Array;
    static exportKeyPair(keyPair: FRWKeyPair, password?: string): ExportedKeyPair;
    static importKeyPair(data: ExportedKeyPair, password?: string): FRWKeyPair;
    static validateKeyPair(keyPair: FRWKeyPair): boolean;
}
export {};
//# sourceMappingURL=keys.d.ts.map