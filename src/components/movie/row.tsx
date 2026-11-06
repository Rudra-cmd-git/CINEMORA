"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { PosterCard } from "@/components/movie/poster-card";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

export interface MovieRowProps {
  title: string;
  blurb?: string;
  /** Where the "View all" link points — a genre slug. */
  genreSlug: string;
  movies: Movie[];
}

/**
 * A single editorial rail. The scroll container carries the edge-fade mask and
 * snap alignment; arrows are an enhancement layered on top for fine pointers,
 * with the rail itself remaining fully usable by touch, wheel and keyboard.
 */
export function MovieRow({ title, blurb, genreSlug, movies }: MovieRowProps) {
  const headingId = React.useId();
  const railRef = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const syncEdges = React.useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(maxScroll <= 2 || rail.scrollLeft >= maxScroll - 2);
  }, []);

  React.useEffect(() => {
    syncEdges();
    const rail = railRef.current;
    if (!rail) return;

    rail.addEventListener("scroll", syncEdges, { passive: true });
    const observer = new ResizeObserver(syncEdges);
    observer.observe(rail);

    return () => {
      rail.removeEventListener("scroll", syncEdges);
      observer.disconnect();
    };
  }, [syncEdges]);

  const scrollByPage = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.8,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  if (movies.length === 0) return null;

  const arrowClasses =
    "pointer-events-none absolute top-1/2 size-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/55 text-ink opacity-0 shadow-md backdrop-blur-md transition-[opacity,background-color,border-color,color] duration-200 hover:border-gold/70 hover:bg-black/75 hover:text-gold disabled:pointer-events-none disabled:opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100";

  return (
    <section aria-labelledby={headingId} className="group/row relative">
      <div className="cm-shell flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="font-display text-xl leading-tight tracking-[-0.01em] text-ink sm:text-2xl"
          >
            {title}
          </h2>
          {blurb ? (
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-soft">{blurb}</p>
          ) : null}
        </div>

        <Link
          href={`/genres/${genreSlug}`}
          className="cm-link-underline inline-flex shrink-0 items-center gap-1.5 pb-1 text-[12.5px] font-medium text-ink-soft transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          View all
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="relative mt-5 sm:mt-6">
        <div
          ref={railRef}
          className="cm-shell cm-no-scrollbar cm-rail-fade flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[var(--cm-gutter)] pb-2 sm:gap-5 lg:gap-6"
        >
          {movies.map((movie) => (
            <div
              key={movie.slug}
              className="w-[44vw] flex-none snap-start sm:w-[30vw] lg:w-[200px] xl:w-[220px]"
            >
              <PosterCard movie={movie} />
            </div>
          ))}
        </div>

        {/* Hover/focus arrows sit over the faded edge, clear of the card artwork. */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-[var(--cm-shell)] -translate-x-1/2 items-center justify-between sm:flex">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => scrollByPage(-1)}
            disabled={atStart}
            aria-label={`Scroll ${title} left`}
            className={cn(arrowClasses, "left-2")}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => scrollByPage(1)}
            disabled={atEnd}
            aria-label={`Scroll ${title} right`}
            className={cn(arrowClasses, "right-2")}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
