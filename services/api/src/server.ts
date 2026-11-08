/**
 * PayOps AI (PayPal Sentinel) — Fastify 5.1 Server Entrypoint
 * Usage: pnpm --filter @payops/api dev | pnpm --filter @payops/api start
 */

import { buildApp } from "./app.js";
import { envConfig } from "./config/env.js";
import { logger } from "./lib/logger.js";

async function startServer(): Promise<void> {
  const app = await buildApp({ logger: false });
  const port = envConfig.port;

  await app.listen({ host: "0.0.0.0", port });
  logger.info(
    {
      port,
      storageMode: "dual-mode-ready",
      paypalEnvironment: envConfig.paypalEnvironment,
    },
    `PayOps AI (PayPal Sentinel) API listening on http://0.0.0.0:${port}`
  );

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down PayOps API server gracefully");
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("server.ts") ||
  process.argv[1]?.endsWith("server.js")
) {
  startServer().catch((err) => {
    console.error("Failed to start PayOps API server:", err);
    process.exit(1);
  });
}

export { buildApp };
