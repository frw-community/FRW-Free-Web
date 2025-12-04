"use strict";
// @frw/pow-v2 - Quantum-Resistant Proof of Work
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
exports.compareDifficulty = exports.validateDifficulty = exports.estimateTime = exports.getRequiredDifficulty = exports.verifyPOWV2 = exports.ProofOfWorkVerifierV2 = exports.generatePOWV2 = exports.ProofOfWorkGeneratorV2 = void 0;
__exportStar(require("./types.js"), exports);
__exportStar(require("./difficulty-v2.js"), exports);
__exportStar(require("./generator-v2.js"), exports);
__exportStar(require("./verifier-v2.js"), exports);
// Convenience re-exports
var generator_v2_js_1 = require("./generator-v2.js");
Object.defineProperty(exports, "ProofOfWorkGeneratorV2", { enumerable: true, get: function () { return generator_v2_js_1.ProofOfWorkGeneratorV2; } });
Object.defineProperty(exports, "generatePOWV2", { enumerable: true, get: function () { return generator_v2_js_1.generatePOWV2; } });
var verifier_v2_js_1 = require("./verifier-v2.js");
Object.defineProperty(exports, "ProofOfWorkVerifierV2", { enumerable: true, get: function () { return verifier_v2_js_1.ProofOfWorkVerifierV2; } });
Object.defineProperty(exports, "verifyPOWV2", { enumerable: true, get: function () { return verifier_v2_js_1.verifyPOWV2; } });
var difficulty_v2_js_1 = require("./difficulty-v2.js");
Object.defineProperty(exports, "getRequiredDifficulty", { enumerable: true, get: function () { return difficulty_v2_js_1.getRequiredDifficulty; } });
Object.defineProperty(exports, "estimateTime", { enumerable: true, get: function () { return difficulty_v2_js_1.estimateTime; } });
Object.defineProperty(exports, "validateDifficulty", { enumerable: true, get: function () { return difficulty_v2_js_1.validateDifficulty; } });
Object.defineProperty(exports, "compareDifficulty", { enumerable: true, get: function () { return difficulty_v2_js_1.compareDifficulty; } });
