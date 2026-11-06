import type { AssetRights, AssetType, Movie, TerritorySelection } from "@/types";

/** Assets that must be verified before the film may be played. */
export const PLAYBACK_REQUIRED_TYPES: readonly AssetType[] = ["video", "subtitle"] as const;

/** Assets that must be verified before artwork may be shown publicly. */
export const DISPLAY_REQUIRED_TYPES: readonly AssetType[] = ["poster", "backdrop"] as const;

export function isAssetVerifiedForTerritory(asset: AssetRights, territory: string): boolean {
  return asset.status === "verified" && asset.verifiedTerritories.includes(territory);
}

export function findAsset(movie: Movie, type: AssetType): AssetRights | undefined {
  return movie.rights.assetRights.find((asset) => asset.assetType === type);
}

/**
 * Playback permission — derived, never stored.
 *
 * A film is playable when its video asset is verified for the viewer's
 * territory, and (only if the film ships subtitles) at least one subtitle
 * track is verified too.
 */
export function canPlay(movie: Movie, territory: string): boolean {
  const video = findAsset(movie, "video");
  if (!video || !isAssetVerifiedForTerritory(video, territory)) return false;

  if (movie.subtitleSources.length > 0) {
    const subtitles = movie.rights.assetRights.filter((a) => a.assetType === "subtitle");
    if (!subtitles.some((a) => isAssetVerifiedForTerritory(a, territory))) return false;
  }

  return true;
}

/**
 * Display permission — poster and backdrop must both be verified for the
 * viewer's territory. When false the UI renders a branded placeholder.
 */
export function canDisplay(movie: Movie, territory: string): boolean {
  return DISPLAY_REQUIRED_TYPES.every((type) => {
    const asset = findAsset(movie, type);
    return Boolean(asset && isAssetVerifiedForTerritory(asset, territory));
  });
}

export function displayableMovies(movies: Movie[], territory: string): Movie[] {
  return movies.filter((movie) => canDisplay(movie, territory));
}

export function playableMovies(movies: Movie[], territory: string): Movie[] {
  return movies.filter((movie) => canPlay(movie, territory));
}

/** Short, human reason used by the UI when playback is unavailable. */
export function playbackBlockedReason(movie: Movie, territory: string): string {
  const video = findAsset(movie, "video");
  if (!video) return "No verified video source is available for this film.";
  if (!isAssetVerifiedForTerritory(video, territory)) {
    return video.verifiedTerritories.length === 0
      ? "Rights verification for the video source is still pending."
      : `This film is verified in ${video.verifiedTerritories.join(", ")} but not in your region (${territory}).`;
  }
  if (movie.subtitleSources.length > 0) {
    const subtitles = movie.rights.assetRights.filter((a) => a.assetType === "subtitle");
    if (!subtitles.some((a) => isAssetVerifiedForTerritory(a, territory))) {
      return "The subtitle track used by this film is not verified for your region.";
    }
  }
  return "This film is not available in your region.";
}

export function territoryLabel(selection: TerritorySelection | null): string {
  return selection?.code ?? "—";
}

/** Every distinct territory the catalogue is currently cleared for. */
export function catalogueTerritories(movies: Movie[]): string[] {
  const codes = new Set<string>();
  for (const movie of movies) {
    for (const asset of movie.rights.assetRights) {
      for (const code of asset.verifiedTerritories) codes.add(code);
    }
  }
  return [...codes].sort();
}
