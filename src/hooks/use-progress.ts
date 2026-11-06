"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  progressStore,
  removeProgress,
  saveProgress,
  sortedProgress,
  type ProgressMap,
  type SaveProgressInput,
} from "@/lib/progress";
import type { PlaybackProgress } from "@/types";

export interface UseProgress {
  map: ProgressMap;
  inProgress: PlaybackProgress[];
  finished: PlaybackProgress[];
  get: (slug: string) => PlaybackProgress | undefined;
  save: (input: SaveProgressInput) => void;
  remove: (slug: string) => void;
}

export function useProgress(): UseProgress {
  const map = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );

  const ordered = sortedProgress(map);
  const inProgress = ordered.filter((entry) => !entry.completed);
  const finished = ordered.filter((entry) => entry.completed);

  const get = useCallback((slug: string) => map[slug], [map]);

  return { map, inProgress, finished, get, save: saveProgress, remove: removeProgress };
}
