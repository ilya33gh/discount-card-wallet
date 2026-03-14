import jwt from "jsonwebtoken";
import { FastifyRequest } from "fastify";
import { env } from "../../config/env.js";

export interface AuthUser {
  id: string;
  email: string;
}

interface TokenPayload {
  sub: string;
  email: string;
}

export const createAuthToken = (user: AuthUser): string =>
  jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: "30d"
  });

export const getAuthUserFromRequest = (request: FastifyRequest): AuthUser | null => {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    if (!payload.sub || !payload.email) {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email
    };
  } catch {
    return null;
  }
};
