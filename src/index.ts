// For backward compatibility, also export a sync version that uses default @prisma/client
import { createSoftDeleteExtension } from "./lib/createSoftDeleteExtension";

export * from "./lib/types";

export { createSoftDeleteExtension } from "./lib/createSoftDeleteExtension";

export function createSoftDeleteExtensionSync(config: Omit<import("./lib/types").Config, "clientPath">) {
  return createSoftDeleteExtension({ 
    ...config, 
    clientPath: "@prisma/client" 
  });
}
