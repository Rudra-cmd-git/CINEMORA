import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerLoader } from "@/components/player/player-loader";
import { parseInitialTime, toPlayerWatchable } from "@/components/player/player-utils";
import { getEpisode, series } from "@/lib/catalogue";

interface WatchEpisodePageProps {
  params: Promise<{ title: string; seasonSlug: string; episodeSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export function generateStaticParams() {
  const params: { title: string; seasonSlug: string; episodeSlug: string }[] = [];
  for (const show of series) {
    for (const season of show.seasons) {
      for (const episode of season.episodes) {
        params.push({
          title: show.slug,
          seasonSlug: season.slug,
          episodeSlug: episode.slug,
        });
      }
    }
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: WatchEpisodePageProps): Promise<Metadata> {
  const { title, seasonSlug, episodeSlug } = await params;
  const resolved = getEpisode(title, seasonSlug, episodeSlug);
  if (!resolved) return { title: "Episode not found" };

  const { series, season, episode } = resolved;
  return {
    title: `Watch ${series.title} — S${season.seasonNumber}E${episode.episodeNumber}`,
    description: episode.synopsis ?? series.synopsis,
    openGraph: {
      type: "video.episode",
      title: `${series.title} · S${season.seasonNumber}E${episode.episodeNumber}`,
      description: episode.synopsis ?? series.synopsis,
      images: [
        {
          url: episode.poster?.src ?? series.poster.src,
          width: (episode.poster?.width ?? series.poster.width) || 600,
          height: (episode.poster?.height ?? series.poster.height) || 900,
          alt: `${series.title} — ${episode.title}`,
        },
      ],
    },
  };
}

export default async function WatchEpisodePage({
  params,
  searchParams,
}: WatchEpisodePageProps) {
  const { title, seasonSlug, episodeSlug } = await params;
  const resolved = getEpisode(title, seasonSlug, episodeSlug);
  if (!resolved) notFound();

  const { series, season, episode } = resolved;

  const query = await searchParams;
  const initialTime = parseInitialTime(query.t);

  return (
    <PlayerLoader
      movie={toPlayerWatchable(episode, series.year)}
      initialTime={initialTime}
    />
  );
}
