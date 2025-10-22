import { ModelConfig } from "../types";
import { CreateParamsReturn } from "./createParams";
export type ModifyResult = (config: ModelConfig, result: any, params: CreateParamsReturn["params"], ctx?: any) => any;
export declare function modifyReadResult(config: ModelConfig, result: any, params: CreateParamsReturn["params"], ctx?: any): CreateParamsReturn;
