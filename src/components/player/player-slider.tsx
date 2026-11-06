"use client";

import * as React from "react";
import { clamp, cn } from "@/lib/utils";

/**
 * A dependency-free, accessible slider used for both the seek bar and the
 * volume control.
 *
 * - `role="slider"` + full ARIA value triplet (the seek bar is a real slider,
 *   not a styled `<input>`).
 * - Pointer drag with capture so a fast drag keeps tracking outside the bar.
 * - Keyboard: arrows, Home/End, PageUp/PageDown — with an optional step that
 *   differs from the visual step (the seek bar nudges ±5s per arrow).
 * - `onHover` powers the seek preview tooltip.
 */
export interface PlayerSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueText: string;
  /** Arrow-key increment; defaults to `step`. */
  keyboardStep?: number;
  /** 0..1 of the media buffered, drawn behind the played fill. */
  buffered?: number;
  disabled?: boolean;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  onHover?: (value: number | null) => void;
  onScrubStart?: () => void;
  /** Fires continuously while dragging (use for preview state). */
  onScrub?: (value: number) => void;
  /** Fires on release / keyboard input (use to commit the seek). */
  onScrubEnd?: (value: number) => void;
}

function percentOf(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1) * 100;
}

export function PlayerSlider({
  label,
  min,
  max,
  step,
  value,
  valueText,
  keyboardStep,
  buffered,
  disabled = false,
  className,
  trackClassName,
  fillClassName,
  onHover,
  onScrubStart,
  onScrub,
  onScrubEnd,
}: PlayerSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const percent = percentOf(value, min, max);

  const valueFromClientX = React.useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track || max <= min) return min;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return min;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return min + ratio * (max - min);
    },
    [max, min],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    onScrubStart?.();
    onScrub?.(valueFromClientX(event.clientX));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const next = valueFromClientX(event.clientX);
    if (dragging) {
      onScrub?.(next);
      return;
    }
    onHover?.(next);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !dragging) return;
    setDragging(false);
    const next = valueFromClientX(event.clientX);
    onScrub?.(next);
    onScrubEnd?.(next);
  };

  const handlePointerCancel = () => {
    if (!dragging) return;
    setDragging(false);
    onScrubEnd?.(value);
  };

  const handlePointerLeave = () => {
    if (dragging) return;
    onHover?.(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const increment = keyboardStep ?? step;
    let next: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = value - increment;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = value + increment;
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      case "PageDown":
        next = value - increment * 6;
        break;
      case "PageUp":
        next = value + increment * 6;
        break;
      default:
        return;
    }

    event.preventDefault();
    // Stop the global player shortcuts from also acting on this key press.
    event.stopPropagation();
    onScrubStart?.();
    onScrubEnd?.(clamp(next, min, max));
  };

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value * 100) / 100}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      data-dragging={dragging ? "true" : undefined}
      className={cn(
        "group relative flex h-6 w-full touch-none select-none items-center rounded-full outline-none",
        disabled ? "cursor-default opacity-55" : "cursor-pointer",
        "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={trackRef}
        className={cn(
          "relative h-1 w-full overflow-hidden rounded-full bg-white/20",
          "transition-[height] duration-150 ease-[var(--cm-ease)] group-hover:h-1.5 group-focus-visible:h-1.5",
          trackClassName,
        )}
      >
        {typeof buffered === "number" ? (
          <div
            className="absolute inset-y-0 left-0 bg-white/25"
            style={{ width: `${clamp(buffered, 0, 1) * 100}%` }}
            aria-hidden
          />
        ) : null}
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full bg-gold", fillClassName)}
          style={{ width: `${percent}%` }}
          aria-hidden
        />
      </div>

      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink",
          "scale-0 opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.65)] transition-[transform,opacity] duration-150",
          "group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100",
          dragging && "scale-100 opacity-100",
        )}
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}
