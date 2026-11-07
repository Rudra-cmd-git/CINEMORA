"use client";

import { ChevronRight, Clock, Search, SearchX, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { EmptyState } from "@/components/catalogue/empty-state";
import { HighlightText } from "@/components/search/highlight-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import type { SearchEntry } from "@/lib/catalogue";
import { STORAGE_KEYS } from "@/lib/constants";
import { searchMovies, type ScoredResult } from "@/lib/search";
import { createJsonStore } from "@/lib/storage";
import { cn, formatRuntime, formatYear, pluralise } from "@/lib/utils";

const RECENT_LIMIT = 6;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

const recentSearchesStore = createJsonStore<string[]>(
  STORAGE_KEYS.recentSearches,
  [],
  isStringArray,
);

function rememberSearch(term: string): void {
  const clean = term.trim().replace(/\s+/g, " ");
  if (!clean) return;

  const current = recentSearchesStore.getSnapshot();
  const next = [
    clean,
    ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
  ].slice(0, RECENT_LIMIT);
  recentSearchesStore.set(next);
}

type MatchKind = ScoredResult<SearchEntry>["match"];

const MATCH_LABEL: Record<MatchKind, string> = {
  title: "",
  person: "Cast & crew",
  genre: "Genre",
  year: "Year",
  synopsis: "Synopsis",
};

export interface SearchExperienceProps {
  entries: SearchEntry[];
}

export function SearchExperience({ entries }: SearchExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [input, setInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [ready, setReady] = React.useState(false);

  const recent = React.useSyncExternalStore(
    recentSearchesStore.subscribe,
    recentSearchesStore.getSnapshot,
    recentSearchesStore.getServerSnapshot,
  );

  const urlQuery = searchParams.get("q") ?? "";

  // Restore ?q= once hydrated.
  const restored = React.useRef(false);
  React.useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const initial = new URLSearchParams(window.location.search).get("q") ?? "";
    setInput(initial);
    setQuery(initial.trim());
    setReady(true);
  }, []);

  // Debounce input by 150ms before searching.
  React.useEffect(() => {
    const trimmed = input.trim();
    const timer = window.setTimeout(() => setQuery(trimmed), 150);
    return () => window.clearTimeout(timer);
  }, [input]);

  // Keep the query shareable in the URL.
  React.useEffect(() => {
    if (!ready) return;
    const target = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
    if (`${window.location.pathname}${window.location.search}` === target) return;
    router.replace(target, { scroll: false });
  }, [query, ready, router]);

  // Adopt URL changes made outside this component (browser back / forward).
  const lastSeenUrl = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ready) return;
    if (lastSeenUrl.current === null) {
      lastSeenUrl.current = urlQuery;
      return;
    }
    if (lastSeenUrl.current === urlQuery) return;
    lastSeenUrl.current = urlQuery;
    setInput(urlQuery);
    setQuery(urlQuery.trim());
  }, [urlQuery, ready]);

  const trimmedQuery = query.trim();

  const results = React.useMemo(
    () => (trimmedQuery ? searchMovies(entries, trimmedQuery, 40) : []),
    [entries, trimmedQuery],
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    rememberSearch(input);
    const trimmed = input.trim();
    setQuery(trimmed);
    router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search", {
      scroll: false,
    });
  };

  const clearSearch = () => {
    setInput("");
    setQuery("");
    inputRef.current?.focus();
  };

  const chooseTerm = (term: string) => {
    rememberSearch(term);
    setInput(term);
    setQuery(term.trim());
    inputRef.current?.focus();
  };

  const clearRecent = () => {
    recentSearchesStore.reset();
    toast({ title: "Recent searches cleared", tone: "default" });
  };

  return (
    <div className="cm-shell pb-24 pt-10 sm:pt-12">
      <form role="search" onSubmit={onSubmit} className="relative">
        <label htmlFor="catalogue-search" className="sr-only">
          Search films, people, years or genres
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          id="catalogue-search"
          ref={inputRef}
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search films, directors, cast, year or genre"
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "h-14 w-full rounded-lg border border-line bg-surface/50 pl-11 pr-24 text-[15px] text-ink",
            "transition-colors placeholder:text-ink-muted",
            "focus:border-gold/50 focus:bg-surface focus:outline-none",
            "[&::-webkit-search-cancel-button]:appearance-none",
          )}
        />
        {input ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/[0.07] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-xs border border-line px-1.5 py-0.5 text-[10px] text-ink-muted sm:block"
          >
            ⏎
          </span>
        )}
        <button type="submit" className="sr-only">
          Search
        </button>
      </form>

      {trimmedQuery.length > 0 ? (
        <div aria-live="polite" aria-atomic="true" className="mt-6">
          <p className="cm-tabular text-[12.5px] text-ink-soft">
            {results.length} {pluralise(results.length, "result")} for{" "}
            <span className="text-ink">“{trimmedQuery}”</span>
          </p>
        </div>
      ) : null}

      {trimmedQuery.length === 0 ? (
        <div className="mt-10 space-y-12">
          {recent.length > 0 ? (
            <section aria-labelledby="recent-searches-heading">
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="recent-searches-heading"
                  className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted"
                >
                  <Clock className="size-3.5" aria-hidden />
                  Recent searches
                </h2>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-[11.5px] text-ink-muted underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Clear
                </button>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {recent.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => chooseTerm(term)}
                      className="rounded-full border border-line px-3.5 py-1.5 text-[12.5px] text-ink-soft transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="search-suggestions-heading">
            <h2
              id="search-suggestions-heading"
              className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted"
            >
              Start with
            </h2>
            <ul role="list" className="mt-4 grid gap-3 sm:grid-cols-2">
              {entries.slice(0, 4).map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={entry.type === "series" ? `/series/${entry.slug}` : `/movie/${entry.slug}`}
                    className="group flex items-center gap-4 rounded-lg border border-line bg-elevated/30 p-3 transition-colors hover:border-line-strong hover:bg-elevated/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  >
                    <span className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-xs bg-surface ring-1 ring-inset ring-white/10">
                      <Image
                        src={entry.poster.src}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[15px] text-ink transition-colors group-hover:text-gold">
                        {entry.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-ink-muted">
                        {formatYear(entry.year)} ·{" "}
                        {entry.genres.map((genre) => genre.name).join(", ")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="max-w-xl text-[12.5px] leading-relaxed text-ink-muted">
            Search by title, director, cast member, year or genre — every film in the
            catalogue is free to watch.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<SearchX className="size-5" aria-hidden />}
            title={`No films match “${trimmedQuery}”`}
            description="Check the spelling, or try a director, a year, or a genre — for example “Murnau”, “1927”, or “noir”."
          >
            <Button variant="secondary" onClick={clearSearch}>
              <X className="size-4" aria-hidden />
              Clear search
            </Button>
            <Link href="/explore" className={buttonClasses("ghost", "md")}>
              Browse all films
            </Link>
          </EmptyState>
        </div>
      ) : (
        <ul role="list" className="mt-4 divide-y divide-line border-t border-line">
          {results.map((result) => {
            const entry = result.movie;
            const matchLabel = MATCH_LABEL[result.match];
            return (
              <li key={entry.slug}>
                <Link
                  href={entry.type === "series" ? `/series/${entry.slug}` : `/movie/${entry.slug}`}
                  onClick={() => rememberSearch(trimmedQuery)}
                  className="group flex gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:gap-6 sm:py-5"
                >
                  <span className="relative aspect-[2/3] w-[64px] shrink-0 overflow-hidden rounded-sm bg-surface ring-1 ring-inset ring-white/10 sm:w-[78px]">
                    <Image
                      src={entry.poster.src}
                      alt={`Poster for ${entry.title}`}
                      fill
                      quality={80}
                      sizes="78px"
                      placeholder={entry.poster.blurDataURL ? "blur" : "empty"}
                      blurDataURL={entry.poster.blurDataURL}
                      className="object-cover transition-transform duration-500 ease-[var(--cm-ease)] group-hover:scale-[1.04]"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-[17px] leading-snug text-ink transition-colors group-hover:text-gold">
                        <HighlightText text={entry.title} query={trimmedQuery} />
                      </span>
                      <span className="cm-tabular text-[12px] text-ink-muted">
                        {formatYear(entry.year)}
                      </span>
                      {matchLabel ? (
                        <Badge tone="outline" className="translate-y-[-1px]">
                          {matchLabel}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[12px] text-ink-soft">
                      {entry.genres.map((genre) => genre.name).join(" · ")}
                      <span aria-hidden className="px-1.5">
                        ·
                      </span>
                      <span className="cm-tabular">{formatRuntime(entry.runtimeMinutes)}</span>
                    </span>
                    <span className="mt-1.5 line-clamp-1 text-[13px] leading-relaxed text-ink-muted">
                      <HighlightText text={entry.synopsis} query={trimmedQuery} />
                    </span>
                  </span>

                  <ChevronRight
                    aria-hidden
                    className="mt-1 hidden size-4 shrink-0 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gold sm:block"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
