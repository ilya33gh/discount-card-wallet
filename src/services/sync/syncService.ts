import { Card } from "../../types/card";
import { syncApi } from "./syncApi";
import { syncStorage } from "./syncStorage";
import { PullChangesResult, SyncService } from "./syncTypes";

class RemoteSyncService implements SyncService {
  async pushChanges(cards: Card[]): Promise<void> {
    const session = syncStorage.getSession();
    if (!session) {
      return;
    }
    await syncApi.pushCards(session, cards);
  }

  async pullChanges(since = 0): Promise<PullChangesResult> {
    const session = syncStorage.getSession();
    if (!session) {
      return {
        cards: [],
        serverTime: Date.now()
      };
    }
    return syncApi.pullCards(session, since);
  }
}

export const syncService: SyncService = new RemoteSyncService();
