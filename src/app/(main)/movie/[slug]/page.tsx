import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MovieHero } from "@/components/catalogue/movie-hero";
import { PosterGrid } from "@/components/catalogue/poster-grid";
import { MovieRightsPanel } from "@/components/catalogue/rights-panel";
import { buttonClasses } from "@/components/ui/button-styles";
import { getMovie, getRelatedMovies, movies } from "@/lib/catalogue";
import { SITE } from "@/lib/constants";

interface MoviePageProps {
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
  return movies.map((movie) => ({ slug: movie.slug }));
}

/** Every film is generated ahead of time — unknown slugs are a 404. */
export const dynamicParams = false;

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = getMovie(slug);
  if (!movie) return { title: "Film not found" };

  const title = `${movie.title} (${movie.year})`;
  const description = summarise(
    [movie.tagline, movie.synopsis].filter(Boolean).join(" "),
  );
  const genreNames = movie.genres.map((genre) => genre.name).join(", ");

  return {
    title,
    description,
    keywords: [movie.title, ...movie.director, ...movie.genres.map((genre) => genre.name), String(movie.year)],
    alternates: { canonical: `/movie/${movie.slug}` },
    openGraph: {
      type: "video.movie",
      title: `${title} · ${SITE.name}`,
      description,
      url: `/movie/${movie.slug}`,
      siteName: SITE.name,
      images: [
        {
          url: movie.poster.src,
          width: movie.poster.width,
          height: movie.poster.height,
          alt: `Poster for ${movie.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE.name}`,
      description,
      images: [movie.poster.src],
    },
    other: {
      "film:year": String(movie.year),
      "film:genre": genreNames,
    },
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { slug } = await params;
  const movie = getMovie(slug);
  if (!movie) notFound();

  const related = getRelatedMovies(movie, 6);
  const primaryGenre = movie.genres[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    ...(movie.originalTitle ? { alternateName: movie.originalTitle } : {}),
    description: movie.synopsis,
    image: `${SITE.url}${movie.poster.src}`,
    url: `${SITE.url}/movie/${movie.slug}`,
    datePublished: String(movie.year),
    genre: movie.genres.map((genre) => genre.name),
    director: movie.director.map((name) => ({ "@type": "Person", name })),
    actor: movie.cast.map((member) => ({ "@type": "Person", name: member.name })),
    ...(movie.composer && movie.composer.length > 0
      ? { musicBy: movie.composer.map((name) => ({ "@type": "Person", name })) }
      : {}),
    duration: `PT${movie.runtimeMinutes}M`,
    inLanguage: movie.language,
    countryOfOrigin: { "@type": "Country", name: movie.country },
    isAccessibleForFree: true,
    sameAs: movie.sourcePage,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <MovieHero movie={movie} />

      <section aria-labelledby="related-heading" className="cm-shell py-14 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              Keep watching
            </p>
            <h2
              id="related-heading"
              className="mt-3 font-display text-2xl leading-tight text-ink sm:text-3xl"
            >
              More like this
            </h2>
          </div>
          {primaryGenre ? (
            <Link
              href={`/genres/${primaryGenre.slug}`}
              className={buttonClasses("ghost", "sm")}
            >
              All {primaryGenre.name} films
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
        <div className="mt-8">
          <PosterGrid movies={related} variant="related" />
        </div>
      </section>

      <MovieRightsPanel movie={movie} />
    </article>
  );
}
