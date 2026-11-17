import { createApp } from "./app.js";
import { database } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";

async function bootstrap(): Promise<void> {
  validateEnv();

  await database.connect();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] Lost & Found API listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await database.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("[server] Failed to start server:", error);
  process.exit(1);
});
