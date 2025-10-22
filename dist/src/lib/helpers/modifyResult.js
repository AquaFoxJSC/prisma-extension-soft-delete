"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyReadResult = void 0;
const nestedReads_1 = require("../utils/nestedReads");
const resultFiltering_1 = require("../utils/resultFiltering");
function modifyReadResult(config, result, params, ctx) {
    if ((0, resultFiltering_1.shouldFilterDeletedFromReadResult)(params, config)) {
        const filteredResults = (0, resultFiltering_1.filterSoftDeletedResults)(result, config);
        if (ctx === null || ctx === void 0 ? void 0 : ctx.deletedFieldAdded) {
            (0, nestedReads_1.stripDeletedFieldFromResults)(filteredResults, config);
        }
        return filteredResults;
    }
    return result;
}
exports.modifyReadResult = modifyReadResult;
