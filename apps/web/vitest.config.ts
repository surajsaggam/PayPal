import fs from "node:fs";
import path from "node:path";

const hasZustandInstalled =
  fs.existsSync(path.resolve(__dirname, "./node_modules/zustand")) ||
  fs.existsSync(path.resolve(__dirname, "../../node_modules/zustand"));

export default {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(hasZustandInstalled
        ? {}
        : {
            zustand: path.resolve(__dirname, "./src/stores/zustand-shim.ts"),
          }),
      "@payops/shared/mock-fixtures": path.resolve(
        __dirname,
        "../../packages/shared/src/mock-fixtures.ts"
      ),
      "@payops/shared/policy-dsl": path.resolve(
        __dirname,
        "../../packages/shared/src/policy-dsl.ts"
      ),
      "@payops/shared/apimatic-validators": path.resolve(
        __dirname,
        "../../packages/shared/src/apimatic-validators.ts"
      ),
      "@payops/shared/entities": path.resolve(
        __dirname,
        "../../packages/shared/src/entities.ts"
      ),
      "@payops/shared/api-contracts": path.resolve(
        __dirname,
        "../../packages/shared/src/api-contracts.ts"
      ),
      "@payops/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["apps/web/src/**/*.test.ts", "apps/web/src/**/__tests__/*.test.ts", "src/**/*.test.ts", "src/**/__tests__/*.test.ts"],
  },
};
