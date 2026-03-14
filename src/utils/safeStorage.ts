const memoryStore = new Map<string, string>();

const isLocalStorageAvailable = (): boolean => {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
};

export const safeStorage = {
  getItem(key: string): string | null {
    if (isLocalStorageAvailable()) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStore.get(key) ?? null;
      }
    }
    return memoryStore.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // fall through to memoryStore
      }
    }
    memoryStore.set(key, value);
  },

  removeItem(key: string): void {
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // fall through to memoryStore
      }
    }
    memoryStore.delete(key);
  }
};
