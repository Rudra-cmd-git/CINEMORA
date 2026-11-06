import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-styles";
import { getSpotlight } from "@/lib/catalogue";

export function NotFoundContent({
  title = "Reel missing",
  description = "That page has slipped out of the archive. The rest of the collection is still here.",
}: {
  title?: string;
  description?: string;
}) {
  const suggestions = getSpotlight(3);

  return (
    <div className="relative flex min-h-[86vh] items-center overflow-hidden">
      <div aria-hidden className="absolute inset-0 opacity-[0.18]">
        <Image
          src={suggestions[0].backdrop.src}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/85 to-canvas/60" />
      </div>

      <div className="cm-shell relative py-24">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">404</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">{description}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/explore" className={buttonClasses("primary", "md")}>
            Browse the collection
          </Link>
          <Link href="/" className={buttonClasses("secondary", "md")}>
            Back to home
          </Link>
        </div>

        <div className="mt-16">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Start here</p>
          <ul className="mt-4 flex gap-4">
            {suggestions.map((movie) => (
              <li key={movie.slug}>
                <Link
                  href={`/movie/${movie.slug}`}
                  className="group flex items-center gap-3 text-sm text-ink-soft transition-colors hover:text-ink"
                >
                  <span className="relative h-[72px] w-12 shrink-0 overflow-hidden rounded-sm ring-1 ring-line">
                    <Image
                      src={movie.poster.src}
                      alt={`Poster for ${movie.title}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                  <span>
                    <span className="block text-[13px] text-ink">{movie.title}</span>
                    <span className="mt-0.5 block text-[11.5px] text-ink-muted cm-tabular">
                      {movie.year}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
