import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SeriesHero } from "@/components/catalogue/series-hero";
import { buttonClasses } from "@/components/ui/button-styles";
import { getSeries, getRelatedSeries, series as allSeries } from "@/lib/catalogue";
import { SITE } from "@/lib/constants";
import type { TVSeries } from "@/types";

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

function summarise(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

export function generateStaticParams() {
  return allSeries.map((show) => ({ slug: show.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const show = getSeries(slug);
  if (!show) return { title: "Series not found" };

  const title = `${show.title} (${show.year})`;
  const description = summarise(
    [show.tagline, show.synopsis].filter(Boolean).join(" "),
  );
  const genreNames = show.genres.map((genre) => genre.name).join(", ");

  return {
    title,
    description,
    keywords: [show.title, ...show.genres.map((genre) => genre.name), String(show.year)],
    alternates: { canonical: `/series/${show.slug}` },
    openGraph: {
      type: "video.tv_show",
      title: `${title} · ${SITE.name}`,
      description,
      url: `/series/${show.slug}`,
      siteName: SITE.name,
      images: [
        {
          url: show.poster.src,
          width: show.poster.width,
          height: show.poster.height,
          alt: `Poster for ${show.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE.name}`,
      description,
      images: [show.poster.src],
    },
    other: {
      "tv:year": String(show.year),
      "tv:genre": genreNames,
    },
  };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { slug } = await params;
  const show = getSeries(slug);
  if (!show) notFound();

  const related = getRelatedSeries(show, 6);

  return (
    <article>
      <SeriesHero series={show} />

      <section aria-labelledby="seasons-heading" className="cm-shell py-14 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              Seasons
            </p>
            <h2 id="seasons-heading" className="mt-3 font-display text-2xl leading-tight text-ink sm:text-3xl">
              Seasons &amp; episodes
            </h2>
          </div>
          {show.genres[0] && (
            <Link
              href={`/genres/${show.genres[0].slug}`}
              className={buttonClasses("ghost", "sm")}
            >
              All {show.genres[0].name} titles
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-6 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {show.seasons.map((season) => (
            <SeasonPanel key={season.slug} season={season} seriesSlug={show.slug} />
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="cm-shell py-14 sm:py-16 border-t border-line/60">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                More like this
              </p>
              <h2 id="related-heading" className="mt-3 font-display text-2xl leading-tight text-ink sm:text-3xl">
                Similar series
              </h2>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            {related.map((show) => (
              <div key={show.slug} className="min-w-[170px]">
                <Link
                  href={`/series/${show.slug}`}
                  className="block"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface mb-2 ring-1 ring-white/10 group">
                    <Image
                      src={show.poster.src}
                      alt={`Poster for ${show.title} (${show.year})`}
                      fill
                      quality={82}
                      className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-[13px] font-medium leading-snug text-ink group-hover:text-gold transition-colors">
                    {show.title}
                  </h3>
                  <p className="text-[11.5px] text-ink-muted">
                    {show.year} · {show.seasonCount} season{show.seasonCount !== 1 ? "s" : ""}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function SeasonPanel({
  season,
  seriesSlug,
}: {
  season: {
    slug: string;
    title: string;
    seasonNumber: number;
    overview?: string;
    episodeCount: number;
    episodes: { slug: string; title: string; episodeNumber: number }[];
  };
  seriesSlug: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-elevated/40 p-4 sm:p-6 shadow-[var(--cm-shadow-sm)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-sm font-semibold leading-tight text-ink sm:text-base">
            {season.title}
          </h3>
          <p className="mt-1 text-[11.5px] text-ink-muted line-clamp-2">
            {season.overview ?? `Season ${season.seasonNumber}`}
          </p>
          <p className="mt-2 text-[11px] text-ink-muted">
            {season.episodeCount} episode{season.episodeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
          S{season.seasonNumber}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {season.episodes.map((episode) => (
          <EpisodeButton
            key={episode.slug}
            episode={episode}
            season={season}
            seriesSlug={seriesSlug}
          />
        ))}
      </div>
    </div>
  );
}

function EpisodeButton({
  episode,
  season,
  seriesSlug,
}: {
  episode: { slug: string; title: string; episodeNumber: number };
  season: { seasonNumber: number };
  seriesSlug: string;
}) {
  return (
    <Link
      href={`/watch/${seriesSlug}/${`season-${season.seasonNumber}`}/${episode.slug}`}
      className={buttonClasses("ghost", "sm")}
    >
      {`S${season.seasonNumber} E${episode.episodeNumber} · {episode.title}`}
    </Link>
  );
}
