"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Play,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";
import { Spinner } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/use-media-query";
import { usePlayerShortcuts, type PlayerShortcutHandlers } from "@/hooks/use-player-shortcuts";
import { useProgress } from "@/hooks/use-progress";
import { shouldResume } from "@/lib/progress";
import { clamp, cn, formatRuntime, formatTimecode } from "@/lib/utils";
import { PlayerControls } from "./player-controls";
import { PlayerShortcutsDialog } from "./player-shortcuts-dialog";
import { nearestRate, PLAYBACK_RATES, resolveSubtitleUrl } from "./player-utils";
import type { PlayerController, PlayerMenu, PlayerMovie } from "./types";

const CONTROLS_HIDE_DELAY_MS = 3000;
const SAVE_THROTTLE_MS = 2000;
const BUFFERING_DELAY_MS = 250;
const SEEK_STEP_SECONDS = 10;

export interface PlayerProps {
  movie: PlayerMovie;
  /** Deep-link position from `?t=` — wins over stored progress. */
  initialTime?: number;
}

/**
 * CINEMORA's player: a native `<video>` with a single, fully custom and
 * accessible control system.
 *
 * Design notes:
 * - The `<video>` never exposes native controls. Every affordance is a real
 *   `<button>`; the seek bar is a `role="slider"`.
 * - Progress is written through the frozen `useProgress` API: throttled on
 *   `timeupdate` (2s) and flushed on pause/ended/visibilitychange/pagehide.
 * - Auto-hide is a single 3s timer that is disabled while paused, while a
 *   menu/dialog is open, while the resume card is up, and under
 *   `prefers-reduced-motion`.
 */
export function Player({ movie, initialTime }: PlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { save, remove, get } = useProgress();
  const { toast } = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  // On phones the stage is only ~220px tall, so the resume prompt is anchored
  // near the bottom edge instead of clearing the desktop control bar.
  const compactStage = useMediaQuery("(max-width: 639px)");

  /* ---------------------------------------------------------------------- */
  /*  Saved progress (read once, on the client — the player is ssr:false)    */
  /* ---------------------------------------------------------------------- */

  const [initialSaved] = React.useState(() => get(movie.slug));

  const [resumeAt, setResumeAt] = React.useState<number | null>(() => {
    if (initialTime !== undefined) return null; // an explicit timestamp always wins
    return initialSaved && shouldResume(initialSaved) ? initialSaved.currentTime : null;
  });

  /* ---------------------------------------------------------------------- */
  /*  Playback state                                                         */
  /* ---------------------------------------------------------------------- */

  const [playing, setPlaying] = React.useState(false);
  // Start in the buffering state: the archive.org first byte can take a few
  // seconds, and a frozen poster with no feedback reads as a broken player.
  const [buffering, setBuffering] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [bufferedEnd, setBufferedEnd] = React.useState(0);
  const [hasStarted, setHasStarted] = React.useState(false);
  const currentTimeRef = React.useRef(0);

  const [rate, setRateState] = React.useState(() => {
    const stored = initialSaved?.playbackRate;
    return stored && stored >= 0.5 && stored <= 2 ? nearestRate(stored) : 1;
  });
  const rateRef = React.useRef(rate);

  const [volume, setVolumeState] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const volumeRef = React.useRef(1);
  const mutedRef = React.useRef(false);
  const lastAudibleVolumeRef = React.useRef(1);

  const [selectedCaption, setSelectedCaption] = React.useState<number | null>(null);
  const captionRef = React.useRef<number | null>(null);

  /* ---------------------------------------------------------------------- */
  /*  Chrome state                                                           */
  /* ---------------------------------------------------------------------- */

  const [menu, setMenu] = React.useState<PlayerMenu>(null);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [pip, setPip] = React.useState(false);
  const [pipSupported, setPipSupported] = React.useState(false);
  const [controlsVisible, setControlsVisible] = React.useState(true);
  const pinnedRef = React.useRef(true);

  const [announcement, setAnnouncement] = React.useState("");

  /* ---------------------------------------------------------------------- */
  /*  Sources / errors                                                       */
  /* ---------------------------------------------------------------------- */

  const [sourceIndex, setSourceIndex] = React.useState(0);
  const sourceIndexRef = React.useRef(0);
  const [attempt, setAttempt] = React.useState(0);
  const [fatalError, setFatalError] = React.useState(false);

  /* ---------------------------------------------------------------------- */
  /*  Timer refs                                                             */
  /* ---------------------------------------------------------------------- */

  const hideTimerRef = React.useRef<number | null>(null);
  const bufferingTimerRef = React.useRef<number | null>(null);
  const announceTimerRef = React.useRef<number | null>(null);
  const lastSavedAtRef = React.useRef(0);
  const pendingSeekRef = React.useRef<number | null>(null);
  const initialSeekAppliedRef = React.useRef(false);

  /* ---------------------------------------------------------------------- */
  /*  Announcements (single polite live region)                              */
  /* ---------------------------------------------------------------------- */

  const announce = React.useCallback((message: string) => {
    if (announceTimerRef.current !== null) window.clearTimeout(announceTimerRef.current);
    setAnnouncement("");
    announceTimerRef.current = window.setTimeout(() => {
      announceTimerRef.current = null;
      setAnnouncement(message);
    }, 80);
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Persistence                                                            */
  /* ---------------------------------------------------------------------- */

  const saveNow = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const total = video.duration;
    const position = video.currentTime;
    // Never overwrite a saved position with an unstarted/zero-time view.
    if (!Number.isFinite(total) || total <= 0) return;
    if (!Number.isFinite(position) || position <= 0.5) return;
    save({
      movieSlug: movie.slug,
      currentTime: position,
      duration: total,
      playbackRate: rateRef.current,
    });
  }, [movie.slug, save]);

  const saveThrottled = React.useCallback(() => {
    const now = Date.now();
    if (now - lastSavedAtRef.current < SAVE_THROTTLE_MS) return;
    lastSavedAtRef.current = now;
    saveNow();
  }, [saveNow]);

  React.useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveNow();
    };
    const onPageHide = () => saveNow();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [saveNow]);

  /* ---------------------------------------------------------------------- */
  /*  Media element sync                                                     */
  /* ---------------------------------------------------------------------- */

  const syncBuffered = React.useCallback((video: HTMLVideoElement) => {
    const ranges = video.buffered;
    if (!ranges || ranges.length === 0) {
      setBufferedEnd(0);
      return;
    }
    let end = 0;
    for (let index = 0; index < ranges.length; index += 1) {
      if (ranges.start(index) <= video.currentTime + 0.5) end = ranges.end(index);
    }
    if (end <= 0) end = ranges.end(ranges.length - 1);
    setBufferedEnd(end);
  }, []);

  const clearBufferingTimer = React.useCallback(() => {
    if (bufferingTimerRef.current !== null) {
      window.clearTimeout(bufferingTimerRef.current);
      bufferingTimerRef.current = null;
    }
  }, []);

  const showBufferingSoon = React.useCallback(() => {
    clearBufferingTimer();
    bufferingTimerRef.current = window.setTimeout(() => {
      bufferingTimerRef.current = null;
      setBuffering(true);
    }, BUFFERING_DELAY_MS);
  }, [clearBufferingTimer]);

  const hideBuffering = React.useCallback(() => {
    clearBufferingTimer();
    setBuffering(false);
  }, [clearBufferingTimer]);

  /* ---------------------------------------------------------------------- */
  /*  Seeking                                                                */
  /* ---------------------------------------------------------------------- */

  const seekTo = React.useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    const max = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : Number.POSITIVE_INFINITY;
    const target = clamp(time, 0, max);
    if (video.readyState < 1) {
      pendingSeekRef.current = target;
      return;
    }
    try {
      video.currentTime = target;
      setCurrentTime(target);
      currentTimeRef.current = target;
    } catch {
      pendingSeekRef.current = target;
    }
  }, []);

  const seekBy = React.useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      const base = Number.isFinite(video.currentTime) ? video.currentTime : currentTimeRef.current;
      const max = Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : base + Math.abs(deltaSeconds);
      const target = clamp(base + deltaSeconds, 0, max);
      seekTo(target);
      announce(formatTimecode(target));
    },
    [announce, seekTo],
  );

  const seekToFraction = React.useCallback(
    (fraction: number) => {
      const video = videoRef.current;
      if (!video) return;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      const target = clamp(fraction, 0, 1) * video.duration;
      seekTo(target);
      announce(formatTimecode(target));
    },
    [announce, seekTo],
  );

  const applyPendingSeek = React.useCallback((video: HTMLVideoElement) => {
    const limit = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : Number.POSITIVE_INFINITY;

    if (pendingSeekRef.current !== null) {
      const target = clamp(pendingSeekRef.current, 0, limit);
      pendingSeekRef.current = null;
      try {
        video.currentTime = target;
        setCurrentTime(target);
      } catch {
        // Ignore — metadata may still be settling.
      }
      return;
    }

    if (
      !initialSeekAppliedRef.current &&
      initialTime !== undefined &&
      initialTime > 0
    ) {
      initialSeekAppliedRef.current = true;
      try {
        video.currentTime = clamp(initialTime, 0, limit);
      } catch {
        // Ignore.
      }
    }
  }, [initialTime]);

  /* ---------------------------------------------------------------------- */
  /*  Volume / rate / captions                                               */
  /* ---------------------------------------------------------------------- */

  const applyVolume = React.useCallback((next: number) => {
    const clamped = clamp(next, 0, 1);
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (clamped > 0) {
      mutedRef.current = false;
      setMuted(false);
      lastAudibleVolumeRef.current = clamped;
    }
  }, []);

  const setVolume = React.useCallback(
    (value: number) => {
      applyVolume(value);
    },
    [applyVolume],
  );

  const nudgeVolume = React.useCallback(
    (delta: number) => {
      const next = clamp(volumeRef.current + delta, 0, 1);
      applyVolume(next);
      announce(`Volume ${Math.round(next * 100)} percent`);
    },
    [announce, applyVolume],
  );

  const toggleMute = React.useCallback(() => {
    const nextMuted = !(mutedRef.current || volumeRef.current === 0);
    mutedRef.current = nextMuted;
    setMuted(nextMuted);

    if (!nextMuted && volumeRef.current === 0) {
      const restored = lastAudibleVolumeRef.current || 1;
      volumeRef.current = restored;
      setVolumeState(restored);
    }

    announce(
      nextMuted
        ? "Muted"
        : `Volume ${Math.round((volumeRef.current || 0) * 100)} percent`,
    );
  }, [announce]);

  const setRate = React.useCallback(
    (nextRate: number) => {
      const clamped = nearestRate(nextRate);
      rateRef.current = clamped;
      setRateState(clamped);
      announce(clamped === 1 ? "Normal speed" : `${clamped} times speed`);
    },
    [announce],
  );

  const changeRate = React.useCallback(
    (direction: 1 | -1) => {
      const rates = PLAYBACK_RATES as readonly number[];
      const index = rates.indexOf(nearestRate(rateRef.current));
      const nextIndex = clamp(index + direction, 0, rates.length - 1);
      setRate(rates[nextIndex]);
    },
    [setRate],
  );

  const setCaption = React.useCallback(
    (index: number | null) => {
      captionRef.current = index;
      setSelectedCaption(index);
      if (index === null) {
        announce("Subtitles off");
      } else {
        announce(`Subtitles: ${movie.subtitleSources[index]?.label ?? "on"}`);
      }
    },
    [announce, movie.subtitleSources],
  );

  const cycleCaptions = React.useCallback(() => {
    const count = movie.subtitleSources.length;
    if (count === 0) {
      announce("No subtitles available for this film");
      return;
    }
    const current = captionRef.current;
    const next = current === null ? 0 : current + 1 >= count ? null : current + 1;
    setCaption(next);
  }, [announce, movie.subtitleSources.length, setCaption]);

  const applyCaptionMode = React.useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    for (let index = 0; index < tracks.length; index += 1) {
      const track = tracks[index];
      const shouldShow = captionRef.current === index;
      try {
        track.mode = shouldShow ? "showing" : "disabled";
      } catch {
        // Some browsers can throw while tracks are still loading.
      }
    }
  }, []);

  React.useEffect(() => {
    applyCaptionMode();
    const video = videoRef.current;
    if (!video) return;
    const onAddTrack = () => applyCaptionMode();
    video.textTracks.addEventListener("addtrack", onAddTrack);
    return () => video.textTracks.removeEventListener("addtrack", onAddTrack);
  }, [applyCaptionMode, selectedCaption]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.volume = volume;
      video.muted = muted;
    } catch {
      // Ignore.
    }
  }, [volume, muted]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.playbackRate = rate;
      video.defaultPlaybackRate = rate;
    } catch {
      // Ignore.
    }
  }, [rate]);

  /* ---------------------------------------------------------------------- */
  /*  Fullscreen / PiP                                                       */
  /* ---------------------------------------------------------------------- */

  const toggleFullscreen = React.useCallback(async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (container && typeof container.requestFullscreen === "function") {
        await container.requestFullscreen();
        return;
      }
      const legacy = video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
      if (legacy && typeof legacy.webkitEnterFullscreen === "function") {
        legacy.webkitEnterFullscreen();
        return;
      }
      announce("Fullscreen is not available in this browser.");
    } catch {
      announce("Fullscreen is not available in this browser.");
    }
  }, [announce]);

  React.useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const togglePip = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }
      if (
        document.pictureInPictureEnabled &&
        typeof video.requestPictureInPicture === "function"
      ) {
        await video.requestPictureInPicture();
        return;
      }
      announce("Picture-in-picture is not supported in this browser.");
    } catch {
      announce("Picture-in-picture is not available right now.");
    }
  }, [announce]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setPipSupported(
      Boolean(
        document.pictureInPictureEnabled &&
          typeof video.requestPictureInPicture === "function",
      ),
    );
    const onEnter = () => setPip(true);
    const onLeave = () => setPip(false);
    video.addEventListener("enterpictureinpicture", onEnter);
    video.addEventListener("leavepictureinpicture", onLeave);
    return () => {
      video.removeEventListener("enterpictureinpicture", onEnter);
      video.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Auto-hide chrome                                                       */
  /* ---------------------------------------------------------------------- */

  const pinned =
    !playing || menu !== null || shortcutsOpen || resumeAt !== null || fatalError;

  const clearHideTimer = React.useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = React.useCallback(() => {
    clearHideTimer();
    if (pinnedRef.current) return;
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      if (!pinnedRef.current) setControlsVisible(false);
    }, CONTROLS_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const showControls = React.useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  React.useEffect(() => {
    const shouldPin = pinned || prefersReducedMotion;
    pinnedRef.current = shouldPin;
    if (shouldPin) {
      setControlsVisible(true);
      clearHideTimer();
      return;
    }
    scheduleHide();
  }, [pinned, prefersReducedMotion, clearHideTimer, scheduleHide]);

  React.useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
      if (bufferingTimerRef.current !== null) window.clearTimeout(bufferingTimerRef.current);
      if (announceTimerRef.current !== null) window.clearTimeout(announceTimerRef.current);
    };
  }, []);

  const handlePointerLeave = React.useCallback(() => {
    if (pinnedRef.current) return;
    clearHideTimer();
    setControlsVisible(false);
  }, [clearHideTimer]);

  /* ---------------------------------------------------------------------- */
  /*  Playback actions                                                       */
  /* ---------------------------------------------------------------------- */

  const togglePlay = React.useCallback(() => {
    const video = videoRef.current;
    if (!video || fatalError) return;
    setResumeAt(null);

    if (video.paused || video.ended) {
      if (video.ended) {
        try {
          video.currentTime = 0;
        } catch {
          // Ignore.
        }
        setCurrentTime(0);
      }
      const promise = video.play();
      if (promise) {
        void promise.catch(() => announce("Playback could not start. Try again."));
      }
    } else {
      video.pause();
    }
  }, [announce, fatalError]);

  const handleStageClick = React.useCallback(() => {
    showControls();
    togglePlay();
  }, [showControls, togglePlay]);

  const handleResume = React.useCallback(() => {
    const position = resumeAt;
    if (position === null) return;
    setResumeAt(null);
    seekTo(position);
    announce(`Resuming from ${formatTimecode(position)}`);
    const video = videoRef.current;
    if (video) {
      const promise = video.play();
      if (promise) void promise.catch(() => undefined);
    }
  }, [announce, resumeAt, seekTo]);

  const handleRestart = React.useCallback(() => {
    remove(movie.slug);
    setResumeAt(null);
    seekTo(0);
    announce("Starting from the beginning");
    toast({
      title: "Starting from the beginning",
      description: `Progress cleared for ${movie.title}.`,
    });
    const video = videoRef.current;
    if (video) {
      const promise = video.play();
      if (promise) void promise.catch(() => undefined);
    }
  }, [announce, movie.slug, movie.title, remove, seekTo, toast]);

  const handleVideoError = React.useCallback(() => {
    hideBuffering();
    setPlaying(false);
    const next = sourceIndexRef.current + 1;
    if (next < movie.videoSources.length) {
      sourceIndexRef.current = next;
      setSourceIndex(next);
      toast({
        title: "Switching source",
        description: "The primary stream did not respond — trying an alternate.",
      });
      announce("Primary source failed. Trying an alternate source.");
      return;
    }
    setFatalError(true);
    announce("Playback failed. Retry, or open the film on archive.org.");
  }, [announce, hideBuffering, movie.videoSources.length, toast]);

  const handleRetry = React.useCallback(() => {
    setFatalError(false);
    sourceIndexRef.current = 0;
    setSourceIndex(0);
    setAttempt((value) => value + 1);
    announce("Retrying playback.");
  }, [announce]);

  // Reload the media element when we fall back to another source, or when the
  // viewer retries after a fatal error, preserving their position and intent.
  React.useEffect(() => {
    if (attempt === 0 && sourceIndex === 0) return;
    const video = videoRef.current;
    if (!video) return;

    hideBuffering();
    setBufferedEnd(0);
    const position = currentTimeRef.current;
    const shouldAutoPlay = hasStarted;

    const onLoaded = () => {
      if (position > 0 && Number.isFinite(video.duration)) {
        try {
          video.currentTime = Math.min(position, video.duration);
        } catch {
          // Ignore.
        }
      }
      if (shouldAutoPlay) {
        const promise = video.play();
        if (promise) void promise.catch(() => undefined);
      }
    };

    video.load();
    video.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => video.removeEventListener("loadedmetadata", onLoaded);
    // hasStarted is intentionally read at fallback time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, sourceIndex, hideBuffering]);

  const toggleShortcuts = React.useCallback(() => {
    setShortcutsOpen((previous) => {
      const next = !previous;
      if (next) videoRef.current?.pause();
      return next;
    });
  }, []);

  const closeOverlays = React.useCallback(() => {
    setMenu(null);
    setShortcutsOpen(false);
    setResumeAt(null);
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Keyboard shortcuts                                                     */
  /* ---------------------------------------------------------------------- */

  const shortcutHandlers: PlayerShortcutHandlers = {
    togglePlay,
    seekBy,
    seekToFraction,
    volumeUp: () => nudgeVolume(0.05),
    volumeDown: () => nudgeVolume(-0.05),
    toggleMute,
    toggleFullscreen: () => {
      void toggleFullscreen();
    },
    cycleCaptions,
    togglePip: () => {
      void togglePip();
    },
    openShortcuts: toggleShortcuts,
    closeOverlays,
    changeRate,
  };

  usePlayerShortcuts(shortcutHandlers, !shortcutsOpen && menu === null);

  /* ---------------------------------------------------------------------- */
  /*  Video element handlers                                                 */
  /* ---------------------------------------------------------------------- */

  const handleLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    setCurrentTime(video.currentTime);
    currentTimeRef.current = video.currentTime;
    syncBuffered(video);
    applyPendingSeek(video);
    applyCaptionMode();
    try {
      video.playbackRate = rateRef.current;
      video.volume = volumeRef.current;
      video.muted = mutedRef.current;
    } catch {
      // Ignore.
    }
    hideBuffering();
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const position = event.currentTarget.currentTime;
    currentTimeRef.current = position;
    setCurrentTime(position);
    saveThrottled();
  };

  const handleProgress = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    syncBuffered(event.currentTarget);
  };

  const handleEnded = () => {
    setPlaying(false);
    saveNow();
    announce("Finished");
  };

  const handlePlay = () => {
    setPlaying(true);
    setHasStarted(true);
    announce("Playing");
    if (fatalError) setFatalError(false);
  };

  const handlePause = () => {
    setPlaying(false);
    saveNow();
  };

  const handlePlaying = () => {
    hideBuffering();
    if (fatalError) setFatalError(false);
  };

  /* ---------------------------------------------------------------------- */
  /*  Controller passed to the control bar                                   */
  /* ---------------------------------------------------------------------- */

  const controller: PlayerController = {
    playing,
    buffering,
    currentTime,
    duration,
    bufferedEnd,
    hasStarted,
    rate,
    volume,
    muted,
    selectedCaption,
    menu,
    setMenu,
    fullscreen,
    pip,
    pipSupported,
    controlsVisible,
    togglePlay,
    seekBy,
    seekTo,
    seekToFraction,
    setVolume,
    nudgeVolume,
    toggleMute,
    setRate,
    setCaption,
    cycleCaptions,
    toggleFullscreen,
    togglePip,
    toggleShortcuts,
    showControls,
  };

  const sources = movie.videoSources.slice(sourceIndex);
  const chromeVisible = controlsVisible || resumeAt !== null;
  const interactiveChrome = chromeVisible ? "pointer-events-auto" : "pointer-events-none";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div className="flex flex-none items-start justify-center lg:flex-1 lg:items-center lg:px-4 lg:py-4">
        <div
          ref={containerRef}
          className={cn(
            "relative w-full overflow-hidden bg-black",
            fullscreen
              ? "h-screen max-w-none rounded-none"
              : "max-w-[min(1560px,calc((100dvh_-_10rem)*16/9))] rounded-none border-y border-line/60 shadow-[var(--cm-shadow-xl)] sm:rounded-lg sm:border",
            !chromeVisible && playing && "cursor-none",
          )}
          onPointerMove={showControls}
          onPointerLeave={handlePointerLeave}
          onFocusCapture={showControls}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              showControls();
            }
          }}
        >
          <div className={cn("relative w-full", fullscreen ? "h-full" : "aspect-video")}>
            {/* The one and only video element: no native controls, ever. */}
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full bg-black object-contain"
              poster={movie.backdrop.src}
              playsInline
              preload="metadata"
              onClick={handleStageClick}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onProgress={handleProgress}
              onPlay={handlePlay}
              onPause={handlePause}
              onPlaying={handlePlaying}
              onCanPlay={hideBuffering}
              onWaiting={showBufferingSoon}
              onSeeking={showBufferingSoon}
              onSeeked={(event) => {
                hideBuffering();
                syncBuffered(event.currentTarget);
              }}
              onEnded={handleEnded}
              onError={handleVideoError}
            >
              {sources.map((source, index) => (
                <source
                  key={`${source.url}-${sourceIndex + index}`}
                  src={source.url}
                  type={source.mimeType}
                />
              ))}
              {movie.subtitleSources.map((source, index) => (
                <track
                  key={`${source.url}-${index}`}
                  kind={source.kind}
                  label={source.label}
                  srcLang={source.language}
                  src={resolveSubtitleUrl(source.url)}
                />
              ))}
              Your browser does not support the video element.
            </video>

            {/* Initial-state play affordance (poster) */}
            {!hasStarted && !playing && !fatalError ? (
              <button
                type="button"
                aria-label={`Play ${movie.title}`}
                onClick={handleStageClick}
                className="absolute left-1/2 top-1/2 z-10 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-ink shadow-[var(--cm-shadow-lg)] backdrop-blur-md transition hover:scale-105 hover:bg-black/65 focus-visible:ring-2 focus-visible:ring-gold sm:size-24"
              >
                <Play className="size-8 translate-x-0.5 fill-current sm:size-9" aria-hidden />
              </button>
            ) : null}

            {/* Buffering */}
            {buffering && !fatalError ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <Spinner className="size-10 border-[3px] border-white/20 border-t-gold" />
              </div>
            ) : null}

            {/* Fading chrome: top bar + control bar */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-500 ease-out",
                chromeVisible ? "opacity-100" : "opacity-0",
              )}
            >
              <div
                className={cn(
                  "flex items-start gap-4 bg-gradient-to-b from-black/80 via-black/35 to-transparent px-3 pb-16 pt-3 sm:px-5 sm:pt-4",
                  interactiveChrome,
                )}
              >
                <Link
                  href={`/movie/${movie.slug}`}
                  aria-label={`Back to ${movie.title}`}
                  className={buttonClasses("ghost", "icon", "size-9 shrink-0 text-ink/90 hover:bg-white/10 hover:text-ink")}
                >
                  <ArrowLeft className="size-5" aria-hidden />
                </Link>
                <div className="min-w-0 pt-0.5">
                  <p className="truncate font-display text-sm font-medium tracking-[0.04em] text-ink sm:text-base">
                    {movie.title}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:text-[11px]">
                    {movie.year} <span aria-hidden>·</span> {formatRuntime(movie.runtimeMinutes)}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pb-2 pt-16 sm:px-4 sm:pb-3",
                  interactiveChrome,
                )}
              >
                <PlayerControls movie={movie} controller={controller} />
              </div>
            </div>

            {/* Resume card */}
            {resumeAt !== null ? (
              <div
                className="absolute inset-x-0 z-30 flex justify-start px-3 sm:px-6"
                style={{ bottom: compactStage ? 12 : 112 }}
              >
                <div className="pointer-events-auto flex flex-col gap-2 rounded-lg border border-line bg-elevated/90 p-3 shadow-[var(--cm-shadow-lg)] backdrop-blur-md sm:gap-3 sm:p-4">
                  <p className="text-[13px] text-ink-soft sm:text-sm">
                    Resume from{" "}
                    <span className="font-mono tabular-nums text-gold">
                      {formatTimecode(resumeAt)}
                    </span>
                    ?
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="primary" onClick={handleResume}>
                      Resume
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleRestart}>
                      Start over
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Fatal error */}
            {fatalError ? (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/88 px-6 backdrop-blur-sm">
                <div className="w-full max-w-md text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-soft text-gold">
                    <TriangleAlert className="size-5" aria-hidden />
                  </span>
                  <h2 className="mt-4 font-display text-lg tracking-wide text-ink">
                    We couldn&apos;t start this film
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    The stream may be temporarily unavailable. Try again, or watch it directly at
                    the source.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" onClick={handleRetry}>
                      <RefreshCw className="size-4" aria-hidden />
                      Try again
                    </Button>
                    <a
                      href={movie.sourcePage}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses("outline", "sm")}
                    >
                      <ExternalLink className="size-4" aria-hidden />
                      Open on archive.org
                    </a>
                    <Link href={`/movie/${movie.slug}`} className={buttonClasses("ghost", "sm")}>
                      Film details
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Film meta strip */}
      <div className="border-t border-line/60 bg-canvas">
        <div className="cm-shell flex flex-col gap-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:py-6">
          <div className="min-w-0">
            <h1 className="font-display text-xl tracking-[0.01em] text-ink sm:text-2xl">
              {movie.title}{" "}
              <span className="font-sans text-base font-normal text-ink-muted">
                ({movie.year})
              </span>
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-ink-soft">
              <span>{formatRuntime(movie.runtimeMinutes)}</span>
              <span aria-hidden className="text-ink-muted">
                ·
              </span>
              <span className="font-mono text-[12px]">{movie.aspectRatio}</span>
              <span aria-hidden className="text-ink-muted">
                ·
              </span>
              {movie.genres.map((genre) => (
                <Badge key={genre.slug} tone="outline" className="normal-case tracking-normal">
                  {genre.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={movie.sourcePage}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses("ghost", "sm", "text-ink-muted hover:text-ink")}
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Source
            </a>
            <Link href={`/movie/${movie.slug}`} className={buttonClasses("outline", "sm")}>
              Film details
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <PlayerShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <div aria-live="polite" role="status" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
