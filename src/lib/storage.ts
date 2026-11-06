"use client";

/**
 * Tiny localStorage-backed external store.
 *
 * - SSR safe: nothing is read until the first client snapshot.
 * - Hydration safe: `getServerSnapshot` returns a stable reference.
 * - Cross-tab sync via the `storage` event.
 * - Falls back to in-memory state when storage is unavailable
 *   (private mode, disabled cookies, quota errors) instead of throwing.
 */

type Listener = () => void;

export interface JsonStore<T> {
  subscribe(listener: Listener): () => void;
  getSnapshot(): T;
  getServerSnapshot(): T;
  set(value: T): void;
  update(updater: (current: T) => T): void;
  reset(): void;
  /** True once we know storage is unavailable for this store. */
  isVolatile(): boolean;
}

function safeParse<T>(raw: string | null, fallback: T, isValid: (value: unknown) => value is T): T {
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function createJsonStore<T>(
  key: string,
  empty: T,
  isValid: (value: unknown) => value is T,
): JsonStore<T> {
  const listeners = new Set<Listener>();
  let cache: T | null = null;
  let volatile = false;

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const read = (): T => {
    if (typeof window === "undefined") return empty;
    try {
      const raw = window.localStorage.getItem(key);
      return safeParse(raw, empty, isValid);
    } catch {
      volatile = true;
      return empty;
    }
  };

  const write = (value: T) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      volatile = false;
    } catch {
      volatile = true;
    }
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return;
    cache = read();
    emit();
  };

  const getSnapshot = (): T => {
    if (cache === null) cache = read();
    return cache;
  };

  const set = (value: T) => {
    cache = value;
    write(value);
    emit();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (typeof window !== "undefined" && listeners.size === 1) {
        window.addEventListener("storage", onStorage);
      }
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined" && listeners.size === 0) {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
    getSnapshot,
    getServerSnapshot() {
      return empty;
    },
    set,
    update(updater) {
      const current = getSnapshot();
      const next = updater(current);
      if (next === current) return;
      set(next);
    },
    reset() {
      cache = empty;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(key);
        } catch {
          volatile = true;
        }
      }
      emit();
    },
    isVolatile() {
      return volatile;
    },
  };
}
