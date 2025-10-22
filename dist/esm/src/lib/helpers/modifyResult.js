import { stripDeletedFieldFromResults } from "../utils/nestedReads";
import { filterSoftDeletedResults, shouldFilterDeletedFromReadResult, } from "../utils/resultFiltering";
export function modifyReadResult(config, result, params, ctx) {
    if (shouldFilterDeletedFromReadResult(params, config)) {
        const filteredResults = filterSoftDeletedResults(result, config);
        if (ctx === null || ctx === void 0 ? void 0 : ctx.deletedFieldAdded) {
            stripDeletedFieldFromResults(filteredResults, config);
        }
        return filteredResults;
    }
    return result;
}
