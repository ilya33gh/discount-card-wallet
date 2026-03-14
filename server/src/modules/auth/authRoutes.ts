import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { credentialsSchema } from "./authSchemas.js";
import { createAuthToken, getAuthUserFromRequest } from "./authToken.js";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const RATE_LIMIT_WINDOW_LOGIN_MS = 10 * 60 * 1000;
const RATE_LIMIT_WINDOW_REGISTER_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_LOGIN = 10;
const RATE_LIMIT_MAX_REGISTER = 5;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const loginBuckets = new Map<string, RateLimitBucket>();
const registerBuckets = new Map<string, RateLimitBucket>();

const consumeRateLimit = (
  buckets: Map<string, RateLimitBucket>,
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterSec?: number } => {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true };
};

const cleanupRateLimitBuckets = (
  buckets: Map<string, RateLimitBucket>,
  limit = 5000
): void => {
  if (buckets.size < limit) {
    return;
  }
  const now = Date.now();
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

export const registerAuthRoutes = (fastify: FastifyInstance): void => {
  fastify.post("/api/auth/register", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    const rateLimitKey = `${request.ip}:${parsed.success ? normalizeEmail(parsed.data.email) : "unknown"}`;
    const registerRateLimit = consumeRateLimit(
      registerBuckets,
      rateLimitKey,
      RATE_LIMIT_MAX_REGISTER,
      RATE_LIMIT_WINDOW_REGISTER_MS
    );
    if (!registerRateLimit.allowed) {
      reply.header("Retry-After", String(registerRateLimit.retryAfterSec ?? 60));
      return reply.code(429).send({
        message: "Too many registration attempts. Please try again later."
      });
    }
    cleanupRateLimitBuckets(registerBuckets);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid credentials payload"
      });
    }

    const email = normalizeEmail(parsed.data.email);
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash
        },
        select: {
          id: true,
          email: true
        }
      });

      return reply.code(201).send({
        token: createAuthToken(user),
        user
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return reply.code(409).send({ message: "Email already exists" });
      }
      throw error;
    }
  });

  fastify.post("/api/auth/login", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    const rateLimitKey = `${request.ip}:${parsed.success ? normalizeEmail(parsed.data.email) : "unknown"}`;
    const loginRateLimit = consumeRateLimit(
      loginBuckets,
      rateLimitKey,
      RATE_LIMIT_MAX_LOGIN,
      RATE_LIMIT_WINDOW_LOGIN_MS
    );
    if (!loginRateLimit.allowed) {
      reply.header("Retry-After", String(loginRateLimit.retryAfterSec ?? 60));
      return reply.code(429).send({
        message: "Too many login attempts. Please try again later."
      });
    }
    cleanupRateLimitBuckets(loginBuckets);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid credentials payload"
      });
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true
      }
    });

    if (!user) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passwordMatch) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    return reply.send({
      token: createAuthToken({ id: user.id, email: user.email }),
      user: {
        id: user.id,
        email: user.email
      }
    });
  });

  fastify.get("/api/auth/me", async (request, reply) => {
    const authUser = getAuthUserFromRequest(request);
    if (!authUser) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true }
    });

    if (!user) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    return reply.send({ user });
  });
};
