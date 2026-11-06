import type { Genre } from "@/types";

export const SITE = {
  name: "CINEMORA",
  wordmark: "CINEMORA",
  tagline: "Cinema, curated",
  description:
    "A premium, advert-free streaming home for cinema in the public domain. Hand-picked classics, remastered artwork, and a player built for watching.",
  url: "https://cinemora-gamma.vercel.app",
  contactEmail: "hello@cinemora-gamma.vercel.app",
} as const;

export const STORAGE_KEYS = {
  watchlist: "cinemora:watchlist:v1",
  progress: "cinemora:progress:v1",
  territory: "cinemora:territory:v1",
  recentSearches: "cinemora:recent-searches:v1",
} as const;

/** Canonical genre taxonomy. Mirrors the `genres` map in `data/sources.json`. */
export const GENRES: Genre[] = [
  {
    id: "horror",
    name: "Horror",
    slug: "horror",
    description:
      "Expressionist shadows, unnameable dread, and the films that taught cinema how to be afraid of the dark.",
  },
  {
    id: "silent",
    name: "Silent Era",
    slug: "silent",
    description:
      "Pictures that needed no words. The formative decade and a half when cinema invented its own grammar.",
  },
  {
    id: "sci-fi",
    name: "Science Fiction",
    slug: "sci-fi",
    description:
      "Tomorrow, imagined yesterday. Futures built from art deco, machinery, and impossible optimism.",
  },
  {
    id: "drama",
    name: "Drama",
    slug: "drama",
    description: "Stories that hold a mirror up to the ordinary and refuse to look away.",
  },
  {
    id: "comedy",
    name: "Comedy",
    slug: "comedy",
    description: "Precision-timed slapstick and the birth of the modern comic sensibility.",
  },
  {
    id: "noir",
    name: "Film Noir",
    slug: "noir",
    description: "Rain-slicked streets, bad luck, and the most beautiful shadows in American cinema.",
  },
  {
    id: "mystery",
    name: "Mystery",
    slug: "mystery",
    description: "Puzzles dressed as pictures, engineered to keep you leaning forward.",
  },
  {
    id: "romance",
    name: "Romance",
    slug: "romance",
    description: "Love stories told with light, weather and long, patient looks.",
  },
  {
    id: "crime",
    name: "Crime",
    slug: "crime",
    description: "Heists, mistakes, and the slow arithmetic of consequence.",
  },
  {
    id: "war",
    name: "War",
    slug: "war",
    description: "Cinema at its most urgent — conflict rendered as image, rhythm and chant.",
  },
  {
    id: "action",
    name: "Action",
    slug: "action",
    description: "Chases, stunts and locomotive-scale spectacle performed for real.",
  },
  {
    id: "fantasy",
    name: "Fantasy",
    slug: "fantasy",
    description: "Folk tales, monsters and worlds drawn from the pre-cinema imagination.",
  },
];

export const GENRE_BY_SLUG = new Map(GENRES.map((genre) => [genre.slug, genre]));

/** Editorial rows used on the homepage. Order matters. */
export const FEATURED_ROWS = [
  {
    id: "essential-horror",
    title: "Essential Horror",
    blurb: "The films that invented the genre — and still unsettle.",
    genreSlug: "horror",
  },
  {
    id: "silent-masterpieces",
    title: "Silent Masterpieces",
    blurb: "A century on, these images still speak louder than dialogue.",
    genreSlug: "silent",
  },
  {
    id: "tomorrow-yesterday",
    title: "Tomorrow, Yesterday",
    blurb: "Science fiction from an age when the future felt within reach.",
    genreSlug: "sci-fi",
  },
  {
    id: "noir-after-dark",
    title: "Noir After Dark",
    blurb: "Rain, neon and bad decisions, shot in gorgeous black and white.",
    genreSlug: "noir",
  },
  {
    id: "comedy-classics",
    title: "Comedy Classics",
    blurb: "Stunt work, timing, and jokes that survived a hundred years.",
    genreSlug: "comedy",
  },
] as const;

/** Sorts offered on Explore. */
export const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "az", label: "A – Z" },
  { id: "runtime", label: "Shortest first" },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export const DECADES = ["1920s", "1930s", "1940s", "1950s", "1960s"] as const;

export const TERRITORIES = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
  { code: "ZZ", name: "Other / not sure" },
] as const;

export const DEFAULT_TERRITORY = "US";
