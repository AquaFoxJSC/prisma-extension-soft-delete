"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripDeletedFieldFromResults = exports.addDeletedToSelect = void 0;
function addDeletedToSelect(params, config) {
    if (params.args.select && !params.args.select[config.field]) {
        return {
            ...params,
            args: {
                ...params.args,
                select: {
                    ...params.args.select,
                    [config.field]: true,
                },
            },
        };
    }
    return params;
}
exports.addDeletedToSelect = addDeletedToSelect;
function stripDeletedFieldFromResults(results, config) {
    if (Array.isArray(results)) {
        results === null || results === void 0 ? void 0 : results.forEach((item) => {
            delete item[config.field];
        });
    }
    else if (results) {
        delete results[config.field];
    }
    return results;
}
exports.stripDeletedFieldFromResults = stripDeletedFieldFromResults;
