import { CardCategory } from "../../types/card";

export const CARD_CATEGORY_OPTIONS: CardCategory[] = [
  "grocery",
  "pharmacy",
  "fashion",
  "fuel",
  "cafe",
  "electronics",
  "other"
];

export const DEFAULT_CARD_CATEGORY: CardCategory = "other";

const categories = new Set<CardCategory>(CARD_CATEGORY_OPTIONS);

export const normalizeCardCategory = (value: string | undefined): CardCategory =>
  categories.has(value as CardCategory) ? (value as CardCategory) : DEFAULT_CARD_CATEGORY;
