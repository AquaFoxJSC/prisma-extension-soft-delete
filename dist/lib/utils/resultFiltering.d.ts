import { ModelConfig } from "../types";
export declare function shouldFilterDeletedFromReadResult(params: {
    args: any;
}, config: ModelConfig): boolean;
export declare function filterSoftDeletedResults(result: any, config: ModelConfig): any;
