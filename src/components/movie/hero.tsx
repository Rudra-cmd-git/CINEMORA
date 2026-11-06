"use client";

import { Check, ChevronLeft, ChevronRight, Info, Play, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useWatchlist } from "@/hooks/use-watchlist";
import { cn, formatRuntime, formatYear } from "@/lib/utils";
import type { Movie } from "@/types";

const AUTOPLAY_MS = 8_000;
const CROSSFADE_MS = 800;

export interface HeroCarouselProps {
  movies: Movie[];
}

/**
 * Front-of-house billboard.
 *
 * Backdrops crossfade behind a single editorial column (poster + copy) so
 * inactive slides never enter the tab order or expose hidden links to
 * assistive technology. Autoplay pauses on hover, focus and background tabs,
 * and is disabled entirely for visitors who ask for reduced motion.
 */
export function HeroCarousel({ movies }: HeroCarouselProps) {
  const count = movies.length;
  const [index, setIndex] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);
  const [focusWithin, setFocusWithin] = React.useState(false);
  const [documentHidden, setDocumentHidden] = React.useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { has, toggle } = useWatchlist();
  const { toast } = useToast();

  const activeIndex = count > 0 ? index % count : 0;
  const activeMovie = movies[activeIndex];

  const autoplay =
    !reducedMotion && !hovered && !focusWithin && !documentHidden && count > 1;

  const goTo = React.useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  React.useEffect(() => {
    const onVisibilityChange = () => setDocumentHidden(document.visibilityState === "hidden");
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  React.useEffect(() => {
    if (!autoplay) return;
    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timeout);
    // `index` restarts the countdown after every manual or automatic change.
  }, [autoplay, count, index]);

  if (!activeMovie) return null;

  const saved = has(activeMovie.slug);
  const meta = [
    formatYear(activeMovie.year),
    formatRuntime(activeMovie.runtimeMinutes),
    activeMovie.genres
      .slice(0, 3)
      .map((genre) => genre.name)
      .join(", "),
  ].filter(Boolean);

  const onToggleWatchlist = () => {
    const nowSaved = toggle(activeMovie.slug);
    toast({
      title: nowSaved ? "Added to My List" : "Removed from My List",
      description: activeMovie.title,
      tone: nowSaved ? "success" : "default",
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(count - 1);
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured films"
      className="group relative isolate h-[68vh] min-h-[520px] w-full overflow-hidden bg-canvas lg:min-h-[600px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
      onKeyDown={onKeyDown}
    >
      {/* Backdrops — all slides stay mounted so the 800ms crossfade is seamless. */}
      <div aria-hidden className="absolute inset-0">
        {movies.map((movie, slideIndex) => (
          <div
            key={movie.slug}
            className={cn(
              "absolute inset-0 transition-opacity ease-[var(--cm-ease)] motion-reduce:transition-none",
              slideIndex === activeIndex ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
          >
            <Image
              src={movie.backdrop.src}
              alt=""
              fill
              priority={slideIndex === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}

        {/* Directional scrims keep type legible over any frame. */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "var(--cm-grad-hero-side)" }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "var(--cm-grad-hero)" }}
        />
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-canvas/80 via-canvas/20 to-transparent" />
      </div>

      {/* Screen-reader status. Polite only when the visitor is driving. */}
      <p
        aria-live={autoplay ? "off" : "polite"}
        aria-atomic="true"
        className="sr-only"
      >
        {`Featured film ${activeIndex + 1} of ${count}: ${activeMovie.title}`}
      </p>

      {/* Billboard content */}
      <div className="relative z-10 flex h-full flex-col justify-end pb-20 pt-[calc(var(--cm-header)+1.25rem)] sm:pb-32 lg:justify-center lg:pb-20">
        <div className="cm-shell flex w-full items-center gap-10 xl:gap-14">
          {/* Crisp poster — desktop only. */}
          <div
            aria-hidden
            className="hidden w-[190px] shrink-0 lg:block xl:w-[210px]"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-md shadow-[var(--cm-shadow-xl)] ring-1 ring-white/15">
              {movies.map((movie, slideIndex) => (
                <div
                  key={movie.slug}
                  className={cn(
                    "absolute inset-0 transition-opacity ease-[var(--cm-ease)] motion-reduce:transition-none",
                    slideIndex === activeIndex ? "opacity-100" : "opacity-0",
                  )}
                  style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
                >
                  <Image
                    src={movie.poster.src}
                    alt=""
                    fill
                    priority={slideIndex === 0}
                    sizes="220px"
                    placeholder={movie.poster.blurDataURL ? "blur" : "empty"}
                    blurDataURL={movie.poster.blurDataURL}
                    className="object-cover"
                  />
                </div>
              ))}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              <span>Now showing</span>
              <span className="cm-tabular">
                {String(activeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Copy for the active slide only — instant tab-order safety. */}
          <div
            key={activeMovie.slug}
            role="group"
            aria-roledescription="slide"
            aria-label={`${activeIndex + 1} of ${count}`}
            className="min-w-0 max-w-2xl animate-fade-up"
          >
            <p className="flex items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.32em] text-gold">
              <span aria-hidden className="h-px w-7 bg-gold/70" />
              Cinemora Selects
            </p>

            <h1 className="mt-5 font-display text-[clamp(2rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink [text-shadow:0_2px_30px_rgba(0,0,0,0.45)]">
              {activeMovie.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-ink-soft">
              {meta.map((item, metaIndex) => (
                <React.Fragment key={item}>
                  {metaIndex > 0 ? (
                    <span aria-hidden className="size-[3px] rounded-full bg-gold/60" />
                  ) : null}
                  <span className={metaIndex === 0 ? "cm-tabular font-medium text-ink" : "cm-tabular"}>
                    {item}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <p className="mt-5 line-clamp-3 max-w-2xl text-[14.5px] leading-relaxed text-ink-soft">
              {activeMovie.synopsis}
            </p>

            {activeMovie.tagline ? (
              <p className="mt-5 hidden max-w-xl border-l border-gold/40 pl-4 font-display text-[14px] leading-snug text-gold/90 sm:block sm:text-[15px]">
                {activeMovie.tagline}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={`/watch/${activeMovie.slug}`}
                className={buttonClasses("primary", "lg")}
                aria-label={`Play ${activeMovie.title}`}
              >
                <Play className="size-4 translate-x-[1px] fill-current" aria-hidden />
                Play
              </Link>

              <Button
                variant="secondary"
                size="lg"
                onClick={onToggleWatchlist}
                aria-pressed={saved}
                aria-label={
                  saved
                    ? `Remove ${activeMovie.title} from My List`
                    : `Add ${activeMovie.title} to My List`
                }
              >
                {saved ? (
                  <Check className="size-4" strokeWidth={2.6} aria-hidden />
                ) : (
                  <Plus className="size-4" aria-hidden />
                )}
                {saved ? "In My List" : "Add to list"}
              </Button>

              <Link
                href={`/movie/${activeMovie.slug}`}
                className={buttonClasses("outline", "lg")}
                aria-label={`View details for ${activeMovie.title}`}
              >
                <Info className="size-4" aria-hidden />
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-6 z-20">
        <div className="cm-shell flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex items-center gap-1.5" role="group" aria-label="Choose a featured film">
            {movies.map((movie, dotIndex) => (
              <button
                key={movie.slug}
                type="button"
                onClick={() => goTo(dotIndex)}
                aria-label={`Show ${movie.title}`}
                aria-current={dotIndex === activeIndex ? "true" : undefined}
                className="group/dot -my-2 flex h-8 items-center rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-[2px] rounded-full transition-[width,background-color] duration-500 ease-[var(--cm-ease)] motion-reduce:transition-none",
                    dotIndex === activeIndex
                      ? "w-9 bg-gold"
                      : "w-4 bg-white/30 group-hover/dot:bg-white/60",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="cm-tabular font-mono text-[10.5px] tracking-[0.18em] text-ink-muted">
              {String(activeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous featured film"
                className="border border-white/10 bg-black/35 backdrop-blur-md hover:bg-white/10"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next featured film"
                className="border border-white/10 bg-black/35 backdrop-blur-md hover:bg-white/10"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
