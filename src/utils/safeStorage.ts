/**
 * Safe wrapper for localStorage to handle SecurityErrors when cookies/localstorage
 * are blocked within iframe environments. Falls back to an in-memory storage.
 */

const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  get isInMemory(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return false;
    } catch (e) {
      return true;
    }
  },

  get isIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  },

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
