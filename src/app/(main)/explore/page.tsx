import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreExperience, type ExploreDecadeOption } from "@/components/catalogue/explore-experience";
import { CatalogueGridSkeleton } from "@/components/catalogue/grid-skeleton";
import { PageIntro } from "@/components/catalogue/page-intro";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveGenres, movies, totalRuntimeMinutes } from "@/lib/catalogue";
import { DECADES } from "@/lib/constants";
import { formatRuntime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse every film in the Cinemora collection. Filter by genre and decade, sort by year, title or runtime, and find something worth your evening.",
  alternates: { canonical: "/explore" },
};

function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

/** Loading boundary for the URL-driven filter experience. */
function ExploreFallback() {
  return (
    <div aria-busy="true" aria-label="Loading the collection">
      <div className="sticky top-[var(--cm-header)] z-30 border-y border-line bg-canvas/95 backdrop-blur-xl">
        <div className="cm-shell flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 gap-2 overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 shrink-0 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
        </div>
        <div className="cm-shell pb-3">
          <Skeleton className="h-3.5 w-32 rounded-xs" />
        </div>
      </div>
      <div className="cm-shell py-10 sm:py-14">
        <CatalogueGridSkeleton count={10} />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const genres = getActiveGenres();
  const decades: ExploreDecadeOption[] = DECADES.map((value) => ({
    value,
    count: movies.filter((movie) => decadeOf(movie.year) === value).length,
  })).filter((decade) => decade.count > 0);

  const years = movies.map((movie) => movie.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const runtime = formatRuntime(totalRuntimeMinutes(movies));

  return (
    <div className="pt-[var(--cm-header)]">
      <PageIntro
        eyebrow="The collection"
        title="Explore the catalogue"
        description={
          <>
            Every film we stream, in one place — from expressionist horror and silent
            slapstick to film noir and the birth of the American independent picture. All
            public domain, all free to watch, all restored and verified by hand.
          </>
        }
      >
        <p className="mt-5 cm-tabular text-[12.5px] text-ink-muted">
          {movies.length} films · {firstYear}–{lastYear} · {runtime} of cinema ·{" "}
          {genres.length} genres
        </p>
      </PageIntro>

      <div className="mt-10">
        <Suspense fallback={<ExploreFallback />}>
          <ExploreExperience movies={movies} genres={genres} decades={decades} />
        </Suspense>
      </div>
    </div>
  );
}
