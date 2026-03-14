import { SyncSession } from "./syncTypes";

const SYNC_SERVER_URL_KEY = "dcw.sync.server_url";
const SYNC_SESSION_KEY = "dcw.sync.session";
const SYNC_CURSOR_PREFIX = "dcw.sync.cursor.";

const DEFAULT_SYNC_SERVER_URL = "http://localhost:8787";

const safeReadJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const normalizeServerUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const syncStorage = {
  getServerUrl(): string {
    const saved = localStorage.getItem(SYNC_SERVER_URL_KEY);
    const normalized = saved ? normalizeServerUrl(saved) : DEFAULT_SYNC_SERVER_URL;
    return normalized || DEFAULT_SYNC_SERVER_URL;
  },

  setServerUrl(url: string): void {
    const normalized = normalizeServerUrl(url);
    localStorage.setItem(SYNC_SERVER_URL_KEY, normalized || DEFAULT_SYNC_SERVER_URL);
  },

  getSession(): SyncSession | null {
    const parsed = safeReadJson<SyncSession>(localStorage.getItem(SYNC_SESSION_KEY));
    if (!parsed?.token || !parsed?.user?.id || !parsed?.user?.email) {
      return null;
    }
    return parsed;
  },

  setSession(session: SyncSession | null): void {
    if (!session) {
      localStorage.removeItem(SYNC_SESSION_KEY);
      return;
    }
    localStorage.setItem(SYNC_SESSION_KEY, JSON.stringify(session));
  },

  clearSession(): void {
    localStorage.removeItem(SYNC_SESSION_KEY);
  },

  getCursor(userId: string): number {
    const raw = localStorage.getItem(`${SYNC_CURSOR_PREFIX}${userId}`);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  },

  setCursor(userId: string, value: number): void {
    localStorage.setItem(`${SYNC_CURSOR_PREFIX}${userId}`, String(value));
  },

  clearCursor(userId: string): void {
    localStorage.removeItem(`${SYNC_CURSOR_PREFIX}${userId}`);
  }
};
