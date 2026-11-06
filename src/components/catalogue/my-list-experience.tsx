"use client";

import { Bookmark, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { EmptyState } from "@/components/catalogue/empty-state";
import { CatalogueGridSkeleton } from "@/components/catalogue/grid-skeleton";
import { PosterGrid } from "@/components/catalogue/poster-grid";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useWatchlist } from "@/hooks/use-watchlist";
import { clearWatchlist } from "@/lib/watchlist";
import { pluralise } from "@/lib/utils";
import type { Movie } from "@/types";

export interface MyListExperienceProps {
  /** Full catalogue records — PosterCard needs complete movie data. */
  movies: Movie[];
}

export function MyListExperience({ movies }: MyListExperienceProps) {
  const { items } = useWatchlist();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const moviesBySlug = React.useMemo(
    () => new Map(movies.map((movie) => [movie.slug, movie])),
    [movies],
  );

  // Preserve watchlist order (most recently saved first).
  const savedMovies = React.useMemo(
    () =>
      items
        .map((item) => moviesBySlug.get(item.titleSlug))
        .filter((movie): movie is Movie => Boolean(movie)),
    [items, moviesBySlug],
  );

  const onConfirmClear = () => {
    const removedCount = savedMovies.length;
    clearWatchlist();
    setConfirmOpen(false);
    toast({
      title: "My List cleared",
      description: `${removedCount} ${pluralise(removedCount, "film")} removed from this browser.`,
      tone: "success",
    });
  };

  if (!mounted) {
    return (
      <div aria-busy="true" aria-label="Loading your list">
        <CatalogueGridSkeleton count={5} />
      </div>
    );
  }

  if (savedMovies.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark className="size-5" aria-hidden />}
        title="Your list is empty"
        description="Save films as you browse and they will be waiting here — on this device, without an account."
        className="mt-4"
      >
        <Link href="/explore" className={buttonClasses("primary", "md")}>
          Browse the collection
        </Link>
        <Link href="/search" className={buttonClasses("ghost", "md")}>
          Search for a film
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p aria-live="polite" className="cm-tabular text-[12.5px] text-ink-soft">
          {savedMovies.length} {pluralise(savedMovies.length, "film")} saved · newest first
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          className="text-ink-muted hover:text-[#ff8b98]"
        >
          <Trash2 className="size-4" aria-hidden />
          Clear list
        </Button>
      </div>

      <PosterGrid movies={savedMovies} priorityCount={5} className="mt-8" />

      <p className="mt-10 text-[11.5px] leading-relaxed text-ink-muted">
        Your list lives in this browser only — clearing site data will remove it. There is no
        account and nothing is sent to our servers.
      </p>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle className="font-display text-xl text-ink sm:text-2xl">
            Clear My List?
          </DialogTitle>
          <DialogDescription className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
            This removes all {savedMovies.length} saved{" "}
            {pluralise(savedMovies.length, "film")} from this browser. It cannot be undone.
          </DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Keep my list</Button>
            </DialogClose>
            <Button variant="danger" onClick={onConfirmClear}>
              Clear list
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
