import { Config } from "./types";
export declare function createSoftDeleteExtension({ models, defaultConfig, clientPath, prismaNamespace, }: Config): Promise<(client: any) => import("@prisma/client/extension").PrismaClientExtends<import("@prisma/client/runtime/library").InternalArgs<{}, {}, {}, {}> & import("@prisma/client/runtime/library").DefaultArgs>>;
