/**
 * CINEMORA — player contracts.
 *
 * The player is a client island. The watch page (a server component) projects
 * the catalogue `Movie` down to `PlayerMovie` so only what the player actually
 * renders — sources, subtitles, artwork, meta — crosses the boundary.
 */

import type { ImageAsset, SubtitleSource, VideoSource } from "@/types";

export interface PlayerGenre {
  name: string;
  slug: string;
}

export interface PlayerMovie {
  slug: string;
  title: string;
  year: number;
  runtimeMinutes: number;
  genres: PlayerGenre[];
  backdrop: ImageAsset;
  videoSources: VideoSource[];
  subtitleSources: SubtitleSource[];
  /** Canonical archive.org item page — attribution + error fallback. */
  sourcePage: string;
  aspectRatio: string;
}

/** Which control-bar menu (if any) is open. Used to pin the controls open. */
export type PlayerMenu = "rate" | "captions" | null;

/**
 * Everything the control bar needs. Built once per render in `player.tsx`;
 * every action is a stable callback so children can depend on them safely.
 */
export interface PlayerController {
  /* ---- playback ---- */
  playing: boolean;
  buffering: boolean;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  /** True once the video has started at least once this session. */
  hasStarted: boolean;
  rate: number;

  /* ---- audio ---- */
  volume: number;
  muted: boolean;

  /* ---- captions ---- */
  /** Index into `PlayerMovie.subtitleSources`; `null` means off. */
  selectedCaption: number | null;

  /* ---- chrome ---- */
  menu: PlayerMenu;
  setMenu: (menu: PlayerMenu) => void;
  fullscreen: boolean;
  pip: boolean;
  pipSupported: boolean;
  controlsVisible: boolean;

  /* ---- actions ---- */
  togglePlay: () => void;
  seekBy: (deltaSeconds: number) => void;
  seekTo: (time: number) => void;
  seekToFraction: (fraction: number) => void;
  setVolume: (value: number) => void;
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;
  setRate: (rate: number) => void;
  setCaption: (index: number | null) => void;
  cycleCaptions: () => void;
  toggleFullscreen: () => void;
  togglePip: () => void;
  toggleShortcuts: () => void;
  /** Reveal the chrome and restart the auto-hide timer. */
  showControls: () => void;
}
