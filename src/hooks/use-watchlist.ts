"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isInWatchlist, toggleWatchlist, watchlistStore } from "@/lib/watchlist";
import type { WatchlistItem } from "@/types";

export interface UseWatchlist {
  items: WatchlistItem[];
  slugs: string[];
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => boolean;
  ready: boolean;
}

export function useWatchlist(): UseWatchlist {
  const items = useSyncExternalStore(
    watchlistStore.subscribe,
    watchlistStore.getSnapshot,
    watchlistStore.getServerSnapshot,
  );

  const slugs = items.map((item) => item.titleSlug);

  const has = useCallback((slug: string) => isInWatchlist(items, slug), [items]);

  return {
    items,
    slugs,
    count: items.length,
    has,
    toggle: toggleWatchlist,
    ready: true,
  };
}
