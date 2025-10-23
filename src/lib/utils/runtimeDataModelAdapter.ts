/**
 * Adapter to convert Prisma v6 _runtimeDataModel to v5 dmmf format
 * This allows extensions to work with both Prisma v5 and v6
 */

export function convertRuntimeDataModelToDmmf(runtimeDataModel: any): any {
  if (!runtimeDataModel || !runtimeDataModel.models) {
    throw new Error('Invalid runtimeDataModel: missing models');
  }

  const models = Object.entries(runtimeDataModel.models).map(([modelName, modelData]: [string, any]) => {
    const fields = Object.entries(modelData.fields || {}).map(([fieldName, fieldData]: [string, any]) => {
      return {
        name: fieldName,
        kind: fieldData.kind || 'scalar',
        isList: fieldData.isList || false,
        isRequired: fieldData.isRequired || false,
        isUnique: fieldData.isUnique || false,
        isId: fieldData.isId || false,
        type: fieldData.type || 'String',
        relationName: fieldData.relationName,
        relationFromFields: fieldData.relationFromFields,
        relationToFields: fieldData.relationToFields,
        ...fieldData,
      };
    });

    // Extract uniqueFields from compound unique constraints
    const uniqueFields: string[][] = [];
    if (modelData.uniqueFields) {
      uniqueFields.push(...modelData.uniqueFields);
    }

    return {
      name: modelName,
      dbName: modelData.dbName,
      fields,
      uniqueFields,
      ...modelData,
    };
  });

  return {
    datamodel: {
      models,
      enums: Object.entries(runtimeDataModel.enums || {}).map(([name, data]) => ({
        name,
        ...(data as any),
      })),
    },
  };
}

