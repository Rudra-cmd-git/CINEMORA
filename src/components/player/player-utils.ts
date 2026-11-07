/**
 * Framework-neutral player helpers. Safe to import from both the server
 * watch page and the client player island.
 */

import type { Movie, TVSeries, Watchable, Episode } from "@/types";
import type { PlayerMovie } from "./types";

/**
 * Projects a catalogue `Movie` down to the player's minimal prop surface.
 * Keeps synopses, rights records and the rest of the catalogue off the wire.
 */
export function toPlayerMovie(movie: Movie): PlayerMovie {
  return {
    slug: movie.slug,
    title: movie.title,
    year: movie.year,
    runtimeMinutes: movie.runtimeMinutes,
    genres: movie.genres.map((genre) => ({ name: genre.name, slug: genre.slug })),
    backdrop: movie.backdrop,
    videoSources: movie.videoSources,
    subtitleSources: movie.subtitleSources,
    sourcePage: movie.sourcePage,
    aspectRatio: movie.aspectRatio,
  };
}

/**
 * Projects any playable title (film or episode) down to the player's minimal
 * prop surface. Episodes inherit the parent series' artwork and source page
 * when they don't carry their own, and carry the series' release year —
 * a season/episode number was never a year.
 */
export function toPlayerWatchable(watchable: Watchable, seriesYear?: number): PlayerMovie {
  if (watchable.type === "movie") {
    return toPlayerMovie(watchable);
  }

  // Episode: fall back to series-level artwork/source where the episode has none,
  // and derive the year from the series (or episode air date) — never the season number.
  const seriesYearFromAirDate = watchable.airDate?.slice(0, 4);
  const year = Number(seriesYear ?? (seriesYearFromAirDate ? Number(seriesYearFromAirDate) : 0));
  return {
    slug: watchable.slug,
    title: watchable.title,
    year: Number.isFinite(year) ? year : 0,
    runtimeMinutes: watchable.runtimeMinutes ?? 0,
    genres: [],
    backdrop: watchable.poster ?? { src: "", width: 0, height: 0 },
    videoSources: watchable.videoSources,
    subtitleSources: watchable.subtitleSources,
    sourcePage: watchable.sourcePage ?? "",
    aspectRatio: watchable.aspectRatio ?? "16:9",
  };
}

const CLOCK_PATTERN = /^(?:(\d{1,2}):)?(\d{1,3}):(\d{2}(?:\.\d{1,3})?)$/;
const SECONDS_PATTERN = /^\d{1,6}(?:\.\d{1,3})?$/;

/**
 * Parses the `?t=` deep-link parameter.
 *
 * Accepts plain seconds (`?t=754`) and clock-style positions (`?t=12:34`,
 * `?t=1:02:03`) so both machine and human links work. Returns `undefined`
 * for anything unusable rather than throwing.
 */
export function parseInitialTime(value: string | string[] | undefined): number | undefined {
  if (value === undefined) return undefined;
  const raw = (Array.isArray(value) ? value[0] : value)?.trim();
  if (!raw) return undefined;

  let seconds: number | undefined;

  if (SECONDS_PATTERN.test(raw)) {
    seconds = Number(raw);
  } else {
    const match = CLOCK_PATTERN.exec(raw);
    if (match) {
      const [, hours, minutes, secs] = match;
      seconds = Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(secs);
    }
  }

  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return undefined;
  // Guard against absurd values in shared links (there is no film over 12h).
  return Math.min(seconds, 60 * 60 * 12);
}

/** True for an absolute http(s) URL — subtitles from archive.org need proxying. */
export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Resolves a subtitle source to a URL a same-origin `<track>` can load.
 *
 * - Local `/subtitles/*.vtt` assets are already same-origin: use directly.
 * - Remote archive.org files have no CORS headers, so they go through
 *   `/api/subtitles`, which validates the host and normalises SRT → VTT.
 */
export function resolveSubtitleUrl(url: string): string {
  return isAbsoluteUrl(url) ? `/api/subtitles?url=${encodeURIComponent(url)}` : url;
}

/** Playback speeds offered by the rate menu (0.5×–2×). */
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Formats a rate for display: 1 -> "Normal", 1.25 -> "1.25×". */
export function formatRate(rate: number): string {
  return rate === 1 ? "Normal" : `${rate}×`;
}

/** Clamps a playback rate to the offered range and nearest offered step. */
export function nearestRate(value: number): number {
  let best: number = PLAYBACK_RATES[0];
  for (const candidate of PLAYBACK_RATES) {
    if (Math.abs(candidate - value) < Math.abs(best - value)) best = candidate;
  }
  return best;
}
