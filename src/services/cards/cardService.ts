import { Card, CardCreateInput, CardUpdateInput } from "../../types/card";
import { cardRepository } from "../database/cardRepository";
import { syncCoordinator } from "../sync/syncCoordinator";

export const cardService = {
  async listActiveCards(): Promise<Card[]> {
    return cardRepository.listActive();
  },

  async getCardById(id: string): Promise<Card | null> {
    return cardRepository.getById(id);
  },

  async createCard(input: CardCreateInput): Promise<Card> {
    const card = await cardRepository.create(input);
    syncCoordinator.requestAutoSync();
    return card;
  },

  async updateCard(id: string, input: CardUpdateInput): Promise<boolean> {
    const updated = await cardRepository.update(id, input);
    if (updated) {
      syncCoordinator.requestAutoSync();
    }
    return updated;
  },

  async setFavorite(id: string, favorite: boolean): Promise<boolean> {
    const updated = await cardRepository.toggleFavorite(id, favorite);
    if (updated) {
      syncCoordinator.requestAutoSync();
    }
    return updated;
  },

  async deleteCard(id: string): Promise<boolean> {
    const deleted = await cardRepository.softDelete(id);
    if (deleted) {
      syncCoordinator.requestAutoSync();
    }
    return deleted;
  },

  async trackUsage(id: string): Promise<boolean> {
    const tracked = await cardRepository.trackUsage(id);
    if (tracked) {
      syncCoordinator.requestAutoSync();
    }
    return tracked;
  },

  async listAllCards(): Promise<Card[]> {
    return cardRepository.listAll();
  },

  async mergeRemoteCards(cards: Card[]): Promise<void> {
    await cardRepository.mergeMany(cards);
  }
};
