import { db } from "./db";
import { Card, CardCreateInput, CardUpdateInput } from "../../types/card";
import { sanitizeCardInput } from "../../utils/validation";
import { DEFAULT_CARD_COLOR, normalizeCardColor } from "../cards/cardColors";
import {
  DEFAULT_CARD_CATEGORY,
  normalizeCardCategory
} from "../cards/cardCategories";

const byRecentUpdate = (a: Card, b: Card): number => b.updatedAt - a.updatedAt;

const withUsageDefaults = (card: Card): Card => ({
  ...card,
  usageCount: typeof card.usageCount === "number" ? card.usageCount : 0,
  lastUsedAt: typeof card.lastUsedAt === "number" ? card.lastUsedAt : null
});

const generateCardId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const cardRepository = {
  async listActive(): Promise<Card[]> {
    const cards = await db.cards
      .filter((card) => card.deletedAt === null)
      .toArray();
    return cards.map(withUsageDefaults).sort(byRecentUpdate);
  },

  async listAll(): Promise<Card[]> {
    const cards = await db.cards.toArray();
    return cards.map(withUsageDefaults).sort(byRecentUpdate);
  },

  async getById(id: string): Promise<Card | null> {
    const card = await db.cards.get(id);
    if (!card || card.deletedAt !== null) {
      return null;
    }
    return withUsageDefaults(card);
  },

  async create(input: CardCreateInput): Promise<Card> {
    const now = Date.now();
    const cleanInput = sanitizeCardInput(input) as CardCreateInput;
    const card: Card = {
      id: generateCardId(),
      name: cleanInput.name,
      number: cleanInput.number,
      barcodeType: cleanInput.barcodeType,
      cardColor: normalizeCardColor(cleanInput.cardColor ?? DEFAULT_CARD_COLOR),
      category: normalizeCardCategory(cleanInput.category ?? DEFAULT_CARD_CATEGORY),
      favorite: cleanInput.favorite ?? false,
      notes: cleanInput.notes ?? "",
      logoDataUrl: cleanInput.logoDataUrl ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      usageCount: 0,
      lastUsedAt: null
    };

    await db.cards.add(card);
    return card;
  },

  async update(id: string, input: CardUpdateInput): Promise<boolean> {
    const cleanInput = sanitizeCardInput(input) as CardUpdateInput;
    const updates: CardUpdateInput & { updatedAt: number } = {
      ...cleanInput,
      updatedAt: Date.now()
    };
    if (cleanInput.cardColor) {
      updates.cardColor = normalizeCardColor(cleanInput.cardColor);
    }
    if (cleanInput.category) {
      updates.category = normalizeCardCategory(cleanInput.category);
    }

    const updatedRows = await db.cards.update(id, updates);
    return updatedRows > 0;
  },

  async toggleFavorite(id: string, favorite: boolean): Promise<boolean> {
    const updatedRows = await db.cards.update(id, {
      favorite,
      updatedAt: Date.now()
    });
    return updatedRows > 0;
  },

  async softDelete(id: string): Promise<boolean> {
    const updatedRows = await db.cards.update(id, {
      deletedAt: Date.now(),
      updatedAt: Date.now()
    });
    return updatedRows > 0;
  },

  async trackUsage(id: string): Promise<boolean> {
    const card = await db.cards.get(id);
    if (!card || card.deletedAt !== null) {
      return false;
    }

    const now = Date.now();
    const nextCount = (typeof card.usageCount === "number" ? card.usageCount : 0) + 1;
    const updatedRows = await db.cards.update(id, {
      usageCount: nextCount,
      lastUsedAt: now,
      updatedAt: now
    });
    return updatedRows > 0;
  },

  async mergeMany(cards: Card[]): Promise<void> {
    await db.transaction("rw", db.cards, async () => {
      for (const incoming of cards) {
        const existing = await db.cards.get(incoming.id);
        const normalizedIncoming = withUsageDefaults(incoming);
        if (!existing || normalizedIncoming.updatedAt > existing.updatedAt) {
          await db.cards.put(normalizedIncoming);
        }
      }
    });
  },

  async replaceAll(cards: Card[]): Promise<void> {
    await db.transaction("rw", db.cards, async () => {
      await db.cards.clear();
      if (cards.length > 0) {
        await db.cards.bulkPut(cards);
      }
    });
  }
};
