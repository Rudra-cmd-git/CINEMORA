import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MovieActions } from "@/components/catalogue/movie-actions";
import { Badge } from "@/components/ui/badge";
import { formatRuntime, formatYear } from "@/lib/utils";
import type { Movie } from "@/types";

const COLOR_LABEL: Record<Movie["color"], string> = {
  color: "Color",
  bw: "Black & white",
  tinted: "Tinted",
};

interface CreditItem {
  name: string;
  detail?: string;
}

function CreditGroup({
  label,
  items,
  className,
}: {
  label: string;
  items: CreditItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <dt className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-2.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={`${item.name}-${item.detail ?? ""}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12px] leading-none text-ink-soft backdrop-blur-sm"
          >
            <span className="text-ink">{item.name}</span>
            {item.detail ? <span className="text-ink-muted">· {item.detail}</span> : null}
          </span>
        ))}
      </dd>
    </div>
  );
}

function MetaDot() {
  return (
    <span aria-hidden className="text-ink-muted/60">
      ·
    </span>
  );
}

/** Full-bleed film hero: backdrop, poster and editorial detail. Server component. */
export function MovieHero({ movie }: { movie: Movie }) {
  const hasOriginalTitle =
    Boolean(movie.originalTitle) && movie.originalTitle !== movie.title;

  return (
    <section aria-labelledby="film-title" className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={movie.backdrop.src}
          alt=""
          fill
          priority
          quality={82}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[var(--cm-grad-hero)]" />
        <div className="absolute inset-0 bg-[var(--cm-grad-hero-side)]" />
        <div className="absolute inset-x-0 top-0 h-[calc(var(--cm-header)_+_6rem)] bg-gradient-to-b from-canvas/90 via-canvas/45 to-transparent" />
      </div>

      <div className="cm-shell flex min-h-[60vh] flex-col justify-end pb-12 pt-[calc(var(--cm-header)_+_2.5rem)] sm:pb-16 md:min-h-[62vh]">
        <Link
          href="/explore"
          className="mb-8 inline-flex w-fit items-center gap-1.5 text-[12px] text-ink-muted transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          All films
        </Link>

        <div className="flex flex-col gap-7 sm:flex-row sm:items-start md:gap-10">
          <div className="relative aspect-[2/3] w-[132px] shrink-0 overflow-hidden rounded-md shadow-[var(--cm-shadow-xl)] ring-1 ring-white/15 sm:w-[180px] md:w-[248px]">
            <Image
              src={movie.poster.src}
              alt={`Poster for ${movie.title} (${movie.year})`}
              fill
              priority
              quality={85}
              sizes="(min-width: 768px) 248px, (min-width: 640px) 180px, 132px"
              placeholder={movie.poster.blurDataURL ? "blur" : "empty"}
              blurDataURL={movie.poster.blurDataURL}
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            {movie.featuredRank !== undefined && movie.featuredRank <= 3 ? (
              <Badge tone="gold" className="mb-4">
                Cinemora select
              </Badge>
            ) : null}

            <h1
              id="film-title"
              className="font-display text-[clamp(2rem,5.2vw,3.75rem)] font-medium leading-[1.04] text-ink"
            >
              {movie.title}
            </h1>

            {hasOriginalTitle ? (
              <p className="mt-2.5 max-w-2xl font-display text-[15px] italic leading-relaxed text-ink-soft sm:text-base">
                {movie.originalTitle}
              </p>
            ) : null}

            {movie.tagline ? (
              <p className="mt-3 max-w-xl font-display text-[16px] italic leading-relaxed text-gold/90 sm:text-[17px]">
                {movie.tagline}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[12.5px] text-ink-soft">
              <span className="cm-tabular">{formatYear(movie.year)}</span>
              <MetaDot />
              <span className="cm-tabular">{formatRuntime(movie.runtimeMinutes)}</span>
              <MetaDot />
              <span className="flex flex-wrap items-center gap-x-2">
                {movie.genres.map((genre) => (
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
              <Badge tone="outline">{movie.aspectRatio}</Badge>
              <Badge tone="outline">{COLOR_LABEL[movie.color]}</Badge>
            </div>

            <p className="mt-5 max-w-2xl text-[14.5px] leading-[1.8] text-ink-soft sm:text-[15px]">
              {movie.synopsis}
            </p>

            <MovieActions movie={movie} />

            <dl className="mt-9 grid gap-x-8 gap-y-5 border-t border-white/10 pt-7 sm:grid-cols-2">
              <CreditGroup label="Directed by" items={movie.director.map((name) => ({ name }))} />
              {movie.writer && movie.writer.length > 0 ? (
                <CreditGroup label="Written by" items={movie.writer.map((name) => ({ name }))} />
              ) : null}
              {movie.composer && movie.composer.length > 0 ? (
                <CreditGroup label="Music by" items={movie.composer.map((name) => ({ name }))} />
              ) : null}
              <CreditGroup
                label="Starring"
                className="sm:col-span-2"
                items={movie.cast.map((member) => ({ name: member.name, detail: member.role }))}
              />
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
