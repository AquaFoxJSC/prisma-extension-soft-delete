export * from "./lib/types";
export { createSoftDeleteExtension } from "./lib/createSoftDeleteExtension";
export declare function createSoftDeleteExtensionSync(config: Omit<import("./lib/types").Config, "clientPath">): Promise<(client: any) => import("@prisma/client/extension").PrismaClientExtends<import("@prisma/client/runtime/library").InternalArgs<{}, {}, {}, {}> & import("@prisma/client/runtime/library").DefaultArgs>>;
