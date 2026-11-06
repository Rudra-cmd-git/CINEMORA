"use client";

import { STORAGE_KEYS } from "@/lib/constants";
import { createJsonStore } from "@/lib/storage";
import type { PlaybackProgress } from "@/types";

export type ProgressMap = Record<string, PlaybackProgress>;

const EMPTY: ProgressMap = {};

export const COMPLETION_THRESHOLD = 0.9;
export const MIN_RESUME_SECONDS = 30;

function isProgress(value: unknown): value is PlaybackProgress {
  if (typeof value !== "object" || value === null) return false;
  const p = value as PlaybackProgress;
  return (
    typeof p.movieSlug === "string" &&
    typeof p.currentTime === "number" &&
    typeof p.duration === "number" &&
    typeof p.lastWatchedAt === "string" &&
    typeof p.playbackRate === "number"
  );
}

function isProgressMap(value: unknown): value is ProgressMap {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(isProgress);
}

export const progressStore = createJsonStore<ProgressMap>(
  STORAGE_KEYS.progress,
  EMPTY,
  isProgressMap,
);

export function getProgress(map: ProgressMap, slug: string): PlaybackProgress | undefined {
  return map[slug];
}

export interface SaveProgressInput {
  movieSlug: string;
  currentTime: number;
  duration: number;
  playbackRate?: number;
}

/**
 * Persists playback position. Values are clamped so a broken `duration`
 * from a failed stream can never mark a film as finished.
 */
export function saveProgress(input: SaveProgressInput): void {
  const { movieSlug, currentTime, duration } = input;
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;

  const clampedTime = Math.min(Math.max(0, currentTime), duration);
  const completed = clampedTime / duration >= COMPLETION_THRESHOLD;

  const entry: PlaybackProgress = {
    movieSlug,
    currentTime: completed ? duration : clampedTime,
    duration,
    completed,
    lastWatchedAt: new Date().toISOString(),
    playbackRate: input.playbackRate ?? 1,
  };

  progressStore.update((current) => ({ ...current, [movieSlug]: entry }));
}

/** When the player should offer to resume rather than start over. */
export function shouldResume(progress: PlaybackProgress | undefined): boolean {
  if (!progress || progress.completed) return false;
  const { currentTime, duration } = progress;
  return currentTime > MIN_RESUME_SECONDS && currentTime < duration - MIN_RESUME_SECONDS;
}

export function removeProgress(slug: string): void {
  progressStore.update((current) => {
    if (!(slug in current)) return current;
    const next = { ...current };
    delete next[slug];
    return next;
  });
}

export function clearProgress(): void {
  progressStore.reset();
}

/** In-progress and finished entries, most recent first. */
export function sortedProgress(map: ProgressMap): PlaybackProgress[] {
  return Object.values(map).sort(
    (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime(),
  );
}
