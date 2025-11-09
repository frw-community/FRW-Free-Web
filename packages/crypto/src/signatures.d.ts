import type { FRWKeyPair } from '@frw/common';
export declare class SignatureManager {
    static generateKeyPair(): FRWKeyPair;
    static sign(content: string | Buffer, privateKey: Uint8Array): string;
    static verify(content: string | Buffer, signature: string, publicKey: Uint8Array): boolean;
    static encodePublicKey(publicKey: Uint8Array): string;
    static decodePublicKey(encoded: string): Uint8Array;
    static extractSignature(htmlContent: string): string | null;
    static removeSignature(htmlContent: string): string;
    static signPage(htmlContent: string, privateKey: Uint8Array): string;
    static verifyPage(htmlContent: string, publicKey: Uint8Array): boolean;
}
//# sourceMappingURL=signatures.d.ts.map