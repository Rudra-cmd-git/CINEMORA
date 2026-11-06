"use client";

import { ChevronDown, SearchX, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { EmptyState } from "@/components/catalogue/empty-state";
import { CatalogueGridSkeleton } from "@/components/catalogue/grid-skeleton";
import { PosterGrid } from "@/components/catalogue/poster-grid";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";
import { SORT_OPTIONS, type SortId } from "@/lib/constants";
import { cn, pluralise } from "@/lib/utils";
import type { Genre, Movie } from "@/types";

export interface ExploreDecadeOption {
  value: string;
  count: number;
}

export interface ExploreExperienceProps {
  movies: Movie[];
  genres: Genre[];
  decades: ExploreDecadeOption[];
}

interface ExploreFilters {
  genres: string[];
  decade: string | null;
  sort: SortId;
}

const SORT_IDS = SORT_OPTIONS.map((option) => option.id) as string[];
const DEFAULT_FILTERS: ExploreFilters = { genres: [], decade: null, sort: "featured" };

function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

function sortMovies(list: Movie[], sort: SortId): Movie[] {
  const sorted = [...list];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
    case "oldest":
      return sorted.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
    case "az":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "runtime":
      return sorted.sort((a, b) => a.runtimeMinutes - b.runtimeMinutes || a.title.localeCompare(b.title));
    case "featured":
    default:
      return sorted.sort(
        (a, b) =>
          (a.featuredRank ?? Number.MAX_SAFE_INTEGER) - (b.featuredRank ?? Number.MAX_SAFE_INTEGER) ||
          a.title.localeCompare(b.title),
      );
  }
}

function parseFilters(
  params: URLSearchParams,
  genreSlugs: Set<string>,
  decadeValues: Set<string>,
): ExploreFilters {
  const rawGenres = params.get("genres");
  const genres = rawGenres
    ? rawGenres
        .split(",")
        .map((value) => value.trim())
        .filter((value, index, all) => genreSlugs.has(value) && all.indexOf(value) === index)
    : [];

  const rawDecade = params.get("decade");
  const rawSort = params.get("sort");

  return {
    genres,
    decade: rawDecade && decadeValues.has(rawDecade) ? rawDecade : null,
    sort: rawSort && SORT_IDS.includes(rawSort) ? (rawSort as SortId) : "featured",
  };
}

function serialiseFilters(filters: ExploreFilters): string {
  const params = new URLSearchParams();
  if (filters.genres.length > 0) params.set("genres", filters.genres.join(","));
  if (filters.decade) params.set("decade", filters.decade);
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  return params.toString();
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 cursor-pointer appearance-none rounded-full border border-line bg-transparent pl-3.5 pr-8 text-[12.5px] text-ink-soft",
          "transition-colors hover:border-line-strong hover:text-ink focus:border-gold/60 focus:text-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}

export function ExploreExperience({ movies, genres, decades }: ExploreExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlKey = searchParams.toString();

  const genreSlugs = React.useMemo(() => new Set(genres.map((genre) => genre.slug)), [genres]);
  const decadeValues = React.useMemo(() => new Set(decades.map((decade) => decade.value)), [decades]);
  const genreCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const movie of movies) {
      for (const genre of movie.genres) {
        counts.set(genre.slug, (counts.get(genre.slug) ?? 0) + 1);
      }
    }
    return counts;
  }, [movies]);

  const [filters, setFilters] = React.useState<ExploreFilters>(DEFAULT_FILTERS);
  const [ready, setReady] = React.useState(false);

  // Restore the shareable state from the URL once the client is hydrated.
  const restored = React.useRef(false);
  React.useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const raw = window.location.search.replace(/^\?/, "") || urlKey;
    setFilters(parseFilters(new URLSearchParams(raw), genreSlugs, decadeValues));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL shareable as filters change.
  const filtersKey = serialiseFilters(filters);
  React.useEffect(() => {
    if (!ready) return;
    const target = filtersKey ? `${pathname}?${filtersKey}` : pathname;
    if (`${window.location.pathname}${window.location.search}` === target) return;
    router.replace(target, { scroll: false });
  }, [filtersKey, ready, pathname, router]);

  // Adopt URL changes made outside this component (browser back / forward).
  const lastSeenUrl = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ready) return;
    if (lastSeenUrl.current === null) {
      lastSeenUrl.current = urlKey;
      return;
    }
    if (lastSeenUrl.current === urlKey) return;
    lastSeenUrl.current = urlKey;
    const parsed = parseFilters(new URLSearchParams(urlKey), genreSlugs, decadeValues);
    setFilters((previous) =>
      serialiseFilters(previous) === serialiseFilters(parsed) ? previous : parsed,
    );
  }, [urlKey, ready, genreSlugs, decadeValues]);

  const visibleMovies = React.useMemo(() => {
    const filtered = movies.filter((movie) => {
      if (
        filters.genres.length > 0 &&
        !movie.genres.some((genre) => filters.genres.includes(genre.slug))
      ) {
        return false;
      }
      if (filters.decade && decadeOf(movie.year) !== filters.decade) return false;
      return true;
    });
    return sortMovies(filtered, filters.sort);
  }, [movies, filters]);

  const toggleGenre = (slug: string) => {
    setFilters((current) => ({
      ...current,
      genres: current.genres.includes(slug)
        ? current.genres.filter((value) => value !== slug)
        : [...current.genres, slug],
    }));
  };

  const clearAll = () => setFilters(DEFAULT_FILTERS);

  const hasFilters =
    filters.genres.length > 0 || filters.decade !== null || filters.sort !== "featured";

  const activeGenrePills = filters.genres.map((slug) => ({
    slug,
    name: genres.find((genre) => genre.slug === slug)?.name ?? slug,
  }));
  const activeSortLabel =
    SORT_OPTIONS.find((option) => option.id === filters.sort)?.label ?? "Featured";
  const yearRange = React.useMemo(() => {
    if (movies.length === 0) return null;
    const years = movies.map((movie) => movie.year);
    return { first: Math.min(...years), last: Math.max(...years) };
  }, [movies]);

  return (
    <div>
      <div
        role="region"
        aria-label="Filter and sort films"
        className="sticky top-[var(--cm-header)] z-30 border-y border-line bg-canvas/95 backdrop-blur-xl"
      >
        <div className="cm-shell py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <fieldset className="min-w-0 flex-1">
              <legend className="sr-only">Filter by genre</legend>
              <div className="cm-no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1 lg:flex-wrap lg:overflow-visible">
                {genres.map((genre) => {
                  const active = filters.genres.includes(genre.slug);
                  return (
                    <button
                      key={genre.slug}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleGenre(genre.slug)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                        active
                          ? "border-gold/60 bg-gold-soft text-gold"
                          : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
                      )}
                    >
                      {genre.name}
                      <span
                        aria-hidden
                        className={cn(
                          "cm-tabular text-[10.5px]",
                          active ? "text-gold/70" : "text-ink-muted",
                        )}
                      >
                        {genreCounts.get(genre.slug) ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                id="explore-decade"
                label="Filter by decade"
                value={filters.decade ?? ""}
                onChange={(value) =>
                  setFilters((current) => ({ ...current, decade: value || null }))
                }
              >
                <option value="" className="bg-elevated text-ink">
                  All decades
                </option>
                {decades.map((decade) => (
                  <option key={decade.value} value={decade.value} className="bg-elevated text-ink">
                    {decade.value} ({decade.count})
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                id="explore-sort"
                label="Sort films"
                value={filters.sort}
                onChange={(value) =>
                  setFilters((current) => ({ ...current, sort: value as SortId }))
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id} className="bg-elevated text-ink">
                    {option.label}
                  </option>
                ))}
              </FilterSelect>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p aria-live="polite" className="cm-tabular text-[12.5px] text-ink-soft">
              {ready
                ? `${visibleMovies.length} of ${movies.length} ${pluralise(movies.length, "film")}`
                : "Loading films…"}
            </p>

            {activeGenrePills.map((pill) => (
              <button
                key={pill.slug}
                type="button"
                onClick={() => toggleGenre(pill.slug)}
                aria-label={`Remove ${pill.name} filter`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[11px] text-gold ring-1 ring-inset ring-gold/25 transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {pill.name}
                <X className="size-3" aria-hidden />
              </button>
            ))}

            {filters.decade ? (
              <button
                type="button"
                onClick={() => setFilters((current) => ({ ...current, decade: null }))}
                aria-label={`Remove ${filters.decade} filter`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[11px] text-gold ring-1 ring-inset ring-gold/25 transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {filters.decade}
                <X className="size-3" aria-hidden />
              </button>
            ) : null}

            {filters.sort !== "featured" ? (
              <button
                type="button"
                onClick={() => setFilters((current) => ({ ...current, sort: "featured" }))}
                aria-label={`Remove sort filter: ${activeSortLabel}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[11px] text-gold ring-1 ring-inset ring-gold/25 transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {activeSortLabel}
                <X className="size-3" aria-hidden />
              </button>
            ) : null}

            {hasFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto text-[12px] text-ink-muted underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="cm-shell py-10 sm:py-14">
        {!ready ? (
          <CatalogueGridSkeleton count={10} />
        ) : visibleMovies.length > 0 ? (
          <PosterGrid movies={visibleMovies} priorityCount={5} />
        ) : (
          <EmptyState
            icon={<SearchX className="size-5" aria-hidden />}
            title="No films match those filters"
            description={
              yearRange
                ? `Try removing a genre or widening the decade. The collection currently spans ${yearRange.first} to ${yearRange.last}.`
                : "Try removing a genre or widening the decade."
            }
          >
            <Button onClick={clearAll}>Clear all filters</Button>
            <Link href="/search" className={buttonClasses("ghost", "md")}>
              Search the catalogue
            </Link>
          </EmptyState>
        )}
      </div>
    </div>
  );
}
