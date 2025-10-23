import { Prisma as PrismaExtensions } from "@prisma/client/extension";
import type { PrismaClient } from "@prisma/client";
import {
  NestedOperation,
  withNestedOperations,
  initializePrismaClient as initializeNestedOperationsPrismaClient,
  initializePrismaClientWithNamespace as initializeNestedOperationsWithNamespace,
} from "@aquafoxjsc/prisma-extension-nested-operations";
import {
  createAggregateParams,
  createCountParams,
  createDeleteManyParams,
  createDeleteParams,
  createFindFirstParams,
  createFindFirstOrThrowParams,
  createFindManyParams,
  createFindUniqueParams,
  createFindUniqueOrThrowParams,
  createIncludeParams,
  createSelectParams,
  createUpdateManyParams,
  createUpdateParams,
  createUpsertParams,
  createWhereParams,
  createGroupByParams,
  CreateParams,
  initializePrismaData,
} from "./helpers/createParams";

import { Config, ModelConfig } from "./types";
import { ModifyResult, modifyReadResult } from "./helpers/modifyResult";

type ConfigBound<F> = F extends (x: ModelConfig, ...args: infer P) => infer R
  ? (...args: P) => R
  : never;

export async function createSoftDeleteExtension({
  models,
  defaultConfig = {
    field: "deleted",
    createValue: Boolean,
    allowToOneUpdates: false,
    allowCompoundUniqueIndexWhere: false,
  },
  clientPath,
  prismaNamespace,
}: Config) {
  if (!defaultConfig.field) {
    throw new Error(
      "prisma-extension-soft-delete: defaultConfig.field is required"
    );
  }
  if (!defaultConfig.createValue) {
    throw new Error(
      "prisma-extension-soft-delete: defaultConfig.createValue is required"
    );
  }

  let Prisma: any;
  
  // Priority 1: Use provided Prisma namespace directly
  if (prismaNamespace) {
    console.log('[prisma-extension-soft-delete] Using provided Prisma namespace');
    Prisma = prismaNamespace;
    
    if (!Prisma || !Prisma.dmmf) {
      throw new Error('Provided Prisma namespace does not have dmmf property. Please ensure it is a valid Prisma namespace.');
    }
    
    // Initialize nested-operations with the same namespace
    initializeNestedOperationsWithNamespace(prismaNamespace);
  }
  // Priority 2: Use clientPath for dynamic import
  else if (clientPath) {
    console.log('[prisma-extension-soft-delete] clientPath:', clientPath);
    const prismaClientPath = clientPath;
    
    // Initialize Prisma client for nested-operations extension first
    await initializeNestedOperationsPrismaClient(clientPath);
    
    try {
      const imported = await import(prismaClientPath) as { Prisma: any };
      Prisma = imported.Prisma;
      
      if (!Prisma || !Prisma.dmmf) {
        throw new Error('Imported Prisma object does not have dmmf property. Please ensure Prisma client is properly generated.');
      }
    } catch (error) {
      throw new Error(`Cannot find Prisma client at path: ${clientPath}. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  // Priority 3: Default to @prisma/client
  else {
    console.log('[prisma-extension-soft-delete] Using default @prisma/client');
    await initializeNestedOperationsPrismaClient();
    
    try {
      const imported = await import("@prisma/client") as { Prisma: any };
      Prisma = imported.Prisma;
      
      if (!Prisma || !Prisma.dmmf) {
        throw new Error('Default @prisma/client does not have dmmf property. Please ensure Prisma client is generated.');
      }
    } catch (error) {
      throw error;
    }
  }

  // Initialize Prisma data
  initializePrismaData(Prisma);

  const modelConfig: Partial<Record<string, ModelConfig>> = {};

  Object.keys(models).forEach((model) => {
    const modelName = model as string;
    const config = (models as any)[modelName];
    if (config) {
      modelConfig[modelName] =
        typeof config === "boolean" && config ? defaultConfig : config;
    }
  });

  const createParamsByModel = Object.keys(modelConfig).reduce<
    Record<string, Record<string, ConfigBound<CreateParams> | undefined>>
  >((acc, model) => {
    const config = modelConfig[model]!;
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

  const modifyResultByModel = Object.keys(modelConfig).reduce<
    Record<string, Record<string, ConfigBound<ModifyResult> | undefined>>
  >((acc, model) => {
    const config = modelConfig[model]!;
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
              const createParams =
                createParamsByModel[initialParams.model || ""]?.[
                  initialParams.operation
                ];

              if (!createParams) return initialParams.query(initialParams.args);

              const { params, ctx } = createParams(initialParams);
              const { model } = params;

              const operationChanged =
                params.operation !== initialParams.operation;

              const result = operationChanged
                ? // @ts-expect-error - we don't know what the client is
                  await client[model[0].toLowerCase() + model.slice(1)][
                    params.operation
                  ](params.args)
                : await params.query(params.args);

              const modifyResult =
                modifyResultByModel[params.model || ""]?.[params.operation];

              if (!modifyResult) return result;

              return modifyResult(result, params, ctx);
            },
            async $allNestedOperations(initialParams) {
              const createParams =
                createParamsByModel[initialParams.model || ""]?.[
                  initialParams.operation
                ];

              if (!createParams) return initialParams.query(initialParams.args);

              const { params, ctx } = createParams(initialParams);

              const result = await params.query(
                params.args,
                params.operation as NestedOperation
              );

              const modifyResult =
                modifyResultByModel[params.model || ""]?.[params.operation];

              if (!modifyResult) return result;

              return modifyResult(result, params, ctx);
            },
          }),
        },
      },
    });
  });
}
