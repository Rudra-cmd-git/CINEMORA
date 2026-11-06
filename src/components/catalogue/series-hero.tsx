"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";
import { formatRuntime } from "@/lib/utils";
import type { Episode, Season, TVSeries } from "@/types";

/** Series hero: backdrop, poster, editorial detail and season entry points. */
export function SeriesHero({ series }: { series: TVSeries }) {
  const hasOriginalTitle =
    Boolean(series.originalTitle) && series.originalTitle !== series.title;
  const firstSeason = series.seasons[0];
  const firstEpisode = firstSeason?.episodes[0];

  return (
    <section aria-labelledby="series-title" className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image src={series.backdrop.src} alt="" fill priority quality={82} sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-[var(--cm-grad-hero)]" />
        <div className="absolute inset-0 bg-[var(--cm-grad-hero-side)]" />
        <div className="absolute inset-x-0 top-0 h-[calc(var(--cm-header)_+_6rem)] bg-gradient-to-b from-canvas/90 via-canvas/45 to-transparent" />
      </div>

      <div className="cm-shell flex min-h-[60vh] flex-col justify-end pb-12 pt-[calc(var(--cm-header)_+_2.5rem)] sm:pb-16 md:min-h-[62vh]">
        <Link
          href="/explore"
          className="mb-8 inline-flex w-fit items-center gap-1.5 text-[12px] text-ink-muted transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <ArrowRight className="size-3.5 rotate-180" aria-hidden />
          All series
        </Link>

        <div className="flex flex-col gap-7 sm:flex-row sm:items-start md:gap-10">
          <div className="relative aspect-[2/3] w-[132px] shrink-0 overflow-hidden rounded-md shadow-[var(--cm-shadow-xl)] ring-1 ring-white/15 sm:w-[180px] md:w-[248px]">
            <Image
              src={series.poster.src}
              alt={`Poster for ${series.title} (${series.year})`}
              fill
              priority
              quality={85}
              sizes="(min-width: 768px) 248px, (min-width: 640px) 180px, 132px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            {series.featuredRank !== undefined && series.featuredRank <= 3 ? (
              <Badge tone="gold" className="mb-4">
                Cinemora select
              </Badge>
            ) : null}

            <h1 id="series-title" className="font-display text-[clamp(2rem,5.2vw,3.75rem)] font-medium leading-[1.04] text-ink">
              {series.title}
            </h1>

            {hasOriginalTitle ? (
              <p className="mt-2.5 max-w-2xl font-display text-[15px] italic leading-relaxed text-ink-soft sm:text-base">
                {series.originalTitle}
              </p>
            ) : null}

            {series.tagline ? (
              <p className="mt-3 max-w-xl font-display text-[16px] italic leading-relaxed text-gold/90 sm:text-[17px]">
                {series.tagline}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[12.5px] text-ink-soft">
              <span className="cm-tabular">{series.year}</span>
              <MetaDot />
              <span className="cm-tabular">{series.seasonCount} season{series.seasonCount !== 1 ? "s" : ""}</span>
              <MetaDot />
              <span className="cm-tabular">{series.totalEpisodes} episode{series.totalEpisodes !== 1 ? "s" : ""}</span>
              <MetaDot />
              <span className="flex flex-wrap items-center gap-x-2">
                {series.genres.map((genre) => (
                  <Link
                    key={genre.slug}
                    href={`/genres/${genre.slug}`}
                    className="font-display text-[11.5px] uppercase tracking-[0.14em] text-gold/90 underline-offset-4 transition-colors hover:text-gold hover:underline"
                  >
                    {genre.name}
                  </Link>
                ))}
              </span>
              <MetaDot />
              <Badge tone="outline">{series.aspectRatio}</Badge>
              <Badge tone="outline">
                {series.color === "color" ? "Color" : series.color === "bw" ? "Black & white" : "Tinted"}
              </Badge>
            </div>

            <p className="mt-5 max-w-2xl text-[14.5px] leading-[1.8] text-ink-soft sm:text-[15px]">
              {series.synopsis}
            </p>

            {firstEpisode ? (
              <Link
                href={`/watch/${series.slug}/${firstSeason.slug}/${firstEpisode.slug}`}
                className={buttonClasses("primary", "lg")}
              >
                <Play className="size-4 fill-current" aria-hidden />
                {`Watch ${firstEpisode.title}`}
              </Link>
            ) : null}

            <dl className="mt-9 grid gap-x-8 gap-y-5 border-t border-white/10 pt-7 sm:grid-cols-2">
              {series.director && series.director.length > 0 ? (
                <>
                  <dt className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                    Directed by
                  </dt>
                  <dd className="mt-2.5 text-[13px] text-ink-soft">
                    {series.director.join(", ")}
                  </dd>
                </>
              ) : null}
              {series.writer && series.writer.length > 0 ? (
                <>
                  <dt className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                    Written by
                  </dt>
                  <dd className="mt-2.5 text-[13px] text-ink-soft">
                    {series.writer.join(", ")}
                  </dd>
                </>
              ) : null}
              {series.cast && series.cast.length > 0 ? (
                <>
                  <dt className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                    Starring
                  </dt>
                  <dd className="mt-2.5 text-[13px] text-ink-soft">
                    {series.cast.map((member) => member.name).join(", ")}
                  </dd>
                </>
              ) : null}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetaDot() {
  return (
    <span aria-hidden className="text-ink-muted/60">
      ·
    </span>
  );
}

function Image(props: {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  className?: string;
}) {
  return (
    <img
      src={props.src}
      alt={props.alt}
      style={{
        width: props.fill ? "100%" : undefined,
        height: props.fill ? "100%" : undefined,
        objectFit: props.fill ? "cover" : undefined,
        objectPosition: "center",
        display: "block",
      }}
      className={props.className}
      loading={props.priority ? "eager" : "lazy"}
      decoding={props.priority ? "sync" : "async"}
    />
  );
}

/** A season row: poster, title, episode count and "Watch" link to the first episode. */
export function SeasonRow({ season }: { season: Season }) {
  return (
    <Link
      href={`/series/${season.slug.split("-")[0]}/season/${season.slug}`}
      className="group flex w-full cursor-pointer gap-4"
    >
      <div className="relative aspect-[2/3] w-[160px] shrink-0 overflow-hidden rounded-md shadow-[var(--cm-shadow-lg)] ring-1 ring-white/10 transition group-hover:ring-gold/50">
        <img
          src={season.poster?.src ?? "/posters/placeholder.webp"}
          alt={`Season ${season.seasonNumber} poster`}
          className="object-cover w-full h-full"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
          S{season.seasonNumber}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-sm font-semibold leading-tight text-ink group-hover:text-gold transition-colors">
          {season.title}
        </h3>
        <p className="mt-1 text-[11.5px] text-ink-muted line-clamp-2">
          {season.overview ?? `Season ${season.seasonNumber} of the series.`}
        </p>
        <p className="mt-2 text-[11px] text-ink-muted">
          {season.episodeCount} episode{season.episodeCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}

export function WatchEpisodeButton({ episode, series, season }: { episode: Episode; series: TVSeries; season: Season }) {
  return (
    <Link
      href={`/watch/${series.slug}/${season.slug}/${episode.slug}`}
      className={buttonClasses("primary", "sm")}
    >
      <Play className="size-3.5 fill-current" aria-hidden />
      Watch
    </Link>
  );
}

export type { Episode, Season };
