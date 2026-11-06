import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ContinueRow, type ContinueEntry } from "@/components/movie/continue-row";
import { HeroCarousel } from "@/components/movie/hero";
import { MovieRow } from "@/components/movie/row";
import { buttonClasses } from "@/components/ui/button-styles";
import {
  getFeaturedSeries,
  getHomeRows,
  getSearchIndex,
  movies,
  series,
  totalRuntimeMinutes,
} from "@/lib/catalogue";

/**
 * CINEMORA homepage.
 *
 * A server component: the catalogue is read here once and only plain,
 * serialisable arrays cross into the interactive leaves. Each client component
 * is a self-contained leaf (billboard, continue rail, poster rails) so no
 * catalogue module is pulled into the browser bundle by them.
 */
export default function HomePage() {
  const spotlight = movies.slice(0, 3);
  const rows = getHomeRows();

  // Compact projection for the localStorage-backed Continue rail. The client
  // joins playback progress to these entries by slug.
  const continueEntries: ContinueEntry[] = getSearchIndex().map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    year: entry.year,
    runtimeMinutes: entry.runtimeMinutes,
    genres: entry.genres.slice(0, 2).map((genre) => genre.name),
    poster: entry.poster,
  }));

  const years = movies.map((movie) => movie.year);
  const earliestYear = Math.min(...years);
  const latestYear = Math.max(...years);
  const totalHours = Math.round(totalRuntimeMinutes(movies) / 60);
  const verifiedCount = movies.filter(
    (movie) => movie.rights.overallStatus === "verified",
  ).length;
  const featuredSeries = getFeaturedSeries();

  const stats = [
    { label: "Films", value: String(movies.length), note: "Hand-picked, not aggregated" },
    { label: "Series", value: String(series.length), note: "Full seasons, every episode" },
    { label: "Years", value: `${earliestYear}–${latestYear}`, note: "Silent era to the sixties" },
    { label: "Run time", value: `${totalHours} hrs`, note: "Of uninterrupted cinema" },
    {
      label: "Rights verified",
      value: `${verifiedCount}/${movies.length}`,
      note: "Streams and artwork",
    },
  ];

  return (
    <>
      <HeroCarousel movies={spotlight} />

      <div className="space-y-14 pb-20 pt-12 sm:space-y-16 sm:pb-24 sm:pt-16">
        <ContinueRow movies={continueEntries} />

        {rows.map((row) => (
          <MovieRow
            key={row.id}
            title={row.title}
            blurb={row.blurb}
            genreSlug={row.genreSlug}
            movies={row.movies}
          />
        ))}

        {/* Web series rail */}
        {featuredSeries && (
          <section aria-labelledby="series-heading" className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                  Web series
                </p>
                <h2 id="series-heading" className="mt-3 font-display text-2xl leading-tight text-ink sm:text-3xl">
                  Stream full series
                </h2>
              </div>
              <Link
                href="/explore"
                className={buttonClasses("ghost", "sm")}
              >
                All series
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <div className="mt-8 flex gap-4 overflow-x-auto scrollbar-hide pb-4 sm:overflow-x-hidden sm:flex-wrap sm:gap-6 lg:gap-8">
              {series.map((show) => (
                <SeriesCard key={show.slug} show={show} />
              ))}
            </div>
            <p className="mt-6 text-[12.5px] text-ink-muted">
              Every season and episode streams the same way films do — pick a title,
              choose an episode, and watch.
            </p>
          </section>
        )}
      </div>

      {/* Closing editorial band */}
      <section aria-labelledby="collection-story" className="pb-2">
        <div className="cm-shell">
          <div className="relative overflow-hidden rounded-xl border border-line bg-elevated">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{ backgroundImage: "var(--cm-grad-gold-soft)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--cm-line-gold)] to-transparent"
            />

            <div className="relative grid gap-12 p-7 sm:p-11 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16 lg:p-16">
              <div>
                <p className="flex items-center gap-3 text-[10.5px] font-medium uppercase tracking-[0.32em] text-gold">
                  <span aria-hidden className="h-px w-7 bg-gold/70" />
                  About the collection
                </p>

                <h2
                  id="collection-story"
                  className="mt-5 max-w-xl font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.015em] text-ink"
                >
                  The collection belongs to everyone.
                </h2>

                <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-ink-soft">
                  Every title here has outlived its copyright and entered the public domain.
                  We verify each stream against its archive source, restore the artwork
                  in-house, and present the films without adverts, interruptions, or an
                  account to sign into.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/about" className={buttonClasses("primary", "md")}>
                    Our rights standard
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                  <Link href="/explore" className={buttonClasses("outline", "md")}>
                    Browse the collection
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-7 border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-muted">
                      {stat.label}
                    </dt>
                    <dd>
                      <span className="cm-tabular mt-2 block font-display text-2xl leading-none text-ink sm:text-3xl">
                        {stat.value}
                      </span>
                      <span className="mt-2 block text-[11.5px] leading-relaxed text-ink-muted">
                        {stat.note}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Compact series card for the homepage rail. Server component. */
function SeriesCard({ show }: { show: (typeof series)[number] }) {
  return (
    <Link
      href={`/series/${show.slug}`}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-[2/3] w-[160px] shrink-0 overflow-hidden rounded-md shadow-[var(--cm-shadow-lg)] ring-1 ring-white/10 group-hover:ring-gold/50 transition ring-transition duration-300">
        <img
          src={show.poster.src}
          alt={`Poster for ${show.title} (${show.year})`}
          className="object-cover w-full h-full"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
          Series
        </span>
      </div>
      <h3 className="font-display text-sm font-semibold leading-tight text-ink group-hover:text-gold transition-colors line-clamp-1">
        {show.title}
      </h3>
      <p className="text-[11px] text-ink-muted">
        {show.year} · {show.seasonCount} season{show.seasonCount !== 1 ? "s" : ""} · {show.totalEpisodes} episode{show.totalEpisodes !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}
