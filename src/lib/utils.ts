import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className joiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 94 -> "1h 34m" */
export function formatRuntime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** 82 -> "1:22" ; 3722 -> "1:02:02" */
export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Human "12 min left" style label. */
export function formatTimeLeft(remainingSeconds: number): string {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) return "Finished";
  const mins = Math.ceil(remainingSeconds / 60);
  if (mins < 60) return `${mins} min left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr left` : `${h} hr ${m} min left`;
}

export function formatYear(year: number): string {
  return Number.isFinite(year) ? String(year) : "—";
}

export function progressPercent(currentTime: number, duration: number): number {
  if (!duration || !Number.isFinite(duration)) return 0;
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
}

/** Clamp helper used by the player and sliders. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Normalise a string for cheap case/diacritic-insensitive matching. */
export function normalise(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Stable ISO date without locale surprises (avoids SSR hydration drift). */
export function isoNow(): string {
  return new Date().toISOString();
}
