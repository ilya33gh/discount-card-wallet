import Dexie, { Table } from "dexie";
import { Card } from "../../types/card";
import { DEFAULT_CARD_CATEGORY } from "../cards/cardCategories";

class DiscountCardWalletDB extends Dexie {
  cards!: Table<Card, string>;

  constructor() {
    super("discountCardWallet");
    this.version(1).stores({
      cards: "id, favorite, createdAt, updatedAt, deletedAt"
    });
    this.version(2)
      .stores({
        cards: "id, category, favorite, createdAt, updatedAt, deletedAt"
      })
      .upgrade(async (tx) => {
        await tx
          .table("cards")
          .toCollection()
          .modify((card: Card) => {
            if (!card.category) {
              card.category = DEFAULT_CARD_CATEGORY;
            }
          });
      });
    this.version(3)
      .stores({
        cards:
          "id, category, favorite, usageCount, lastUsedAt, createdAt, updatedAt, deletedAt"
      })
      .upgrade(async (tx) => {
        await tx
          .table("cards")
          .toCollection()
          .modify((card: Card) => {
            if (typeof card.usageCount !== "number") {
              card.usageCount = 0;
            }
            if (typeof card.lastUsedAt !== "number" && card.lastUsedAt !== null) {
              card.lastUsedAt = null;
            }
          });
      });
  }
}

export const db = new DiscountCardWalletDB();
