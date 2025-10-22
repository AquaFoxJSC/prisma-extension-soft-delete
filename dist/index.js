"use strict";
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
exports.createSoftDeleteExtensionSync = exports.createSoftDeleteExtension = void 0;
// For backward compatibility, also export a sync version that uses default @prisma/client
const createSoftDeleteExtension_1 = require("./lib/createSoftDeleteExtension");
__exportStar(require("./lib/types"), exports);
var createSoftDeleteExtension_2 = require("./lib/createSoftDeleteExtension");
Object.defineProperty(exports, "createSoftDeleteExtension", { enumerable: true, get: function () { return createSoftDeleteExtension_2.createSoftDeleteExtension; } });
function createSoftDeleteExtensionSync(config) {
    return (0, createSoftDeleteExtension_1.createSoftDeleteExtension)({
        ...config,
        clientPath: "@prisma/client"
    });
}
exports.createSoftDeleteExtensionSync = createSoftDeleteExtensionSync;
