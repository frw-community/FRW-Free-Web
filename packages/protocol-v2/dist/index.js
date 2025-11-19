"use strict";
// @frw/protocol-v2 - Quantum-Resistant Protocol Implementation
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromJSON = exports.toJSON = exports.serializeCanonical = exports.serializeFull = exports.verifyRecordV2 = exports.RecordVerifierV2 = exports.createRecordV2 = exports.RecordManagerV2 = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./record"), exports);
__exportStar(require("./serialization"), exports);
__exportStar(require("./verification"), exports);
// Convenience re-exports
var record_1 = require("./record");
Object.defineProperty(exports, "RecordManagerV2", { enumerable: true, get: function () { return record_1.RecordManagerV2; } });
Object.defineProperty(exports, "createRecordV2", { enumerable: true, get: function () { return record_1.createRecordV2; } });
var verification_1 = require("./verification");
Object.defineProperty(exports, "RecordVerifierV2", { enumerable: true, get: function () { return verification_1.RecordVerifierV2; } });
Object.defineProperty(exports, "verifyRecordV2", { enumerable: true, get: function () { return verification_1.verifyRecordV2; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "serializeFull", { enumerable: true, get: function () { return serialization_1.serializeFull; } });
Object.defineProperty(exports, "serializeCanonical", { enumerable: true, get: function () { return serialization_1.serializeCanonical; } });
Object.defineProperty(exports, "toJSON", { enumerable: true, get: function () { return serialization_1.toJSON; } });
Object.defineProperty(exports, "fromJSON", { enumerable: true, get: function () { return serialization_1.fromJSON; } });
