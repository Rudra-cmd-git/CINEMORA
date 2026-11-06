"use client";

import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as React from "react";
import { buttonClasses } from "@/components/ui/button-styles";
import { cn, formatTimecode } from "@/lib/utils";
import { CaptionsMenu, RateMenu } from "./player-menus";
import { PlayerSlider } from "./player-slider";
import type { PlayerController, PlayerMovie } from "./types";

interface PlayerControlsProps {
  movie: PlayerMovie;
  controller: PlayerController;
}

interface ControlButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Every player control is a real, labelled `<button>`. */
function ControlButton({ label, onClick, disabled, className, children }: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses(
        "ghost",
        "icon",
        cn("size-9 shrink-0 text-ink-soft hover:bg-white/10 hover:text-ink", className),
      )}
    >
      {children}
    </button>
  );
}

/**
 * Bottom chrome: seek bar, play/pause, ±10s, volume, timecode, speed,
 * subtitles, picture-in-picture and fullscreen.
 */
export function PlayerControls({ movie, controller }: PlayerControlsProps) {
  const {
    playing,
    muted,
    volume,
    fullscreen,
    pip,
    pipSupported,
    duration,
    currentTime,
    bufferedEnd,
  } = controller;

  // Scrubbing is previewed locally: the video only seeks on release, which
  // keeps dragging a network MP4 smooth (Range requests, no seek storm).
  const [scrubTime, setScrubTime] = React.useState<number | null>(null);
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);

  const ready = Number.isFinite(duration) && duration > 0;
  const displayTime = scrubTime ?? currentTime;
  const silent = muted || volume === 0;
  const VolumeIcon = silent ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="relative flex items-center">
        <PlayerSlider
          label="Seek"
          min={0}
          max={ready ? duration : 1}
          step={1}
          keyboardStep={5}
          value={ready ? Math.min(displayTime, duration) : 0}
          valueText={`${formatTimecode(displayTime)} of ${formatTimecode(duration)}`}
          buffered={ready ? bufferedEnd / duration : 0}
          disabled={!ready}
          fillClassName="bg-gradient-to-r from-gold-dim to-gold"
          onScrubStart={() => controller.showControls()}
          onHover={setHoverTime}
          onScrub={setScrubTime}
          onScrubEnd={(value) => {
            controller.seekTo(value);
            setScrubTime(null);
          }}
        />

        {hoverTime !== null && ready ? (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-xs border border-line bg-elevated/95 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-ink shadow-[var(--cm-shadow-md)] backdrop-blur-sm"
            style={{ left: `${Math.min(97, Math.max(3, (hoverTime / duration) * 100))}%` }}
          >
            {formatTimecode(hoverTime)}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={controller.togglePlay}
          className={buttonClasses(
            "secondary",
            "icon",
            "size-11 shrink-0 border-0 bg-white/[0.09] text-ink ring-1 ring-inset ring-white/10 hover:bg-white/[0.16]",
          )}
        >
          {playing ? (
            <Pause className="size-5 fill-current" aria-hidden />
          ) : (
            <Play className="size-5 translate-x-px fill-current" aria-hidden />
          )}
        </button>

        <ControlButton
          label="Back 10 seconds"
          onClick={() => controller.seekBy(-10)}
          disabled={!ready}
          className="hidden sm:inline-flex"
        >
          <RotateCcw className="size-[18px]" aria-hidden />
        </ControlButton>

        <ControlButton
          label="Forward 10 seconds"
          onClick={() => controller.seekBy(10)}
          disabled={!ready}
          className="hidden sm:inline-flex"
        >
          <RotateCw className="size-[18px]" aria-hidden />
        </ControlButton>

        <div className="ml-0.5 flex items-center gap-1">
          <ControlButton
            label={silent ? "Unmute" : "Mute"}
            onClick={controller.toggleMute}
            className="sm:ml-0.5"
          >
            <VolumeIcon className="size-[18px]" aria-hidden />
          </ControlButton>
          <PlayerSlider
            label="Volume"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            valueText={`${Math.round((muted ? 0 : volume) * 100)} percent`}
            className="hidden w-20 md:flex lg:w-24"
            trackClassName="h-1"
            fillClassName={silent ? "bg-ink-muted" : "bg-ink"}
            onScrubStart={() => controller.showControls()}
            onScrubEnd={controller.setVolume}
          />
        </div>

        <span className="cm-tabular ml-1.5 shrink-0 select-none font-mono text-[11px] tracking-tight text-ink-soft sm:ml-2.5 sm:text-xs">
          {formatTimecode(displayTime)} <span className="text-ink-muted">/</span>{" "}
          {formatTimecode(duration)}
        </span>

        <div className="flex-1" />

        <span className="hidden sm:block">
          <RateMenu controller={controller} />
        </span>
        <CaptionsMenu controller={controller} movie={movie} />
        {pipSupported ? (
          <ControlButton
            label={pip ? "Exit picture-in-picture" : "Picture-in-picture"}
            onClick={controller.togglePip}
            className="hidden md:inline-flex"
          >
            <PictureInPicture2 className="size-[18px]" aria-hidden />
          </ControlButton>
        ) : null}
        <ControlButton
          label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={controller.toggleFullscreen}
        >
          {fullscreen ? (
            <Minimize className="size-[18px]" aria-hidden />
          ) : (
            <Maximize className="size-[18px]" aria-hidden />
          )}
        </ControlButton>
      </div>
    </div>
  );
}
