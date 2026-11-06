import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { GenreNav } from "@/components/catalogue/genre-nav";
import { PageIntro } from "@/components/catalogue/page-intro";
import { PosterGrid } from "@/components/catalogue/poster-grid";
import { buttonClasses } from "@/components/ui/button-styles";
import { getActiveGenres, getGenre, getMoviesByGenre } from "@/lib/catalogue";
import { formatRuntime } from "@/lib/utils";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getActiveGenres().map((genre) => ({ slug: genre.slug }));
}

/** Only generated genres are valid — anything else is a 404. */
export const dynamicParams = false;

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const { slug } = await params;
  const genre = getGenre(slug);
  if (!genre) return { title: "Genre not found" };

  return {
    title: `${genre.name} films`,
    description:
      genre.description ??
      `Every ${genre.name.toLowerCase()} film in the Cinemora collection, free to watch in the public domain.`,
    alternates: { canonical: `/genres/${genre.slug}` },
    openGraph: {
      title: `${genre.name} films · Cinemora`,
      description: genre.description,
      url: `/genres/${genre.slug}`,
    },
  };
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { slug } = await params;
  const genre = getGenre(slug);
  if (!genre) notFound();

  const genreMovies = getMoviesByGenre(genre.slug);
  const genres = getActiveGenres();
  const years = genreMovies.map((movie) => movie.year);
  const firstYear = years.length > 0 ? Math.min(...years) : null;
  const lastYear = years.length > 0 ? Math.max(...years) : null;
  const runtime = formatRuntime(
    genreMovies.reduce((total, movie) => total + movie.runtimeMinutes, 0),
  );

  return (
    <div className="pt-[var(--cm-header)]">
      <div className="cm-shell pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink-muted">
            <li>
              <Link
                href="/explore"
                className="underline-offset-4 transition-colors hover:text-gold hover:underline"
              >
                Explore
              </Link>
            </li>
            <li aria-hidden className="text-ink-muted/60">
              /
            </li>
            <li aria-current="page" className="text-ink-soft">
              {genre.name}
            </li>
          </ol>
        </nav>
      </div>

      <PageIntro
        eyebrow="Genre"
        title={genre.name}
        description={genre.description ?? `Every ${genre.name.toLowerCase()} film in the collection.`}
        className="pt-8 sm:pt-10"
      >
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="cm-tabular text-[12.5px] text-ink-muted">
            {genreMovies.length} {genreMovies.length === 1 ? "film" : "films"}
            {firstYear && lastYear
              ? ` · ${firstYear === lastYear ? firstYear : `${firstYear}–${lastYear}`}`
              : null}
            {genreMovies.length > 0 ? ` · ${runtime}` : null}
          </p>
          <span aria-hidden className="text-ink-muted/40">
            ·
          </span>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-[12.5px] text-ink-soft underline-offset-4 transition-colors hover:text-gold hover:underline"
          >
            Browse the full catalogue
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </PageIntro>

      <div className="cm-shell py-10 sm:py-14">
        {genreMovies.length > 0 ? (
          <PosterGrid movies={genreMovies} priorityCount={5} />
        ) : (
          <div className="rounded-lg border border-line bg-elevated/30 px-6 py-16 text-center">
            <h2 className="font-display text-xl text-ink">Nothing in this genre yet</h2>
            <p className="mt-2 text-[13.5px] text-ink-muted">
              We are still verifying titles for this shelf. The rest of the collection is
              waiting.
            </p>
            <Link href="/explore" className={buttonClasses("secondary", "md", "mt-6")}>
              Browse all films
            </Link>
          </div>
        )}
      </div>

      <section aria-labelledby="other-genres-heading" className="cm-shell pb-20">
        <div className="border-t border-line pt-10">
          <h2
            id="other-genres-heading"
            className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-muted"
          >
            Browse other genres
          </h2>
          <GenreNav genres={genres} activeSlug={genre.slug} className="mt-5" />
        </div>
      </section>
    </div>
  );
}
