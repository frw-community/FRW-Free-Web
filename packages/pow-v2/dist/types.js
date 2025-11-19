"use strict";
// Post-Quantum Proof of Work Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.POWError = void 0;
class POWError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'POWError';
    }
}
exports.POWError = POWError;
