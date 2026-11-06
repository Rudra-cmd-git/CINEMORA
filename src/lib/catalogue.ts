import catalogueData from "../../data/movies.json";
import { FEATURED_ROWS, GENRES } from "@/lib/constants";
import type {
  Catalogue,
  Episode,
  Genre,
  Movie,
  Season,
  Title,
  TitleType,
  TVSeries,
  Watchable,
} from "@/types";

const catalogue = catalogueData as unknown as Catalogue;

const movies: Movie[] = [...catalogue.movies].sort((a, b) => {
  const rankA = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
  const rankB = b.featuredRank ?? Number.MAX_SAFE_INTEGER;
  if (rankA !== rankB) return rankA - rankB;
  return a.title.localeCompare(b.title);
});

const series: TVSeries[] = [...(catalogue.series ?? [])].sort((a, b) => {
  const rankA = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
  const rankB = b.featuredRank ?? Number.MAX_SAFE_INTEGER;
  if (rankA !== rankB) return rankA - rankB;
  return a.title.localeCompare(b.title);
});

export const catalogueGeneratedAt: string = catalogue.generatedAt;

/** Every title in the catalogue (films + web series), ordered by editorial rank then title. */
export const titles: Title[] = [...movies, ...series].sort((a, b) => {
  const rankA = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
  const rankB = b.featuredRank ?? Number.MAX_SAFE_INTEGER;
  if (rankA !== rankB) return rankA - rankB;
  return a.title.localeCompare(b.title);
});

export { movies, series };

const bySlug = new Map<string, Title>();
for (const movie of movies) bySlug.set(movie.slug, movie);
for (const show of series) bySlug.set(show.slug, show);

export function getTitle(slug: string): Title | undefined {
  return bySlug.get(slug);
}

export function getMovie(slug: string): Movie | undefined {
  const found = bySlug.get(slug);
  return found?.type === "movie" ? found : undefined;
}

export function getSeries(slug: string): TVSeries | undefined {
  const found = bySlug.get(slug);
  return found?.type === "series" ? found : undefined;
}

export function getMovies(slugs: string[]): Movie[] {
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((movie): movie is Movie => movie !== undefined && movie.type === "movie");
}

export function getSeriesBySlugs(slugs: string[]): TVSeries[] {
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((show): show is TVSeries => show !== undefined && show.type === "series");
}

export function getGenre(slug: string): Genre | undefined {
  return GENRES.find((genre) => genre.slug === slug);
}

export function getMoviesByGenre(genreSlug: string): Movie[] {
  return movies.filter((movie) => movie.genres.some((genre) => genre.slug === genreSlug));
}

export function getSeriesByGenre(genreSlug: string): TVSeries[] {
  return series.filter((show) => show.genres.some((genre) => genre.slug === genreSlug));
}

export function getTitlesByGenre(genreSlug: string): Title[] {
  return titles.filter((title) => title.genres.some((genre) => genre.slug === genreSlug));
}

/** Genres that actually have films or series, ordered by catalogue prevalence. */
export function getActiveGenres(): Genre[] {
  const counts = new Map<string, number>();
  for (const title of titles) {
    for (const genre of title.genres) {
      counts.set(genre.slug, (counts.get(genre.slug) ?? 0) + 1);
    }
  }
  return GENRES.filter((genre) => (counts.get(genre.slug) ?? 0) > 0).sort(
    (a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0),
  );
}

export function getAllGenres(): Genre[] {
  return GENRES;
}

/** Hero carousel selection: the top-ranked titles. */
export function getSpotlight(limit = 3): Title[] {
  return titles.slice(0, limit);
}

export function getFeaturedMovie(): Movie {
  return movies[0];
}

export function getFeaturedSeries(): TVSeries | undefined {
  return series[0];
}

export interface CatalogueRow {
  id: string;
  title: string;
  blurb?: string;
  genreSlug: string;
  movies: Movie[];
  series: TVSeries[];
}

export function getHomeRows(): CatalogueRow[] {
  return FEATURED_ROWS.map((row) => ({
    id: row.id,
    title: row.title,
    blurb: row.blurb,
    genreSlug: row.genreSlug,
    movies: getMoviesByGenre(row.genreSlug),
    series: getSeriesByGenre(row.genreSlug),
  })).filter((row) => row.movies.length > 0 || row.series.length > 0);
}

/** Similar films: shared genres first, then same decade, then the rest. */
export function getRelatedMovies(movie: Movie, limit = 6): Movie[] {
  const genreIds = new Set(movie.genres.map((genre) => genre.id));

  const scored = movies
    .filter((candidate) => candidate.slug !== movie.slug)
    .map((candidate) => {
      let score = candidate.genres.filter((genre) => genreIds.has(genre.id)).length * 10;
      if (Math.abs(candidate.year - movie.year) <= 5) score += 4;
      if (candidate.director.some((director) => movie.director.includes(director))) score += 6;
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, limit).map((entry) => entry.candidate);
  if (picked.length >= limit) return picked;

  for (const candidate of movies) {
    if (picked.length >= limit) break;
    if (candidate.slug === movie.slug) continue;
    if (picked.some((item) => item.slug === candidate.slug)) continue;
    picked.push(candidate);
  }

  return picked;
}

/** Similar series: shared genres first, then same decade, then the rest. */
export function getRelatedSeries(show: TVSeries, limit = 6): TVSeries[] {
  const genreIds = new Set(show.genres.map((genre) => genre.id));

  const scored = series
    .filter((candidate) => candidate.slug !== show.slug)
    .map((candidate) => {
      let score = candidate.genres.filter((genre) => genreIds.has(genre.id)).length * 10;
      if (Math.abs(candidate.year - show.year) <= 5) score += 4;
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, limit).map((entry) => entry.candidate);
  if (picked.length >= limit) return picked;

  for (const candidate of series) {
    if (picked.length >= limit) break;
    if (candidate.slug === show.slug) continue;
    if (picked.some((item) => item.slug === candidate.slug)) continue;
    picked.push(candidate);
  }

  return picked;
}

/** Resolve a season and episode within a series by their slugs. */
export function getEpisode(
  seriesSlug: string,
  seasonSlug: string,
  episodeSlug: string,
): { series: TVSeries; season: Season; episode: Episode } | undefined {
  const show = getSeries(seriesSlug);
  if (!show) return undefined;
  const season = show.seasons.find((s) => s.slug === seasonSlug);
  if (!season) return undefined;
  const episode = season.episodes.find((e) => e.slug === episodeSlug);
  if (!episode) return undefined;
  return { series: show, season, episode };
}

/** Aggregate runtime for editorial copy. */
export function totalRuntimeMinutes(list: Movie[]): number {
  return list.reduce((sum, movie) => sum + movie.runtimeMinutes, 0);
}

/**
 * Compact projection handed to client components so the full catalogue
 * (synopses, rights records, stream URLs) never ships to the browser.
 */
export interface SearchEntry {
  slug: string;
  title: string;
  type: TitleType;
  originalTitle?: string;
  year: number;
  runtimeMinutes: number;
  synopsis: string;
  director: string[];
  cast: { name: string; role: string }[];
  genres: Genre[];
  poster: Movie["poster"];
  featuredRank?: number;
  /** For series: total episode count and season count. */
  totalEpisodes?: number;
  seasonCount?: number;
}

export function getSearchIndex(): SearchEntry[] {
  const movieEntries: SearchEntry[] = movies.map((movie) => ({
    slug: movie.slug,
    title: movie.title,
    type: "movie" as const,
    originalTitle: movie.originalTitle,
    year: movie.year,
    runtimeMinutes: movie.runtimeMinutes,
    synopsis: movie.synopsis,
    director: movie.director,
    cast: movie.cast,
    genres: movie.genres,
    poster: movie.poster,
    featuredRank: movie.featuredRank,
  }));

  const seriesEntries: SearchEntry[] = series.map((show) => ({
    slug: show.slug,
    title: show.title,
    type: "series" as const,
    originalTitle: show.originalTitle,
    year: show.year,
    runtimeMinutes: 0,
    synopsis: show.synopsis,
    director: show.director ?? [],
    cast: show.cast ?? [],
    genres: show.genres,
    poster: show.poster,
    featuredRank: show.featuredRank,
    totalEpisodes: show.totalEpisodes,
    seasonCount: show.seasonCount,
  }));

  return [...movieEntries, ...seriesEntries].sort((a, b) => {
    const rankA = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
    const rankB = b.featuredRank ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.title.localeCompare(b.title);
  });
}

/** Flatten every playable item (films + all episodes) for search/watchlisting. */
export function getWatchables(): Watchable[] {
  const episodes: Episode[] = [];
  for (const show of series) {
    for (const season of show.seasons) {
      for (const episode of season.episodes) {
        episodes.push(episode);
      }
    }
  }
  return [...movies, ...episodes].sort((a, b) => {
    const rankA = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
    const rankB = b.featuredRank ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.title.localeCompare(b.title);
  });
}
