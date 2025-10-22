export function addDeletedToSelect(params, config) {
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
export function stripDeletedFieldFromResults(results, config) {
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
