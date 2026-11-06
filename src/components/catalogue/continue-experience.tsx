"use client";

import { ChevronLeft, History, Play, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { EmptyState } from "@/components/catalogue/empty-state";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useProgress } from "@/hooks/use-progress";
import type { SearchEntry } from "@/lib/catalogue";
import { formatRuntime, formatTimecode, formatTimeLeft, formatYear, progressPercent } from "@/lib/utils";
import type { PlaybackProgress } from "@/types";

function formatWatchedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ResumeCard({
  entry,
  progress,
  onRemove,
}: {
  entry: SearchEntry;
  progress: PlaybackProgress;
  onRemove: (slug: string) => void;
}) {
  const percent = progressPercent(progress.currentTime, progress.duration);
  const remaining = progress.duration - progress.currentTime;
  const resumeHref = `/watch/${entry.slug}?t=${Math.max(0, Math.floor(progress.currentTime))}`;

  return (
    <article className="group overflow-hidden rounded-lg border border-line bg-elevated/40 transition-colors hover:border-line-strong">
      <Link
        href={resumeHref}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      >
        <div className="relative aspect-video overflow-hidden bg-surface">
          <Image
            src={entry.poster.src}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="object-cover object-[center_18%] opacity-85 transition-transform duration-500 ease-[var(--cm-ease)] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/35 to-transparent" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-gold/95 text-ink-inverse shadow-[var(--cm-shadow-lg)] transition-transform duration-200 group-hover:scale-105">
              <Play className="size-5 translate-x-[1px] fill-current" aria-hidden />
            </span>
          </span>
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/55" aria-hidden>
            <div className="h-full bg-gold" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-display text-[17px] leading-snug text-ink transition-colors group-hover:text-gold">
            {entry.title}
          </h3>
          <p className="mt-1 cm-tabular text-[11.5px] text-ink-muted">
            {formatYear(entry.year)} · {formatRuntime(entry.runtimeMinutes)}
          </p>
          <p className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11.5px]">
            <span className="text-gold">{formatTimeLeft(remaining)}</span>
            <span className="cm-tabular text-ink-muted">
              Resume at {formatTimecode(progress.currentTime)}
            </span>
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
        <Link
          href={resumeHref}
          className="text-[12px] font-medium text-ink-soft transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Resume
        </Link>
        <button
          type="button"
          onClick={() => onRemove(entry.slug)}
          aria-label={`Remove ${entry.title} from continue watching`}
          className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-muted transition-colors hover:text-[#ff8b98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <X className="size-3.5" aria-hidden />
          Remove
        </button>
      </div>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading viewing history">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-line">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-2/3 rounded-xs" />
            <Skeleton className="h-3 w-1/2 rounded-xs" />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface ContinueExperienceProps {
  entries: SearchEntry[];
}

export function ContinueExperience({ entries }: ContinueExperienceProps) {
  const { inProgress, finished, remove } = useProgress();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const entriesBySlug = React.useMemo(
    () => new Map(entries.map((entry) => [entry.slug, entry])),
    [entries],
  );

  const inProgressRows = React.useMemo(
    () =>
      inProgress
        .map((progress) => ({ progress, entry: entriesBySlug.get(progress.movieSlug) }))
        .filter(
          (row): row is { progress: PlaybackProgress; entry: SearchEntry } =>
            row.entry !== undefined,
        ),
    [inProgress, entriesBySlug],
  );

  const finishedRows = React.useMemo(
    () =>
      finished
        .map((progress) => ({ progress, entry: entriesBySlug.get(progress.movieSlug) }))
        .filter(
          (row): row is { progress: PlaybackProgress; entry: SearchEntry } =>
            row.entry !== undefined,
        ),
    [finished, entriesBySlug],
  );

  const onRemove = (slug: string, title: string) => {
    remove(slug);
    toast({ title: "Removed from history", description: title, tone: "default" });
  };

  if (!mounted) {
    return <LoadingSkeleton />;
  }

  if (inProgressRows.length === 0 && finishedRows.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-5" aria-hidden />}
        title="Nothing in progress yet"
        description="Start any film in the catalogue and it will appear here with your position saved — no account needed."
      >
        <Link href="/explore" className={buttonClasses("primary", "md")}>
          Find something to watch
        </Link>
        <Link href="/my-list" className={buttonClasses("ghost", "md")}>
          Go to My List
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      {inProgressRows.length > 0 ? (
        <section aria-labelledby="in-progress-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
                Pick up where you left off
              </p>
              <h2
                id="in-progress-heading"
                className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl"
              >
                In progress{" "}
                <span className="cm-tabular text-lg text-ink-muted">({inProgressRows.length})</span>
              </h2>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted transition-colors hover:text-gold"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              Find something new
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inProgressRows.map(({ entry, progress }) => (
              <ResumeCard
                key={entry.slug}
                entry={entry}
                progress={progress}
                onRemove={(slug) => onRemove(slug, entry.title)}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-lg border border-line bg-elevated/30 px-5 py-6 text-[13px] leading-relaxed text-ink-muted">
          Nothing in progress right now. Your finished films are below — or{" "}
          <Link href="/explore" className="text-gold underline-offset-4 hover:underline">
            find something new
          </Link>
          .
        </div>
      )}

      {finishedRows.length > 0 ? (
        <section
          aria-labelledby="finished-heading"
          className={inProgressRows.length > 0 ? "mt-16" : "mt-2"}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-muted">
                Your archive
              </p>
              <h2
                id="finished-heading"
                className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl"
              >
                Finished{" "}
                <span className="cm-tabular text-lg text-ink-muted">({finishedRows.length})</span>
              </h2>
            </div>
          </div>

          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-lg border border-line bg-elevated/30">
            {finishedRows.map(({ entry, progress }) => (
              <li key={entry.slug} className="flex flex-wrap items-center gap-4 p-3 sm:p-4">
                <Link
                  href={`/movie/${entry.slug}`}
                  className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-xs bg-surface ring-1 ring-inset ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Image
                    src={entry.poster.src}
                    alt={`Poster for ${entry.title}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/movie/${entry.slug}`}
                    className="font-display text-[15px] leading-snug text-ink transition-colors hover:text-gold"
                  >
                    {entry.title}
                  </Link>
                  <p className="mt-0.5 cm-tabular text-[11.5px] text-ink-muted">
                    {formatYear(entry.year)} · {formatRuntime(entry.runtimeMinutes)} · Finished{" "}
                    {formatWatchedDate(progress.lastWatchedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/watch/${entry.slug}`}
                    className={buttonClasses("ghost", "sm")}
                    aria-label={`Watch ${entry.title} again`}
                  >
                    <Play className="size-3.5" aria-hidden />
                    Watch again
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-ink-muted hover:text-[#ff8b98]"
                    onClick={() => onRemove(entry.slug, entry.title)}
                    aria-label={`Remove ${entry.title} from history`}
                  >
                    <X className="size-3.5" aria-hidden />
                    <span className="hidden sm:inline">Remove from history</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
