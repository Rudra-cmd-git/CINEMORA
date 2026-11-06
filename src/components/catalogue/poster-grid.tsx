import { PosterCard } from "@/components/movie/poster-card";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

export interface PosterGridProps {
  movies: Movie[];
  /** Number of leading cards to eager-load (above-the-fold rows). */
  priorityCount?: number;
  variant?: "catalogue" | "related";
  className?: string;
}

const COLUMNS: Record<NonNullable<PosterGridProps["variant"]>, string> = {
  catalogue: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  related: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
};

/** Responsive poster grid used by Explore, genre pages and related rows. */
export function PosterGrid({
  movies,
  priorityCount = 0,
  variant = "catalogue",
  className,
}: PosterGridProps) {
  return (
    <ul role="list" className={cn("grid list-none gap-4 sm:gap-5 xl:gap-6", COLUMNS[variant], className)}>
      {movies.map((movie, index) => (
        <li key={movie.slug}>
          <PosterCard movie={movie} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
