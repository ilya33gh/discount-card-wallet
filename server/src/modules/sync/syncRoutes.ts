import { FastifyInstance } from "fastify";
import { prisma } from "../../db/prisma.js";
import { getAuthUserFromRequest } from "../auth/authToken.js";
import { syncPullSchema, syncPushSchema } from "./syncSchemas.js";

const toDate = (timestamp: number): Date => new Date(timestamp);
const toTimestamp = (value: Date | null): number | null =>
  value ? value.getTime() : null;

export const registerSyncRoutes = (fastify: FastifyInstance): void => {
  fastify.post("/api/sync/push", async (request, reply) => {
    const authUser = getAuthUserFromRequest(request);
    if (!authUser) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const parsed = syncPushSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid sync push payload" });
    }

    let applied = 0;
    await prisma.$transaction(async (tx) => {
      for (const incoming of parsed.data.cards) {
        const validCard = incoming;
        const existing = await tx.card.findUnique({
          where: {
            userId_id: {
              userId: authUser.id,
              id: validCard.id
            }
          },
          select: {
            updatedAt: true
          }
        });

        if (existing && validCard.updatedAt <= existing.updatedAt.getTime()) {
          continue;
        }

        if (!existing) {
          await tx.card.create({
            data: {
              userId: authUser.id,
              id: validCard.id,
              name: validCard.name,
              number: validCard.number,
              barcodeType: validCard.barcodeType,
              cardColor: validCard.cardColor,
              category: validCard.category,
              favorite: validCard.favorite,
              notes: validCard.notes,
              logoDataUrl: validCard.logoDataUrl,
              createdAt: toDate(validCard.createdAt),
              updatedAt: toDate(validCard.updatedAt),
              deletedAt: validCard.deletedAt === null ? null : toDate(validCard.deletedAt),
              usageCount: validCard.usageCount,
              lastUsedAt: validCard.lastUsedAt === null ? null : toDate(validCard.lastUsedAt)
            }
          });
          applied += 1;
          continue;
        }

        await tx.card.update({
          where: {
            userId_id: {
              userId: authUser.id,
              id: validCard.id
            }
          },
          data: {
            name: validCard.name,
            number: validCard.number,
            barcodeType: validCard.barcodeType,
            cardColor: validCard.cardColor,
            category: validCard.category,
            favorite: validCard.favorite,
            notes: validCard.notes,
            logoDataUrl: validCard.logoDataUrl,
            createdAt: toDate(validCard.createdAt),
            updatedAt: toDate(validCard.updatedAt),
            deletedAt: validCard.deletedAt === null ? null : toDate(validCard.deletedAt),
            usageCount: validCard.usageCount,
            lastUsedAt: validCard.lastUsedAt === null ? null : toDate(validCard.lastUsedAt)
          }
        });

        applied += 1;
      }
    });

    return reply.send({ applied });
  });

  fastify.post("/api/sync/pull", async (request, reply) => {
    const authUser = getAuthUserFromRequest(request);
    if (!authUser) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const parsed = syncPullSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid sync pull payload" });
    }

    const since = parsed.data.since ?? 0;
    const sinceDate = new Date(since);

    const cards = await prisma.card.findMany({
      where: {
        userId: authUser.id,
        updatedAt: {
          gt: sinceDate
        }
      },
      orderBy: {
        updatedAt: "asc"
      }
    });

    return reply.send({
      cards: cards.map((card) => ({
        id: card.id,
        name: card.name,
        number: card.number,
        barcodeType: card.barcodeType,
        cardColor: card.cardColor,
        category: card.category,
        favorite: card.favorite,
        notes: card.notes,
        logoDataUrl: card.logoDataUrl,
        createdAt: card.createdAt.getTime(),
        updatedAt: card.updatedAt.getTime(),
        deletedAt: toTimestamp(card.deletedAt),
        usageCount: card.usageCount,
        lastUsedAt: toTimestamp(card.lastUsedAt)
      })),
      serverTime: Date.now()
    });
  });

  fastify.get("/api/sync/stats", async (request, reply) => {
    const authUser = getAuthUserFromRequest(request);
    if (!authUser) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const [totalCards, activeCards] = await prisma.$transaction([
      prisma.card.count({
        where: {
          userId: authUser.id
        }
      }),
      prisma.card.count({
        where: {
          userId: authUser.id,
          deletedAt: null
        }
      })
    ]);

    return reply.send({
      totalCards,
      activeCards
    });
  });
};
