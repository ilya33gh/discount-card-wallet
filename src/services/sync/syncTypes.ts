import { Card } from "../../types/card";

export interface SyncUser {
  id: string;
  email: string;
}

export interface SyncSession {
  token: string;
  user: SyncUser;
}

export interface PullChangesResult {
  cards: Card[];
  serverTime: number;
}

export interface SyncStats {
  activeCards: number;
  totalCards: number;
}

export interface SyncService {
  pushChanges(cards: Card[]): Promise<void>;
  pullChanges(since?: number): Promise<PullChangesResult>;
}
