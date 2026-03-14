import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { cardService } from "../services/cards/cardService";
import { Card, CardCategory } from "../types/card";
import { normalizeCardCategory } from "../services/cards/cardCategories";

const normalize = (value: string): string => value.trim().toLowerCase();
export type CardCategoryFilter = "all" | CardCategory;
export type CardSortMode = "date_added" | "alphabetical" | "usage";

const sortCards = (cards: Card[], sortMode: CardSortMode) => {
  const sorted = [...cards];
  if (sortMode === "alphabetical") {
    return sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }
  if (sortMode === "usage") {
    return sorted.sort((a, b) => {
      const usageDiff = (b.usageCount ?? 0) - (a.usageCount ?? 0);
      if (usageDiff !== 0) {
        return usageDiff;
      }
      const lastUsedDiff = (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0);
      if (lastUsedDiff !== 0) {
        return lastUsedDiff;
      }
      return b.updatedAt - a.updatedAt;
    });
  }
  return sorted.sort((a, b) => b.createdAt - a.createdAt);
};

export const useCards = (
  searchTerm: string,
  category: CardCategoryFilter,
  sortMode: CardSortMode
) => {
  const cards = useLiveQuery(() => cardService.listActiveCards(), [], []);

  const filteredCards = useMemo(() => {
    const list = cards ?? [];
    const query = normalize(searchTerm);
    const filtered = list.filter((card) => {
      if (category !== "all" && normalizeCardCategory(card.category) !== category) {
        return false;
      }
      if (!query) {
        return true;
      }
      const text = `${card.name} ${card.number}`.toLowerCase();
      return text.includes(query);
    });

    return sortCards(filtered, sortMode);
  }, [cards, searchTerm, category, sortMode]);

  const favoriteCards = useMemo(
    () => filteredCards.filter((card) => card.favorite),
    [filteredCards]
  );

  return {
    cards: filteredCards,
    favoriteCards,
    isLoading: cards === undefined
  };
};

export const useCard = (id: string | undefined) =>
  useLiveQuery(
    async () => {
      if (!id) {
        return null;
      }
      return cardService.getCardById(id);
    },
    [id],
    undefined
  );
