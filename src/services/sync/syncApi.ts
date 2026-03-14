import { Card } from "../../types/card";
import { PullChangesResult, SyncSession, SyncStats } from "./syncTypes";
import { syncStorage } from "./syncStorage";

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

const buildUrl = (path: string): string => `${syncStorage.getServerUrl()}${path}`;

const requestJson = async <TResponse>(
  path: string,
  init: RequestInit,
  session?: SyncSession
): Promise<TResponse> => {
  const headers = new Headers(init.headers ?? {});
  if (typeof init.body !== "undefined") {
    headers.set("Content-Type", "application/json");
  }
  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      headers
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Failed to fetch";
    throw new Error(
      `Network error (${details}). Check server URL, CORS origin and Windows firewall.`
    );
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  return (await response.json()) as TResponse;
};

export const syncApi = {
  async health(): Promise<{ status: string }> {
    return requestJson<{ status: string }>("/api/health", {
      method: "GET"
    });
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    return requestJson<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return requestJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  async me(session: SyncSession): Promise<{ user: { id: string; email: string } }> {
    return requestJson("/api/auth/me", { method: "GET" }, session);
  },

  async pushCards(session: SyncSession, cards: Card[]): Promise<void> {
    await requestJson<{ applied: number }>(
      "/api/sync/push",
      {
        method: "POST",
        body: JSON.stringify({ cards })
      },
      session
    );
  },

  async pullCards(session: SyncSession, since = 0): Promise<PullChangesResult> {
    return requestJson<PullChangesResult>(
      "/api/sync/pull",
      {
        method: "POST",
        body: JSON.stringify({ since })
      },
      session
    );
  },

  async stats(session: SyncSession): Promise<SyncStats> {
    return requestJson<SyncStats>(
      "/api/sync/stats",
      {
        method: "GET"
      },
      session
    );
  }
};
