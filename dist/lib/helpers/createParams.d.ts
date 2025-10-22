import { NestedParams } from "prisma-extension-nested-operations";
import { ModelConfig } from "../types";
export declare function initializePrismaData(Prisma: any): void;
export type Params = Omit<NestedParams<any>, "operation"> & {
    operation: string;
};
export type CreateParamsReturn = {
    params: Params;
    ctx?: any;
};
export type CreateParams = (config: ModelConfig, params: Params) => CreateParamsReturn;
export declare const createDeleteParams: CreateParams;
export declare const createDeleteManyParams: CreateParams;
export declare const createUpdateParams: CreateParams;
export declare const createUpdateManyParams: CreateParams;
export declare const createUpsertParams: CreateParams;
export declare const createFindUniqueParams: CreateParams;
export declare const createFindUniqueOrThrowParams: CreateParams;
export declare const createFindFirstParams: CreateParams;
export declare const createFindFirstOrThrowParams: CreateParams;
export declare const createFindManyParams: CreateParams;
export declare const createGroupByParams: CreateParams;
export declare const createCountParams: CreateParams;
export declare const createAggregateParams: CreateParams;
export declare const createWhereParams: CreateParams;
export declare const createIncludeParams: CreateParams;
export declare const createSelectParams: CreateParams;
