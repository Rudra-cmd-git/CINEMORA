"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { SearchEntry } from "@/lib/catalogue";
import { searchMovies } from "@/lib/search";
import { cn, formatYear } from "@/lib/utils";

interface CommandPaletteProps {
  entries: SearchEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ entries, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);

  const results = React.useMemo(() => searchMovies(entries, query, 8), [entries, query]);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const go = React.useCallback(
    (slug: string) => {
      onOpenChange(false);
      router.push(`/movie/${slug}`);
    },
    [onOpenChange, router],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex]?.movie;
      if (target) go(target.slug);
    }
  };

  React.useEffect(() => {
    const selected = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    selected?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent bare className="top-[12vh] translate-y-0 p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Search the catalogue</DialogTitle>
        <div className="overflow-hidden rounded-lg border border-line bg-elevated/95 shadow-[var(--cm-shadow-xl)] backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search films, directors, actors…"
              aria-label="Search the catalogue"
              aria-controls="command-results"
              aria-activedescendant={
                results.length > 0 ? `command-result-${activeIndex}` : undefined
              }
              className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted"
            />
            <kbd className="hidden shrink-0 rounded-xs border border-line px-1.5 py-0.5 text-[10px] text-ink-muted sm:block">
              ESC
            </kbd>
          </div>

          {query.trim().length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-ink-muted">
              Try <span className="text-ink">Nosferatu</span>,{" "}
              <span className="text-ink">Keaton</span>, or{" "}
              <span className="text-ink">film noir</span>.
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-ink-muted">
              No films match “{query}”.
            </div>
          ) : (
            <ul id="command-results" ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-2 cm-scroll">
              {results.map((result, index) => {
                const entry = result.movie;
                const isActive = index === activeIndex;
                return (
                  <li key={entry.slug} role="option" aria-selected={isActive} data-index={index}>
                    <button
                      type="button"
                      id={`command-result-${index}`}
                      onClick={() => go(entry.slug)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors",
                        isActive ? "bg-white/[0.07]" : "hover:bg-white/[0.05]",
                      )}
                    >
                      <span className="relative h-[54px] w-9 shrink-0 overflow-hidden rounded-xs bg-surface ring-1 ring-white/10">
                        <Image
                          src={entry.poster.src}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-ink">{entry.title}</span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-ink-muted">
                          {formatYear(entry.year)} · {entry.genres.map((genre) => genre.name).join(", ")}
                        </span>
                      </span>
                      {isActive ? (
                        <kbd className="shrink-0 rounded-xs border border-line px-1.5 py-0.5 text-[10px] text-ink-muted">
                          ↵
                        </kbd>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
