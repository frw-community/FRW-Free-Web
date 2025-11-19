"use strict";
// Protocol V2 Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolV2Error = void 0;
class ProtocolV2Error extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'ProtocolV2Error';
    }
}
exports.ProtocolV2Error = ProtocolV2Error;
