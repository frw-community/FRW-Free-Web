// Post-Quantum Cryptography Types
export const DEFAULT_CONFIG_V2 = {
    mode: 'hybrid',
    legacyCutoff: new Date('2035-01-01'),
    securityLevel: 'nist-3'
};
export class QuantumCryptoError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'QuantumCryptoError';
    }
}
