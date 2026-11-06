import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerLoader } from "@/components/player/player-loader";
import { parseInitialTime, toPlayerWatchable } from "@/components/player/player-utils";
import { getEpisode } from "@/lib/catalogue";

interface WatchEpisodePageProps {
  params: Promise<{ seriesSlug: string; seasonSlug: string; episodeSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export function generateStaticParams() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { series } = require("@/lib/catalogue");
  const params: { seriesSlug: string; seasonSlug: string; episodeSlug: string }[] = [];
  for (const show of series) {
    for (const season of show.seasons) {
      for (const episode of season.episodes) {
        params.push({
          seriesSlug: show.slug,
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
  const { seriesSlug, seasonSlug, episodeSlug } = await params;
  const resolved = getEpisode(seriesSlug, seasonSlug, episodeSlug);
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
  const { seriesSlug, seasonSlug, episodeSlug } = await params;
  const resolved = getEpisode(seriesSlug, seasonSlug, episodeSlug);
  if (!resolved) notFound();

  const { series, season, episode } = resolved;

  const query = await searchParams;
  const initialTime = parseInitialTime(query.t);

  return (
    <PlayerLoader
      movie={toPlayerWatchable(episode)}
      initialTime={initialTime}
    />
  );
}
