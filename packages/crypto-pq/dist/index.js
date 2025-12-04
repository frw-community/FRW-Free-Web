"use strict";
// @frw/crypto-pq - Post-Quantum Cryptography Package
// Implements hybrid Ed25519 + Dilithium3 signatures
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
exports.verifyHashV2 = exports.hashStringV2 = exports.hashV2 = exports.hashFast = exports.hashPQ = exports.HashManagerV2 = exports.verifyStringV2 = exports.signStringV2 = exports.verifyV2 = exports.signV2 = exports.SignatureManagerV2 = exports.validateKeyPairV2 = exports.generateKeyPairV2 = exports.KeyManagerV2 = void 0;
__exportStar(require("./types.js"), exports);
__exportStar(require("./keys-pq.js"), exports);
__exportStar(require("./signatures-pq.js"), exports);
__exportStar(require("./hash-pq.js"), exports);
// Convenience re-exports
var keys_pq_js_1 = require("./keys-pq.js");
Object.defineProperty(exports, "KeyManagerV2", { enumerable: true, get: function () { return keys_pq_js_1.KeyManagerV2; } });
Object.defineProperty(exports, "generateKeyPairV2", { enumerable: true, get: function () { return keys_pq_js_1.generateKeyPairV2; } });
Object.defineProperty(exports, "validateKeyPairV2", { enumerable: true, get: function () { return keys_pq_js_1.validateKeyPairV2; } });
var signatures_pq_js_1 = require("./signatures-pq.js");
Object.defineProperty(exports, "SignatureManagerV2", { enumerable: true, get: function () { return signatures_pq_js_1.SignatureManagerV2; } });
Object.defineProperty(exports, "signV2", { enumerable: true, get: function () { return signatures_pq_js_1.signV2; } });
Object.defineProperty(exports, "verifyV2", { enumerable: true, get: function () { return signatures_pq_js_1.verifyV2; } });
Object.defineProperty(exports, "signStringV2", { enumerable: true, get: function () { return signatures_pq_js_1.signStringV2; } });
Object.defineProperty(exports, "verifyStringV2", { enumerable: true, get: function () { return signatures_pq_js_1.verifyStringV2; } });
var hash_pq_js_1 = require("./hash-pq.js");
Object.defineProperty(exports, "HashManagerV2", { enumerable: true, get: function () { return hash_pq_js_1.HashManagerV2; } });
Object.defineProperty(exports, "hashPQ", { enumerable: true, get: function () { return hash_pq_js_1.hashPQ; } });
Object.defineProperty(exports, "hashFast", { enumerable: true, get: function () { return hash_pq_js_1.hashFast; } });
Object.defineProperty(exports, "hashV2", { enumerable: true, get: function () { return hash_pq_js_1.hashV2; } });
Object.defineProperty(exports, "hashStringV2", { enumerable: true, get: function () { return hash_pq_js_1.hashStringV2; } });
Object.defineProperty(exports, "verifyHashV2", { enumerable: true, get: function () { return hash_pq_js_1.verifyHashV2; } });
