import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as crypto from 'crypto';
import { SignatureError } from '@frw/common';
export class KeyManager {
    static generateKeyPair(seed) {
        return seed ? nacl.sign.keyPair.fromSeed(seed) : nacl.sign.keyPair();
    }
    static deriveSeed(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    }
    static encryptPrivateKey(privateKey, password) {
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
    static decryptPrivateKey(encrypted, iv, salt, password) {
        try {
            const key = crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), 100000, 32, 'sha256');
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'base64'));
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encrypted, 'base64')),
                decipher.final()
            ]);
            return new Uint8Array(decrypted);
        }
        catch (error) {
            throw new SignatureError('Failed to decrypt private key', error);
        }
    }
    static exportKeyPair(keyPair, password) {
        const publicKey = bs58.encode(Buffer.from(keyPair.publicKey));
        if (password) {
            const privateKey = this.encryptPrivateKey(keyPair.privateKey, password);
            return { publicKey, privateKey };
        }
        const privateKey = Buffer.from(keyPair.privateKey).toString('base64');
        return { publicKey, privateKey };
    }
    static importKeyPair(data, password) {
        const publicKey = new Uint8Array(bs58.decode(data.publicKey));
        let privateKey;
        if (typeof data.privateKey === 'object') {
            if (!password) {
                throw new SignatureError('Password required for encrypted key');
            }
            privateKey = this.decryptPrivateKey(data.privateKey.encrypted, data.privateKey.iv, data.privateKey.salt, password);
        }
        else {
            privateKey = new Uint8Array(Buffer.from(data.privateKey, 'base64'));
        }
        return { publicKey, privateKey };
    }
    static validateKeyPair(keyPair) {
        return (keyPair.publicKey.length === 32 &&
            keyPair.privateKey.length === 64);
    }
}
//# sourceMappingURL=keys.js.map