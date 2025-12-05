// Protocol V2 Types
export class ProtocolV2Error extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'ProtocolV2Error';
    }
}
