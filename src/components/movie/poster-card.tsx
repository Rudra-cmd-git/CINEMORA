"use client";

import { Check, Play, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useProgress } from "@/hooks/use-progress";
import { useWatchlist } from "@/hooks/use-watchlist";
import { formatRuntime, formatYear, progressPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

export interface PosterCardProps {
  movie: Movie;
  /** Skip lazy loading for above-the-fold cards. */
  priority?: boolean;
  /** Hide the hover action layer (used inside compact contexts). */
  compact?: boolean;
  className?: string;
}

export function PosterCard({ movie, priority = false, compact = false, className }: PosterCardProps) {
  const { has, toggle } = useWatchlist();
  const { get } = useProgress();
  const { toast } = useToast();
  const saved = has(movie.slug);
  const progress = get(movie.slug);

  const percent = progress ? progressPercent(progress.currentTime, progress.duration) : 0;
  const genreLabel = movie.genres.slice(0, 2).map((genre) => genre.name).join(" · ");

  const onToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const nowSaved = toggle(movie.slug);
    toast({
      title: nowSaved ? "Added to My List" : "Removed from My List",
      description: movie.title,
      tone: nowSaved ? "success" : "default",
    });
  };

  return (
    <article className={cn("group relative", className)}>
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-md bg-surface",
          "ring-1 ring-inset ring-white/[0.07] transition-[box-shadow,transform] duration-300 ease-[var(--cm-ease)]",
          "group-hover:-translate-y-1 group-hover:shadow-[var(--cm-shadow-lg)] group-hover:ring-gold/40",
          "group-focus-within:-translate-y-1 group-focus-within:ring-gold/50",
        )}
      >
        <Image
          src={movie.poster.src}
          alt={`Poster for ${movie.title} (${movie.year})`}
          fill
          priority={priority}
          quality={82}
          sizes="(max-width: 640px) 44vw, (max-width: 1024px) 28vw, 230px"
          placeholder={movie.poster.blurDataURL ? "blur" : "empty"}
          blurDataURL={movie.poster.blurDataURL}
          className="object-cover transition-transform duration-500 ease-[var(--cm-ease)] group-hover:scale-[1.04]"
        />

        {/* Legibility scrim */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[var(--cm-grad-poster)] opacity-70 transition-opacity duration-300 group-hover:opacity-95"
        />

        {/* Quick actions */}
        {!compact ? (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <Link
              href={`/watch/${movie.slug}`}
              className="relative z-10 inline-flex size-10 items-center justify-center rounded-full bg-gold text-ink-inverse shadow-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              aria-label={`Play ${movie.title}`}
            >
              <Play className="size-4 translate-x-[1px] fill-current" />
            </Link>
            <button
              type="button"
              onClick={onToggle}
              aria-pressed={saved}
              aria-label={saved ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`}
              className={cn(
                "relative z-10 inline-flex size-10 items-center justify-center rounded-full transition",
                "backdrop-blur-md focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                saved
                  ? "bg-gold text-ink-inverse"
                  : "bg-black/45 text-ink ring-1 ring-inset ring-white/20 hover:bg-black/65",
              )}
            >
              {saved ? <Check className="size-4" strokeWidth={2.6} /> : <Plus className="size-4" />}
            </button>
          </div>
        ) : null}

        {/* Resume progress */}
        {percent > 0 ? (
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/50" aria-hidden>
            <div
              className="h-full bg-gold transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="text-[13.5px] font-medium leading-snug text-ink">
          {/* Stretched link keeps the whole card clickable without nesting buttons */}
          <Link
            href={`/movie/${movie.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-gold focus-visible:outline-none"
          >
            {movie.title}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-ink-muted">
          <span className="cm-tabular">{formatYear(movie.year)}</span>
          <span aria-hidden>·</span>
          <span className="cm-tabular">{formatRuntime(movie.runtimeMinutes)}</span>
          {genreLabel ? (
            <>
              <span aria-hidden className="hidden sm:inline">
                ·
              </span>
              <span className="hidden truncate sm:inline">{genreLabel}</span>
            </>
          ) : null}
        </p>
      </div>

      {movie.featuredRank !== undefined && movie.featuredRank <= 3 && !compact ? (
        <Badge tone="gold" className="absolute left-2 top-2 backdrop-blur-md">
          Featured
        </Badge>
      ) : null}
    </article>
  );
}
