"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterSoftDeletedResults = exports.shouldFilterDeletedFromReadResult = void 0;
// Maybe this should return true for non-list relations only?
function shouldFilterDeletedFromReadResult(params, config) {
    return (!params.args.where ||
        typeof params.args.where[config.field] === "undefined" ||
        !params.args.where[config.field]);
}
exports.shouldFilterDeletedFromReadResult = shouldFilterDeletedFromReadResult;
function filterSoftDeletedResults(result, config) {
    // filter out deleted records from array results
    if (result && Array.isArray(result)) {
        return result.filter((item) => !item[config.field]);
    }
    // if the result is deleted return null
    if (result && result[config.field]) {
        return null;
    }
    return result;
}
exports.filterSoftDeletedResults = filterSoftDeletedResults;
