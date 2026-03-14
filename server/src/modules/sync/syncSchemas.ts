import { z } from "zod";

const BARCODE_TYPES = ["EAN13", "CODE128", "QR"] as const;
const CARD_COLORS = ["blue", "green", "orange", "purple", "gray"] as const;
const CARD_CATEGORIES = [
  "grocery",
  "pharmacy",
  "fashion",
  "fuel",
  "cafe",
  "electronics",
  "other"
] as const;

export const syncCardSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(120),
  number: z.string().min(1).max(512),
  barcodeType: z.enum(BARCODE_TYPES),
  cardColor: z.enum(CARD_COLORS),
  category: z.enum(CARD_CATEGORIES),
  favorite: z.boolean(),
  notes: z.string().max(1200),
  logoDataUrl: z.string().max(2_000_000).nullable(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  deletedAt: z.number().int().nonnegative().nullable(),
  usageCount: z.number().int().nonnegative(),
  lastUsedAt: z.number().int().nonnegative().nullable()
});

export const syncPushSchema = z.object({
  cards: z.array(syncCardSchema).max(2000)
});

export const syncPullSchema = z.object({
  since: z.number().int().nonnegative().optional()
});

export type SyncCardPayload = z.infer<typeof syncCardSchema>;
