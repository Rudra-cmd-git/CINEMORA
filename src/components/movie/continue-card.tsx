"use client";

import { Play, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatRuntime, formatTimecode, formatTimeLeft, formatYear, progressPercent } from "@/lib/utils";
import type { ImageAsset, PlaybackProgress } from "@/types";

/** Compact projection of a catalogue film handed to the Continue rail. */
export interface ContinueEntry {
  slug: string;
  title: string;
  year: number;
  runtimeMinutes: number;
  /** Genre display names, already flattened on the server. */
  genres: string[];
  poster: ImageAsset;
}

export interface ContinueCardProps {
  movie: ContinueEntry;
  progress: PlaybackProgress;
  onRemove: () => void;
}

/**
 * Landscape resume card. There is no frame-grab asset in the catalogue, so the
 * portrait poster is scaled up and softly blurred into a 16:9 ambient plate —
 * artwork stays legible as a mood, while the copy carries the detail.
 */
export function ContinueCard({ movie, progress, onRemove }: ContinueCardProps) {
  const percent = progressPercent(progress.currentTime, progress.duration);
  const remaining = Math.max(0, progress.duration - progress.currentTime);
  const resumeAt = Math.max(0, Math.floor(progress.currentTime));
  const genres = movie.genres.slice(0, 2).join(" · ");

  return (
    <article className="group relative w-[78vw] max-w-[340px] flex-none snap-start sm:w-[300px] lg:w-[320px]">
      <div
        className={
          "relative overflow-hidden rounded-lg bg-surface ring-1 ring-inset ring-white/[0.07] " +
          "transition-[box-shadow,transform] duration-300 ease-[var(--cm-ease)] " +
          "group-hover:-translate-y-1 group-hover:shadow-[var(--cm-shadow-lg)] group-hover:ring-gold/40 " +
          "group-focus-within:-translate-y-1 group-focus-within:ring-gold/50"
        }
      >
        <Link
          href={`/watch/${movie.slug}?t=${resumeAt}`}
          aria-label={`Resume ${movie.title} at ${formatTimecode(progress.currentTime)}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <div className="relative aspect-video overflow-hidden bg-canvas">
            <Image
              src={movie.poster.src}
              alt=""
              fill
              sizes="(max-width: 640px) 78vw, 320px"
              placeholder={movie.poster.blurDataURL ? "blur" : "empty"}
              blurDataURL={movie.poster.blurDataURL}
              className="scale-110 object-cover object-[50%_28%] opacity-90 blur-[2px] transition-transform duration-700 ease-[var(--cm-ease)] group-hover:scale-[1.16]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10"
            />

            {/* Resume affordance */}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="grid size-12 place-items-center rounded-full bg-gold text-ink-inverse shadow-[var(--cm-glow-gold)]">
                <Play className="size-5 translate-x-[1px] fill-current" aria-hidden />
              </span>
            </span>

            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-ink backdrop-blur-sm">
              {formatTimeLeft(remaining)}
            </span>

            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15" aria-hidden>
              <div
                className="h-full bg-gold transition-[width] duration-500 ease-[var(--cm-ease)]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 px-3.5 pb-3.5 pt-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-[15px] leading-snug text-ink">
                {movie.title}
              </h3>
              <p className="mt-1 truncate text-[11.5px] text-ink-muted">
                <span className="cm-tabular">{formatYear(movie.year)}</span>
                <span aria-hidden> · </span>
                <span className="cm-tabular">{formatRuntime(movie.runtimeMinutes)}</span>
                {genres ? (
                  <>
                    <span aria-hidden> · </span>
                    {genres}
                  </>
                ) : null}
              </p>
            </div>
            <span className="cm-tabular shrink-0 pt-0.5 text-[10.5px] uppercase tracking-[0.1em] text-ink-muted">
              {Math.round(percent)}%
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${movie.title} from Continue Watching`}
          className={
            "absolute right-2 top-2 z-20 grid size-8 place-items-center rounded-full " +
            "bg-black/60 text-ink-soft opacity-0 backdrop-blur-sm transition " +
            "hover:bg-black/85 hover:text-ink focus-visible:opacity-100 " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold " +
            "group-hover:opacity-100 group-focus-within:opacity-100"
          }
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}
