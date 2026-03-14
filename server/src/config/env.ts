import "dotenv/config";

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value ?? "8787");
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
    return 8787;
  }
  return Math.trunc(parsed);
};

const parseIntWithBounds = (
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number => {
  const parsed = Number(value ?? String(fallback));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const integer = Math.trunc(parsed);
  if (integer < min || integer > max) {
    return fallback;
  }
  return integer;
};

const parseOrigins = (value: string | undefined): string[] | true => {
  if (!value || value.trim() === "*") {
    return true;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const env = {
  port: parsePort(process.env.PORT),
  corsOrigin: parseOrigins(process.env.CORS_ORIGIN),
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  tombstoneTtlDays: parseIntWithBounds(process.env.TOMBSTONE_TTL_DAYS, 60, 1, 3650),
  tombstoneCleanupIntervalMs:
    parseIntWithBounds(process.env.TOMBSTONE_CLEANUP_INTERVAL_MINUTES, 360, 5, 10_080) *
    60 *
    1000
};
