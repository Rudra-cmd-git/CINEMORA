import type { MetadataRoute } from "next";
import { getActiveGenres, movies } from "@/lib/catalogue";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/explore", priority: 0.9 },
    { path: "/search", priority: 0.5 },
    { path: "/my-list", priority: 0.4 },
    { path: "/continue", priority: 0.4 },
    { path: "/about", priority: 0.6 },
  ].map((route) => ({
    url: `${SITE.url}${route.path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));

  const movieRoutes = movies.map((movie) => ({
    url: `${SITE.url}/movie/${movie.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const genreRoutes = getActiveGenres().map((genre) => ({
    url: `${SITE.url}/genres/${genre.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...genreRoutes, ...movieRoutes];
}
