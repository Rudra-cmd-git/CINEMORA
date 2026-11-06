import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Genre } from "@/types";

export interface GenreNavProps {
  genres: Genre[];
  activeSlug?: string;
  className?: string;
}

/** Cross-navigation between genres — used on the genre detail pages. */
export function GenreNav({ genres, activeSlug, className }: GenreNavProps) {
  return (
    <ul role="list" className={cn("flex flex-wrap gap-2", className)}>
      {genres.map((genre) => {
        const active = genre.slug === activeSlug;
        return (
          <li key={genre.slug}>
            <Link
              href={`/genres/${genre.slug}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                active
                  ? "border-gold/60 bg-gold-soft text-gold"
                  : "border-line text-ink-soft hover:border-line-strong hover:text-ink",
              )}
            >
              {genre.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
