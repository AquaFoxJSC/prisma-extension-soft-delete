import { addDeletedToSelect } from "../utils/nestedReads";
const uniqueFieldsByModel = {};
const uniqueIndexFieldsByModel = {};
export function initializePrismaData(Prisma) {
    Prisma.dmmf.datamodel.models.forEach((model) => {
        // add unique fields derived from indexes
        const uniqueIndexFields = [];
        model.uniqueFields.forEach((field) => {
            uniqueIndexFields.push(field.join("_"));
        });
        uniqueIndexFieldsByModel[model.name] = uniqueIndexFields;
        // add id field and unique fields from @unique decorator
        const uniqueFields = [];
        model.fields.forEach((field) => {
            if (field.isId || field.isUnique) {
                uniqueFields.push(field.name);
            }
        });
        uniqueFieldsByModel[model.name] = uniqueFields;
    });
}
export const createDeleteParams = ({ field, createValue }, params) => {
    var _a, _b;
    if (!params.model ||
        // do nothing for delete: false
        (typeof params.args === "boolean" && !params.args) ||
        // do nothing for root delete without where to allow Prisma to throw
        (!params.scope && !((_a = params.args) === null || _a === void 0 ? void 0 : _a.where))) {
        return {
            params,
        };
    }
    if (typeof params.args === "boolean") {
        return {
            params: {
                ...params,
                operation: "update",
                args: {
                    __passUpdateThrough: true,
                    [field]: createValue(true),
                },
            },
        };
    }
    return {
        params: {
            ...params,
            operation: "update",
            args: {
                where: ((_b = params.args) === null || _b === void 0 ? void 0 : _b.where) || params.args,
                data: {
                    [field]: createValue(true),
                },
            },
        },
    };
};
export const createDeleteManyParams = (config, params) => {
    var _a;
    if (!params.model)
        return { params };
    const where = ((_a = params.args) === null || _a === void 0 ? void 0 : _a.where) || params.args;
    return {
        params: {
            ...params,
            operation: "updateMany",
            args: {
                where: {
                    ...where,
                    [config.field]: config.createValue(false),
                },
                data: {
                    [config.field]: config.createValue(true),
                },
            },
        },
    };
};
export const createUpdateParams = (config, params) => {
    var _a, _b, _c, _d;
    if (((_a = params.scope) === null || _a === void 0 ? void 0 : _a.relations) &&
        !params.scope.relations.to.isList &&
        !config.allowToOneUpdates &&
        !((_b = params.args) === null || _b === void 0 ? void 0 : _b.__passUpdateThrough)) {
        throw new Error(`prisma-extension-soft-delete: update of model "${params.model}" through "${(_c = params.scope) === null || _c === void 0 ? void 0 : _c.parentParams.model}.${params.scope.relations.to.name}" found. Updates of soft deleted models through a toOne relation is not supported as it is possible to update a soft deleted record.`);
    }
    // remove __passUpdateThrough from args
    if ((_d = params.args) === null || _d === void 0 ? void 0 : _d.__passUpdateThrough) {
        delete params.args.__passUpdateThrough;
    }
    return { params };
};
export const createUpdateManyParams = (config, params) => {
    var _a, _b, _c;
    // do nothing if args are not defined to allow Prisma to throw an error
    if (!params.args)
        return { params };
    return {
        params: {
            ...params,
            args: {
                ...params.args,
                where: {
                    ...(_a = params.args) === null || _a === void 0 ? void 0 : _a.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_c = (_b = params.args) === null || _b === void 0 ? void 0 : _b.where) === null || _c === void 0 ? void 0 : _c[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
export const createUpsertParams = (_, params) => {
    var _a, _b;
    if (((_a = params.scope) === null || _a === void 0 ? void 0 : _a.relations) && !params.scope.relations.to.isList) {
        throw new Error(`prisma-extension-soft-delete: upsert of model "${params.model}" through "${(_b = params.scope) === null || _b === void 0 ? void 0 : _b.parentParams.model}.${params.scope.relations.to.name}" found. Upserts of soft deleted models through a toOne relation is not supported as it is possible to update a soft deleted record.`);
    }
    return { params };
};
function validateFindUniqueParams(params, config) {
    var _a;
    const uniqueIndexFields = uniqueIndexFieldsByModel[params.model || ""] || [];
    const uniqueIndexField = Object.keys(((_a = params.args) === null || _a === void 0 ? void 0 : _a.where) || {}).find((key) => uniqueIndexFields.includes(key));
    // when unique index field is found it is not possible to use findFirst.
    // Instead warn the user that soft-deleted models will not be excluded from
    // this query unless warnForUniqueIndexes is false.
    if (uniqueIndexField && !config.allowCompoundUniqueIndexWhere) {
        throw new Error(`prisma-extension-soft-delete: query of model "${params.model}" through compound unique index field "${uniqueIndexField}" found. Queries of soft deleted models through a unique index are not supported. Set "allowCompoundUniqueIndexWhere" to true to override this behaviour.`);
    }
}
function shouldPassFindUniqueParamsThrough(params, config) {
    var _a, _b;
    const uniqueFields = uniqueFieldsByModel[params.model || ""] || [];
    const uniqueIndexFields = uniqueIndexFieldsByModel[params.model || ""] || [];
    const uniqueIndexField = Object.keys(((_a = params.args) === null || _a === void 0 ? void 0 : _a.where) || {}).find((key) => uniqueIndexFields.includes(key));
    // pass through invalid args so Prisma throws an error
    return (
    // findUnique must have a where object
    !((_b = params.args) === null || _b === void 0 ? void 0 : _b.where) ||
        typeof params.args.where !== "object" ||
        // where object must have at least one defined unique field
        !Object.entries(params.args.where).some(([key, val]) => (uniqueFields.includes(key) || uniqueIndexFields.includes(key)) &&
            typeof val !== "undefined") ||
        // pass through if where object has a unique index field and allowCompoundUniqueIndexWhere is true
        !!(uniqueIndexField && config.allowCompoundUniqueIndexWhere));
}
export const createFindUniqueParams = (config, params) => {
    var _a, _b, _c;
    if (shouldPassFindUniqueParamsThrough(params, config)) {
        return { params };
    }
    validateFindUniqueParams(params, config);
    return {
        params: {
            ...params,
            operation: "findFirst",
            args: {
                ...params.args,
                where: {
                    ...(_a = params.args) === null || _a === void 0 ? void 0 : _a.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_c = (_b = params.args) === null || _b === void 0 ? void 0 : _b.where) === null || _c === void 0 ? void 0 : _c[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
export const createFindUniqueOrThrowParams = (config, params) => {
    var _a, _b, _c;
    if (shouldPassFindUniqueParamsThrough(params, config)) {
        return { params };
    }
    validateFindUniqueParams(params, config);
    return {
        params: {
            ...params,
            operation: "findFirstOrThrow",
            args: {
                ...params.args,
                where: {
                    ...(_a = params.args) === null || _a === void 0 ? void 0 : _a.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_c = (_b = params.args) === null || _b === void 0 ? void 0 : _b.where) === null || _c === void 0 ? void 0 : _c[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
export const createFindFirstParams = (config, params) => {
    var _a, _b, _c;
    return {
        params: {
            ...params,
            operation: "findFirst",
            args: {
                ...params.args,
                where: {
                    ...(_a = params.args) === null || _a === void 0 ? void 0 : _a.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_c = (_b = params.args) === null || _b === void 0 ? void 0 : _b.where) === null || _c === void 0 ? void 0 : _c[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
export const createFindFirstOrThrowParams = (config, params) => {
    var _a, _b, _c;
    return {
        params: {
            ...params,
            operation: "findFirstOrThrow",
            args: {
                ...params.args,
                where: {
                    ...(_a = params.args) === null || _a === void 0 ? void 0 : _a.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_c = (_b = params.args) === null || _b === void 0 ? void 0 : _b.where) === null || _c === void 0 ? void 0 : _c[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
export const createFindManyParams = (config, params) => {
    var _a, _b, _c;
    return {
        params: {
            ...params,
            operation: "findMany",
            args: {
                ...params.args,
                where: {
                    ...(_a = params.args) === null || _a === void 0 ? void 0 : _a.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_c = (_b = params.args) === null || _b === void 0 ? void 0 : _b.where) === null || _c === void 0 ? void 0 : _c[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
/*GroupBy */
export const createGroupByParams = (config, params) => {
    var _a, _b, _c;
    return {
        params: {
            ...params,
            operation: "groupBy",
            args: {
                ...params.args,
                where: {
                    ...(_a = params.args) === null || _a === void 0 ? void 0 : _a.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_c = (_b = params.args) === null || _b === void 0 ? void 0 : _b.where) === null || _c === void 0 ? void 0 : _c[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
export const createCountParams = (config, params) => {
    const args = params.args || {};
    const where = args.where || {};
    return {
        params: {
            ...params,
            args: {
                ...args,
                where: {
                    ...where,
                    // allow overriding the deleted field in where
                    [config.field]: where[config.field] || config.createValue(false),
                },
            },
        },
    };
};
export const createAggregateParams = (config, params) => {
    const args = params.args || {};
    const where = args.where || {};
    return {
        params: {
            ...params,
            args: {
                ...args,
                where: {
                    ...where,
                    // allow overriding the deleted field in where
                    [config.field]: where[config.field] || config.createValue(false),
                },
            },
        },
    };
};
export const createWhereParams = (config, params) => {
    var _a;
    if (!params.scope)
        return { params };
    // customise list queries with every modifier unless the deleted field is set
    if (((_a = params.scope) === null || _a === void 0 ? void 0 : _a.modifier) === "every" && !params.args[config.field]) {
        return {
            params: {
                ...params,
                args: {
                    OR: [
                        { [config.field]: { not: config.createValue(false) } },
                        params.args,
                    ],
                },
            },
        };
    }
    return {
        params: {
            ...params,
            args: {
                ...params.args,
                [config.field]: params.args[config.field] || config.createValue(false),
            },
        },
    };
};
export const createIncludeParams = (config, params) => {
    var _a, _b, _c, _d, _e, _f, _g;
    // includes of toOne relation cannot filter deleted records using params
    // instead ensure that the deleted field is selected and filter the results
    if (((_b = (_a = params.scope) === null || _a === void 0 ? void 0 : _a.relations) === null || _b === void 0 ? void 0 : _b.to.isList) === false) {
        if (((_c = params.args) === null || _c === void 0 ? void 0 : _c.select) && !((_d = params.args) === null || _d === void 0 ? void 0 : _d.select[config.field])) {
            return {
                params: addDeletedToSelect(params, config),
                ctx: { deletedFieldAdded: true },
            };
        }
        return { params };
    }
    return {
        params: {
            ...params,
            args: {
                ...params.args,
                where: {
                    ...(_e = params.args) === null || _e === void 0 ? void 0 : _e.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_g = (_f = params.args) === null || _f === void 0 ? void 0 : _f.where) === null || _g === void 0 ? void 0 : _g[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
export const createSelectParams = (config, params) => {
    var _a, _b, _c, _d, _e, _f, _g;
    // selects in includes are handled by createIncludeParams
    if (((_a = params.scope) === null || _a === void 0 ? void 0 : _a.parentParams.operation) === "include") {
        return { params };
    }
    // selects of toOne relation cannot filter deleted records using params
    if (((_c = (_b = params.scope) === null || _b === void 0 ? void 0 : _b.relations) === null || _c === void 0 ? void 0 : _c.to.isList) === false) {
        if (((_d = params.args) === null || _d === void 0 ? void 0 : _d.select) && !params.args.select[config.field]) {
            return {
                params: addDeletedToSelect(params, config),
                ctx: { deletedFieldAdded: true },
            };
        }
        return { params };
    }
    return {
        params: {
            ...params,
            args: {
                ...params.args,
                where: {
                    ...(_e = params.args) === null || _e === void 0 ? void 0 : _e.where,
                    // allow overriding the deleted field in where
                    [config.field]: ((_g = (_f = params.args) === null || _f === void 0 ? void 0 : _f.where) === null || _g === void 0 ? void 0 : _g[config.field]) || config.createValue(false),
                },
            },
        },
    };
};
