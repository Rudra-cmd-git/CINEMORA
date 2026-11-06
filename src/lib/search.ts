import { normalise } from "@/lib/utils";

/**
 * Deliberately dependency-free scoring search. The catalogue is small, so a
 * linear scan with weighted matches comfortably beats adding a fuzzy-search
 * library to the bundle.
 */

/** Minimum shape required to search a film. `Movie` satisfies it. */
export interface SearchableMovie {
  slug: string;
  title: string;
  originalTitle?: string;
  year: number;
  synopsis: string;
  director: string[];
  cast: { name: string }[];
  genres: { name: string }[];
  featuredRank?: number;
}

export interface ScoredResult<T> {
  movie: T;
  score: number;
  match: "title" | "person" | "genre" | "year" | "synopsis";
}

interface Weights {
  exact: number;
  starts: number;
  word: number;
  contains: number;
}

function scoreField(field: string, query: string, weights: Weights): number {
  const normalised = normalise(field);
  if (!normalised) return 0;

  if (normalised === query) return weights.exact;
  if (normalised.startsWith(query)) return weights.starts;
  if (normalised.split(" ").some((token) => token.startsWith(query))) return weights.word;
  if (normalised.includes(query)) return weights.contains;
  return 0;
}

export function scoreMovie<T extends SearchableMovie>(
  movie: T,
  rawQuery: string,
): ScoredResult<T> | null {
  const query = normalise(rawQuery);
  if (!query) return null;

  let best = 0;
  let match: ScoredResult<T>["match"] = "title";

  const titleWeights = { exact: 120, starts: 90, word: 70, contains: 45 };
  const titleScore = Math.max(
    scoreField(movie.title, query, titleWeights),
    movie.originalTitle ? scoreField(movie.originalTitle, query, titleWeights) : 0,
  );
  if (titleScore > best) {
    best = titleScore;
    match = "title";
  }

  for (const person of [...movie.director, ...movie.cast.map((member) => member.name)]) {
    const score = scoreField(person, query, { exact: 60, starts: 45, word: 35, contains: 25 });
    if (score > best) {
      best = score;
      match = "person";
    }
  }

  for (const genre of movie.genres) {
    const score = scoreField(genre.name, query, { exact: 30, starts: 24, word: 18, contains: 12 });
    if (score > best) {
      best = score;
      match = "genre";
    }
  }

  if (String(movie.year).startsWith(query)) {
    const score = query.length === 4 ? 55 : 20;
    if (score > best) {
      best = score;
      match = "year";
    }
  }

  if (best === 0) {
    const synopsisScore = scoreField(movie.synopsis, query, {
      exact: 0,
      starts: 0,
      word: 0,
      contains: 8,
    });
    if (synopsisScore > 0) {
      best = synopsisScore;
      match = "synopsis";
    }
  }

  if (best === 0) return null;

  const rankBonus = Math.max(0, 12 - (movie.featuredRank ?? 12));
  return { movie, score: best + rankBonus, match };
}

export function searchMovies<T extends SearchableMovie>(
  list: T[],
  rawQuery: string,
  limit = 24,
): ScoredResult<T>[] {
  if (!normalise(rawQuery)) return [];

  return list
    .map((movie) => scoreMovie(movie, rawQuery))
    .filter((result): result is ScoredResult<T> => result !== null)
    .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title))
    .slice(0, limit);
}
