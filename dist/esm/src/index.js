export * from "./lib/types";
export { createSoftDeleteExtension } from "./lib/createSoftDeleteExtension";
// For backward compatibility, also export a sync version that uses default @prisma/client
import { createSoftDeleteExtension } from "./lib/createSoftDeleteExtension";
export async function createSoftDeleteExtensionSync(config) {
    return await createSoftDeleteExtension({ ...config, clientPath: "@prisma/client" });
}
