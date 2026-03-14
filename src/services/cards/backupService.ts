import { cardRepository } from "../database/cardRepository";
import { sanitizeText } from "../../utils/validation";
import { Card, BarcodeType, CardCategory, CardColor } from "../../types/card";
import { normalizeCardCategory } from "./cardCategories";
import { normalizeCardColor } from "./cardColors";

interface CardBackupPayload {
  version: 1;
  exportedAt: number;
  cards: Card[];
}

const BARCODE_TYPES: BarcodeType[] = ["EAN13", "CODE128", "QR"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseBarcodeType = (value: unknown): BarcodeType | null => {
  if (typeof value !== "string") {
    return null;
  }
  return BARCODE_TYPES.includes(value as BarcodeType) ? (value as BarcodeType) : null;
};

const normalizeImportedCard = (raw: unknown): Card | null => {
  if (!isRecord(raw)) {
    return null;
  }
  if (typeof raw.id !== "string" || !raw.id.trim()) {
    return null;
  }

  const barcodeType = parseBarcodeType(raw.barcodeType);
  if (!barcodeType) {
    return null;
  }

  const createdAt = Number(raw.createdAt);
  const updatedAt = Number(raw.updatedAt);
  if (!Number.isFinite(createdAt) || !Number.isFinite(updatedAt)) {
    return null;
  }

  const deletedAtRaw = raw.deletedAt;
  const deletedAt =
    deletedAtRaw === null || typeof deletedAtRaw === "undefined"
      ? null
      : Number(deletedAtRaw);
  if (deletedAt !== null && !Number.isFinite(deletedAt)) {
    return null;
  }
  const usageCountRaw = Number(raw.usageCount);
  const usageCount = Number.isFinite(usageCountRaw) && usageCountRaw >= 0 ? Math.trunc(usageCountRaw) : 0;

  const lastUsedAtRaw = raw.lastUsedAt;
  const lastUsedAt =
    lastUsedAtRaw === null || typeof lastUsedAtRaw === "undefined"
      ? null
      : Number(lastUsedAtRaw);
  if (lastUsedAt !== null && !Number.isFinite(lastUsedAt)) {
    return null;
  }

  const normalizedNumber = sanitizeText(typeof raw.number === "string" ? raw.number : "", 80);
  if (!normalizedNumber) {
    return null;
  }

  return {
    id: raw.id.trim(),
    name: sanitizeText(typeof raw.name === "string" ? raw.name : "", 80) || "Unnamed card",
    number: normalizedNumber,
    barcodeType,
    cardColor: normalizeCardColor((raw.cardColor as CardColor | undefined) ?? "blue"),
    category: normalizeCardCategory((raw.category as CardCategory | undefined) ?? "other"),
    favorite: Boolean(raw.favorite),
    notes: sanitizeText(typeof raw.notes === "string" ? raw.notes : "", 400),
    logoDataUrl: typeof raw.logoDataUrl === "string" ? raw.logoDataUrl : null,
    createdAt: Math.trunc(createdAt),
    updatedAt: Math.trunc(updatedAt),
    deletedAt: deletedAt === null ? null : Math.trunc(deletedAt),
    usageCount,
    lastUsedAt: lastUsedAt === null ? null : Math.trunc(lastUsedAt)
  };
};

const parseBackupCards = (parsed: unknown): unknown[] => {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (isRecord(parsed) && Array.isArray(parsed.cards)) {
    return parsed.cards;
  }
  throw new Error("Invalid backup file format");
};

export const backupService = {
  async exportJson(): Promise<string> {
    const cards = await cardRepository.listAll();
    const payload: CardBackupPayload = {
      version: 1,
      exportedAt: Date.now(),
      cards
    };
    return JSON.stringify(payload, null, 2);
  },

  async importJson(
    rawJson: string,
    options?: { offlineMode?: boolean }
  ): Promise<{ imported: number; skipped: number }> {
    const parsed = JSON.parse(rawJson) as unknown;
    const cardsRaw = parseBackupCards(parsed);

    const dedupedById = new Map<string, Card>();
    let skipped = 0;

    for (const item of cardsRaw) {
      const card = normalizeImportedCard(item);
      if (!card) {
        skipped += 1;
        continue;
      }
      if (card.deletedAt !== null) {
        skipped += 1;
        continue;
      }

      const existing = dedupedById.get(card.id);
      if (!existing || card.updatedAt > existing.updatedAt) {
        dedupedById.set(card.id, card);
      }
    }

    const cards = Array.from(dedupedById.values()).map((card) => {
      if (!options?.offlineMode) {
        return card;
      }
      return {
        ...card,
        // Offline import should always restore visible cards locally.
        deletedAt: null,
        updatedAt: Date.now(),
        lastUsedAt: card.lastUsedAt ?? null
      };
    });
    await cardRepository.mergeMany(cards);

    return {
      imported: cards.length,
      skipped
    };
  }
};
