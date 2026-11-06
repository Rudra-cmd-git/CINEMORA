"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { ContinueCard, type ContinueEntry } from "@/components/movie/continue-card";
import { useToast } from "@/components/ui/toast";
import { useProgress } from "@/hooks/use-progress";
import type { PlaybackProgress } from "@/types";

export type { ContinueEntry };

export interface ContinueRowProps {
  /** Compact catalogue projection supplied by the server page — never the JSON module. */
  movies: ContinueEntry[];
}

/**
 * "Continue Watching" rail. The progress map lives in localStorage, so this is
 * the only homepage section that cannot be rendered on the server. It hides
 * itself until something is actually in progress, keeping the page clean for
 * first-time visitors.
 */
export function ContinueRow({ movies }: ContinueRowProps) {
  const headingId = React.useId();
  const { inProgress, remove } = useProgress();
  const { toast } = useToast();

  const bySlug = React.useMemo(
    () => new Map(movies.map((movie) => [movie.slug, movie])),
    [movies],
  );

  const items = inProgress.flatMap((progress: PlaybackProgress) => {
    const movie = bySlug.get(progress.titleSlug);
    return movie ? [{ progress, movie }] : [];
  });

  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <div className="cm-shell flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="font-display text-xl leading-tight tracking-[-0.01em] text-ink sm:text-2xl"
          >
            Continue Watching
          </h2>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">
            Pick up exactly where you left off. Positions are saved on this device.
          </p>
        </div>

        <Link
          href="/continue"
          className="cm-link-underline inline-flex shrink-0 items-center gap-1.5 pb-1 text-[12.5px] font-medium text-ink-soft transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          All in progress
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="cm-shell cm-no-scrollbar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[var(--cm-gutter)] pb-2 sm:mt-6 sm:gap-5">
        {items.map(({ movie, progress }) => (
          <ContinueCard
            key={movie.slug}
            movie={movie}
            progress={progress}
            onRemove={() => {
              remove(movie.slug);
              toast({
                title: "Removed from Continue Watching",
                description: movie.title,
              });
            }}
          />
        ))}
      </div>
    </section>
  );
}
