import { FastifyBaseLogger } from "fastify";
import { prisma } from "../../db/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const cleanupTombstones = async (ttlDays: number): Promise<number> => {
  const cutoff = new Date(Date.now() - ttlDays * DAY_MS);
  const result = await prisma.card.deleteMany({
    where: {
      deletedAt: {
        not: null,
        lt: cutoff
      }
    }
  });
  return result.count;
};

export const startTombstoneCleanupLoop = (
  logger: FastifyBaseLogger,
  ttlDays: number,
  intervalMs: number
): (() => void) => {
  let stopped = false;

  const run = async () => {
    if (stopped) {
      return;
    }
    try {
      const removed = await cleanupTombstones(ttlDays);
      if (removed > 0) {
        logger.info(
          { removed, ttlDays },
          "Removed expired deleted cards (tombstones)"
        );
      }
    } catch (error) {
      logger.error(error, "Tombstone cleanup failed");
    }
  };

  void run();
  const timer = setInterval(() => {
    void run();
  }, intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
};
