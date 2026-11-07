import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerLoader } from "@/components/player/player-loader";
import { parseInitialTime, toPlayerMovie } from "@/components/player/player-utils";
import { getMovie } from "@/lib/catalogue";

interface WatchPageProps {
  params: Promise<{ title: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { title } = await params;
  const movie = getMovie(title);
  if (!movie) return { title: "Film not found" };

  return {
    title: `Watch ${movie.title}`,
    description: movie.synopsis,
    openGraph: {
      type: "video.other",
      title: `${movie.title} (${movie.year})`,
      description: movie.synopsis,
      images: [
        {
          url: movie.backdrop.src,
          width: movie.backdrop.width,
          height: movie.backdrop.height,
          alt: `${movie.title} backdrop`,
        },
      ],
    },
  };
}

/**
 * `/watch/[title]` — server component.
 *
 * Resolves the film from the catalogue (404 otherwise) and hands the client
 * player a compact projection plus an optional `?t=` deep-link position
 * (seconds or clock notation, e.g. `?t=754` or `?t=12:34`).
 */
export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { title } = await params;
  const movie = getMovie(title);
  if (!movie) notFound();

  const query = await searchParams;
  const initialTime = parseInitialTime(query.t);

  return <PlayerLoader movie={toPlayerMovie(movie)} initialTime={initialTime} />;
}
