import { Prisma as PrismaExtensions } from "@prisma/client/extension";
import { withNestedOperations, initializePrismaClient as initializeNestedOperationsPrismaClient, } from "@aquafoxjsc/prisma-extension-nested-operations";
import { createAggregateParams, createCountParams, createDeleteManyParams, createDeleteParams, createFindFirstParams, createFindFirstOrThrowParams, createFindManyParams, createFindUniqueParams, createFindUniqueOrThrowParams, createIncludeParams, createSelectParams, createUpdateManyParams, createUpdateParams, createUpsertParams, createWhereParams, createGroupByParams, initializePrismaData, } from "./helpers/createParams";
import { modifyReadResult } from "./helpers/modifyResult";
export async function createSoftDeleteExtension({ models, defaultConfig = {
    field: "deleted",
    createValue: Boolean,
    allowToOneUpdates: false,
    allowCompoundUniqueIndexWhere: false,
}, clientPath, }) {
    console.log('[prisma-extension-soft-delete] clientPath:', clientPath);
    if (!defaultConfig.field) {
        throw new Error("prisma-extension-soft-delete: defaultConfig.field is required");
    }
    if (!defaultConfig.createValue) {
        throw new Error("prisma-extension-soft-delete: defaultConfig.createValue is required");
    }
    // Dynamic import Prisma client from custom path or default
    const prismaClientPath = clientPath || "@prisma/client";
    console.log('[prisma-extension-soft-delete] prismaClientPath:', prismaClientPath);
    // Initialize Prisma client for nested-operations extension first
    await initializeNestedOperationsPrismaClient(clientPath);
    let Prisma;
    try {
        const imported = await import(prismaClientPath);
        Prisma = imported.Prisma;
        if (!Prisma || !Prisma.dmmf) {
            throw new Error('Imported Prisma object does not have dmmf property. Please ensure Prisma client is properly generated.');
        }
    }
    catch (error) {
        if (clientPath) {
            // If clientPath is provided but import fails, throw error
            throw new Error(`Cannot find Prisma client at path: ${clientPath}. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
        else {
            // If no clientPath provided, re-throw the original error
            throw error;
        }
    }
    // Initialize Prisma data
    initializePrismaData(Prisma);
    const modelConfig = {};
    Object.keys(models).forEach((model) => {
        const modelName = model;
        const config = models[modelName];
        if (config) {
            modelConfig[modelName] =
                typeof config === "boolean" && config ? defaultConfig : config;
        }
    });
    const createParamsByModel = Object.keys(modelConfig).reduce((acc, model) => {
        const config = modelConfig[model];
        return {
            ...acc,
            [model]: {
                delete: createDeleteParams.bind(null, config),
                deleteMany: createDeleteManyParams.bind(null, config),
                update: createUpdateParams.bind(null, config),
                updateMany: createUpdateManyParams.bind(null, config),
                upsert: createUpsertParams.bind(null, config),
                findFirst: createFindFirstParams.bind(null, config),
                findFirstOrThrow: createFindFirstOrThrowParams.bind(null, config),
                findUnique: createFindUniqueParams.bind(null, config),
                findUniqueOrThrow: createFindUniqueOrThrowParams.bind(null, config),
                findMany: createFindManyParams.bind(null, config),
                count: createCountParams.bind(null, config),
                aggregate: createAggregateParams.bind(null, config),
                where: createWhereParams.bind(null, config),
                include: createIncludeParams.bind(null, config),
                select: createSelectParams.bind(null, config),
                groupBy: createGroupByParams.bind(null, config),
            },
        };
    }, {});
    const modifyResultByModel = Object.keys(modelConfig).reduce((acc, model) => {
        const config = modelConfig[model];
        return {
            ...acc,
            [model]: {
                include: modifyReadResult.bind(null, config),
                select: modifyReadResult.bind(null, config),
            },
        };
    }, {});
    // before handling root params generate deleted value so it is consistent
    // for the query. Add it to root params and get it from scope?
    return PrismaExtensions.defineExtension((client) => {
        return client.$extends({
            query: {
                $allModels: {
                    // @ts-expect-error - we don't know what the client is
                    $allOperations: withNestedOperations({
                        async $rootOperation(initialParams) {
                            var _a, _b;
                            const createParams = (_a = createParamsByModel[initialParams.model || ""]) === null || _a === void 0 ? void 0 : _a[initialParams.operation];
                            if (!createParams)
                                return initialParams.query(initialParams.args);
                            const { params, ctx } = createParams(initialParams);
                            const { model } = params;
                            const operationChanged = params.operation !== initialParams.operation;
                            const result = operationChanged
                                ? // @ts-expect-error - we don't know what the client is
                                    await client[model[0].toLowerCase() + model.slice(1)][params.operation](params.args)
                                : await params.query(params.args);
                            const modifyResult = (_b = modifyResultByModel[params.model || ""]) === null || _b === void 0 ? void 0 : _b[params.operation];
                            if (!modifyResult)
                                return result;
                            return modifyResult(result, params, ctx);
                        },
                        async $allNestedOperations(initialParams) {
                            var _a, _b;
                            const createParams = (_a = createParamsByModel[initialParams.model || ""]) === null || _a === void 0 ? void 0 : _a[initialParams.operation];
                            if (!createParams)
                                return initialParams.query(initialParams.args);
                            const { params, ctx } = createParams(initialParams);
                            const result = await params.query(params.args, params.operation);
                            const modifyResult = (_b = modifyResultByModel[params.model || ""]) === null || _b === void 0 ? void 0 : _b[params.operation];
                            if (!modifyResult)
                                return result;
                            return modifyResult(result, params, ctx);
                        },
                    }),
                },
            },
        });
    });
}
