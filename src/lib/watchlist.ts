"use client";

import { STORAGE_KEYS } from "@/lib/constants";
import { createJsonStore } from "@/lib/storage";
import type { TitleType, WatchlistItem } from "@/types";

const EMPTY: WatchlistItem[] = [];

function isWatchlist(value: unknown): value is WatchlistItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as WatchlistItem).titleSlug === "string" &&
        typeof (item as WatchlistItem).titleType === "string" &&
        typeof (item as WatchlistItem).addedAt === "string",
    )
  );
}

export const watchlistStore = createJsonStore<WatchlistItem[]>(
  STORAGE_KEYS.watchlist,
  EMPTY,
  isWatchlist,
);

export function isInWatchlist(items: WatchlistItem[], slug: string): boolean {
  return items.some((item) => item.titleSlug === slug);
}

/** Adds when absent, removes when present. Returns true when it is now saved. */
export function toggleWatchlist(slug: string): boolean {
  const current = watchlistStore.getSnapshot();
  const exists = isInWatchlist(current, slug);

  if (exists) {
    watchlistStore.set(current.filter((item) => item.titleSlug !== slug));
    return false;
  }

  watchlistStore.set([
    { titleSlug: slug, titleType: "movie", addedAt: new Date().toISOString() },
    ...current,
  ]);
  return true;
}

export function addToWatchlist(slug: string): void {
  const current = watchlistStore.getSnapshot();
  if (isInWatchlist(current, slug)) return;
  watchlistStore.set([
    { titleSlug: slug, titleType: "movie", addedAt: new Date().toISOString() },
    ...current,
  ]);
}

export function removeFromWatchlist(slug: string): void {
  const current = watchlistStore.getSnapshot();
  watchlistStore.set(current.filter((item) => item.titleSlug !== slug));
}

export function clearWatchlist(): void {
  watchlistStore.reset();
}
