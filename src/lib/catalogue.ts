import catalogueData from "../../data/movies.json";
import { FEATURED_ROWS, GENRES } from "@/lib/constants";
import type { Catalogue, Genre, Movie } from "@/types";

const catalogue = catalogueData as unknown as Catalogue;

/** Every film in the catalogue, ordered by editorial rank then title. */
export const movies: Movie[] = [...catalogue.movies].sort((a, b) => {
  const rankA = a.featuredRank ?? Number.MAX_SAFE_INTEGER;
  const rankB = b.featuredRank ?? Number.MAX_SAFE_INTEGER;
  if (rankA !== rankB) return rankA - rankB;
  return a.title.localeCompare(b.title);
});

export const catalogueGeneratedAt: string = catalogue.generatedAt;

const bySlug = new Map(movies.map((movie) => [movie.slug, movie]));

export function getMovie(slug: string): Movie | undefined {
  return bySlug.get(slug);
}

export function getMovies(slugs: string[]): Movie[] {
  return slugs.map((slug) => bySlug.get(slug)).filter((movie): movie is Movie => Boolean(movie));
}

export function getGenre(slug: string): Genre | undefined {
  return GENRES.find((genre) => genre.slug === slug);
}

export function getMoviesByGenre(genreSlug: string): Movie[] {
  return movies.filter((movie) => movie.genres.some((genre) => genre.slug === genreSlug));
}

/** Genres that actually have films, ordered by catalogue prevalence. */
export function getActiveGenres(): Genre[] {
  const counts = new Map<string, number>();
  for (const movie of movies) {
    for (const genre of movie.genres) {
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

/** Hero carousel selection: the top-ranked films. */
export function getSpotlight(limit = 3): Movie[] {
  return movies.slice(0, limit);
}

export function getFeaturedMovie(): Movie {
  return movies[0];
}

export interface CatalogueRow {
  id: string;
  title: string;
  blurb?: string;
  genreSlug: string;
  movies: Movie[];
}

export function getHomeRows(): CatalogueRow[] {
  return FEATURED_ROWS.map((row) => ({
    id: row.id,
    title: row.title,
    blurb: row.blurb,
    genreSlug: row.genreSlug,
    movies: getMoviesByGenre(row.genreSlug),
  })).filter((row) => row.movies.length > 0);
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
  originalTitle?: string;
  year: number;
  runtimeMinutes: number;
  synopsis: string;
  director: string[];
  cast: { name: string; role: string }[];
  genres: Genre[];
  poster: Movie["poster"];
  featuredRank?: number;
}

export function getSearchIndex(): SearchEntry[] {
  return movies.map((movie) => ({
    slug: movie.slug,
    title: movie.title,
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
}
