import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedSrc = path.resolve(__dirname, "../../packages/shared/src");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@payops/shared"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias || {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@payops/shared/mock-fixtures": path.join(sharedSrc, "mock-fixtures.ts"),
      "@payops/shared/policy-dsl": path.join(sharedSrc, "policy-dsl.ts"),
      "@payops/shared/apimatic-validators": path.join(sharedSrc, "apimatic-validators.ts"),
      "@payops/shared/entities": path.join(sharedSrc, "entities.ts"),
      "@payops/shared/api-contracts": path.join(sharedSrc, "api-contracts.ts"),
      "@payops/shared": path.join(sharedSrc, "index.ts"),
    };
    return config;
  },
};

export default nextConfig;
