import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as crypto from 'crypto';
import { SignatureError, HASH_ALGORITHM } from '@frw/common';
export class SignatureManager {
    static generateKeyPair() {
        return nacl.sign.keyPair();
    }
    static sign(content, privateKey) {
        try {
            const hash = crypto.createHash(HASH_ALGORITHM).update(content).digest();
            const signature = nacl.sign.detached(hash, privateKey);
            return Buffer.from(signature).toString('base64');
        }
        catch (error) {
            throw new SignatureError('Failed to sign content', error);
        }
    }
    static verify(content, signature, publicKey) {
        try {
            const hash = crypto.createHash(HASH_ALGORITHM).update(content).digest();
            const sig = Buffer.from(signature, 'base64');
            return nacl.sign.detached.verify(hash, sig, publicKey);
        }
        catch {
            return false;
        }
    }
    static encodePublicKey(publicKey) {
        return bs58.encode(Buffer.from(publicKey));
    }
    static decodePublicKey(encoded) {
        try {
            return new Uint8Array(bs58.decode(encoded));
        }
        catch (error) {
            throw new SignatureError('Invalid public key encoding', error);
        }
    }
    static extractSignature(htmlContent) {
        const match = htmlContent.match(/<meta name="frw-signature" content="([^"]+)"/);
        return match ? match[1] : null;
    }
    static removeSignature(htmlContent) {
        return htmlContent.replace(/<meta name="frw-signature" content="[^"]+">\s*/g, '');
    }
    static signPage(htmlContent, privateKey) {
        const canonical = this.removeSignature(htmlContent);
        const signature = this.sign(canonical, privateKey);
        const signatureMeta = `  <meta name="frw-signature" content="${signature}">\n`;
        if (!htmlContent.includes('</head>')) {
            throw new SignatureError('Invalid HTML: missing </head> tag');
        }
        return htmlContent.replace('</head>', signatureMeta + '</head>');
    }
    static verifyPage(htmlContent, publicKey) {
        const signature = this.extractSignature(htmlContent);
        if (!signature)
            return false;
        const canonical = this.removeSignature(htmlContent);
        return this.verify(canonical, signature, publicKey);
    }
}
//# sourceMappingURL=signatures.js.map