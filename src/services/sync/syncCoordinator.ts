import { cardRepository } from "../database/cardRepository";
import { syncStorage } from "./syncStorage";
import { syncService } from "./syncService";

const AUTO_SYNC_DELAY_MS = 1200;

export type SyncPhase =
  | "idle"
  | "scheduled"
  | "syncing"
  | "restoring"
  | "success"
  | "error";

export interface SyncState {
  phase: SyncPhase;
  lastSuccessAt: number | null;
  lastError: string | null;
}

type SyncStateListener = (state: SyncState) => void;

let scheduledTimer: number | null = null;
let runningSync: Promise<void> | null = null;
let syncState: SyncState = {
  phase: "idle",
  lastSuccessAt: null,
  lastError: null
};
const listeners = new Set<SyncStateListener>();

const emitSyncState = (): void => {
  for (const listener of listeners) {
    listener(syncState);
  }
};

const setSyncState = (patch: Partial<SyncState>): void => {
  syncState = {
    ...syncState,
    ...patch
  };
  emitSyncState();
};

const clearScheduledTimer = (): void => {
  if (scheduledTimer !== null) {
    window.clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
};

const runSyncInternal = async (): Promise<void> => {
  const session = syncStorage.getSession();
  if (!session) {
    return;
  }

  const localCards = await cardRepository.listAll();
  await syncService.pushChanges(localCards);

  const cursor = syncStorage.getCursor(session.user.id);
  const pulled = await syncService.pullChanges(cursor);
  await cardRepository.mergeMany(pulled.cards);
  syncStorage.setCursor(session.user.id, pulled.serverTime);
};

const runRestoreFromServerInternal = async (): Promise<void> => {
  const session = syncStorage.getSession();
  if (!session) {
    return;
  }

  const pulled = await syncService.pullChanges(0);
  await cardRepository.replaceAll(pulled.cards);
  syncStorage.setCursor(session.user.id, pulled.serverTime);
};

const runExclusive = async (task: () => Promise<void>): Promise<void> => {
  if (!runningSync) {
    runningSync = task().finally(() => {
      runningSync = null;
    });
  }
  await runningSync;
};

export const syncCoordinator = {
  getState(): SyncState {
    return syncState;
  },

  subscribe(listener: SyncStateListener): () => void {
    listeners.add(listener);
    listener(syncState);
    return () => {
      listeners.delete(listener);
    };
  },

  async syncNow(): Promise<void> {
    clearScheduledTimer();
    setSyncState({
      phase: "syncing",
      lastError: null
    });
    try {
      await runExclusive(runSyncInternal);
      setSyncState({
        phase: "success",
        lastSuccessAt: Date.now(),
        lastError: null
      });
    } catch (error) {
      setSyncState({
        phase: "error",
        lastError: error instanceof Error ? error.message : "Sync failed"
      });
      throw error;
    }
  },

  async restoreFromServer(): Promise<void> {
    clearScheduledTimer();
    setSyncState({
      phase: "restoring",
      lastError: null
    });
    try {
      await runExclusive(runRestoreFromServerInternal);
      setSyncState({
        phase: "success",
        lastSuccessAt: Date.now(),
        lastError: null
      });
    } catch (error) {
      setSyncState({
        phase: "error",
        lastError: error instanceof Error ? error.message : "Restore failed"
      });
      throw error;
    }
  },

  requestAutoSync(): void {
    if (!syncStorage.getSession()) {
      return;
    }
    clearScheduledTimer();
    setSyncState({
      phase: "scheduled",
      lastError: null
    });
    scheduledTimer = window.setTimeout(() => {
      void this.syncNow();
    }, AUTO_SYNC_DELAY_MS);
  }
};
