/**
 * Safe wrapper for localStorage to handle SecurityErrors when cookies/localstorage
 * are blocked within iframe environments. Falls back to an in-memory storage.
 */

const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] localStorage reading blocked for key "${key}":`, e);
    }
    return memoryStorage[key] !== undefined ? memoryStorage[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`[SafeStorage] localStorage writing blocked for key "${key}":`, e);
    }
    memoryStorage[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[SafeStorage] localStorage removal blocked for key "${key}":`, e);
    }
    delete memoryStorage[key];
  }
};
