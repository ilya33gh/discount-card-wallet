import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { registerAuthRoutes } from "./modules/auth/authRoutes.js";
import { registerSyncRoutes } from "./modules/sync/syncRoutes.js";
import { startTombstoneCleanupLoop } from "./modules/sync/tombstoneCleanup.js";
import { prisma } from "./db/prisma.js";

const app = Fastify({
  logger: true
});

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/((localhost)|(127\.0\.0\.1)|(\d{1,3}(\.\d{1,3}){3}))(:\d+)?$/;

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (env.corsOrigin === true) {
      callback(null, true);
      return;
    }

    if (env.corsOrigin.includes(origin) || LOCAL_ORIGIN_PATTERN.test(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: false
});

app.get("/api/health", async () => ({ status: "ok" }));

registerAuthRoutes(app);
registerSyncRoutes(app);

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    reply.code(400).send({
      message: "Validation error",
      details: error.issues
    });
    return;
  }

  app.log.error(error);
  reply.code(500).send({ message: "Internal server error" });
});

let stopTombstoneCleanup: (() => void) | null = null;

const closeApp = async () => {
  if (stopTombstoneCleanup) {
    stopTombstoneCleanup();
    stopTombstoneCleanup = null;
  }
  await app.close();
  await prisma.$disconnect();
};

process.on("SIGINT", () => {
  void closeApp();
});
process.on("SIGTERM", () => {
  void closeApp();
});

try {
  await app.listen({
    host: "0.0.0.0",
    port: env.port
  });

  stopTombstoneCleanup = startTombstoneCleanupLoop(
    app.log,
    env.tombstoneTtlDays,
    env.tombstoneCleanupIntervalMs
  );
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
