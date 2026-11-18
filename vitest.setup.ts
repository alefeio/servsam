import "@testing-library/jest-dom/vitest";

/**
 * Node 22+ exposes a broken global localStorage stub unless --localstorage-file is set.
 * Prefer the jsdom Storage when the Node stub is unusable.
 */
function ensureLocalStorage() {
  const candidate = (globalThis as { localStorage?: Storage }).localStorage;
  if (candidate && typeof candidate.clear === "function") {
    return;
  }

  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: polyfill,
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      writable: true,
      value: polyfill,
    });
  }
}

ensureLocalStorage();
