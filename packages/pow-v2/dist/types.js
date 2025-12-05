// Post-Quantum Proof of Work Types
export class POWError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'POWError';
    }
}
