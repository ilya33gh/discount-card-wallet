import { syncApi } from "./syncApi";
import { syncStorage } from "./syncStorage";
import { SyncSession } from "./syncTypes";

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const accountService = {
  getSession(): SyncSession | null {
    return syncStorage.getSession();
  },

  async register(email: string, password: string): Promise<SyncSession> {
    const auth = await syncApi.register(normalizeEmail(email), password);
    const session: SyncSession = {
      token: auth.token,
      user: auth.user
    };
    syncStorage.setSession(session);
    return session;
  },

  async login(email: string, password: string): Promise<SyncSession> {
    const auth = await syncApi.login(normalizeEmail(email), password);
    const session: SyncSession = {
      token: auth.token,
      user: auth.user
    };
    syncStorage.setSession(session);
    return session;
  },

  async validateSession(): Promise<SyncSession | null> {
    const session = syncStorage.getSession();
    if (!session) {
      return null;
    }

    try {
      await syncApi.me(session);
      return session;
    } catch {
      syncStorage.clearSession();
      return null;
    }
  },

  logout(): void {
    const session = syncStorage.getSession();
    if (session) {
      syncStorage.clearCursor(session.user.id);
    }
    syncStorage.clearSession();
  }
};
