"use strict";
// Post-Quantum Cryptography Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuantumCryptoError = exports.DEFAULT_CONFIG_V2 = void 0;
exports.DEFAULT_CONFIG_V2 = {
    mode: 'hybrid',
    legacyCutoff: new Date('2035-01-01'),
    securityLevel: 'nist-3'
};
class QuantumCryptoError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'QuantumCryptoError';
    }
}
exports.QuantumCryptoError = QuantumCryptoError;
