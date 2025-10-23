import { Prisma as PrismaExtensions } from "@prisma/client/extension";
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
import { convertRuntimeDataModelToDmmf } from "./utils/runtimeDataModelAdapter";

type ConfigBound<F> = F extends (x: ModelConfig, ...args: infer P) => infer R
  ? (...args: P) => R
  : never;

async function initializePrisma(
  prismaClient: any,
  prismaNamespace: any,
  clientPath?: string
): Promise<any> {
  // Priority 1: Use prismaClient instance (Prisma v6 with _runtimeDataModel)
  if (prismaClient) {
    // Check for Prisma v6 _runtimeDataModel
    if ((prismaClient as any)._runtimeDataModel) {
      const runtimeDataModel = (prismaClient as any)._runtimeDataModel;
      const dmmf = convertRuntimeDataModelToDmmf(runtimeDataModel);
      const Prisma = (prismaClient as any).constructor;
      Prisma.dmmf = dmmf;
      initializeNestedOperationsWithNamespace(Prisma);
      return Prisma;
    }
    throw new Error('Provided Prisma client does not have _runtimeDataModel. Please ensure you are using Prisma v6+');
  }
  
  // Priority 2: Use provided Prisma namespace directly
  if (prismaNamespace) {
    if (!prismaNamespace || !prismaNamespace.dmmf) {
      throw new Error('Provided Prisma namespace does not have dmmf property. Please ensure it is a valid Prisma namespace.');
    }
    initializeNestedOperationsWithNamespace(prismaNamespace);
    return prismaNamespace;
  }
  
  // Priority 3: Use clientPath for dynamic import
  if (clientPath) {
    await initializeNestedOperationsPrismaClient(clientPath);
    const imported = await import(clientPath) as { Prisma: any };
    const Prisma = imported.Prisma;
    if (!Prisma || !Prisma.dmmf) {
      throw new Error('Imported Prisma object does not have dmmf property. Please ensure Prisma client is properly generated.');
    }
    return Prisma;
  }
  
  // Priority 4: Default to @prisma/client
  await initializeNestedOperationsPrismaClient();
  const imported = await import("@prisma/client") as { Prisma: any };
  const Prisma = imported.Prisma;
  if (!Prisma || !Prisma.dmmf) {
    throw new Error('Default @prisma/client does not have dmmf property. Please ensure Prisma client is generated.');
  }
  return Prisma;
}

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
  prismaClient,
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

  const Prisma = await initializePrisma(prismaClient, prismaNamespace, clientPath);
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
