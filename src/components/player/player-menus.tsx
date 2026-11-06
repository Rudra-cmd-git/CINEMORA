"use client";

import { Captions, CaptionsOff, Check } from "lucide-react";
import { buttonClasses } from "@/components/ui/button-styles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { formatRate, PLAYBACK_RATES } from "./player-utils";
import type { PlayerController, PlayerMovie } from "./types";

interface MenuProps {
  controller: PlayerController;
}

/**
 * Playback-speed menu (0.5×–2×). Only one menu can be open at a time: the open
 * menu is part of the player's controller state so the chrome stays pinned.
 */
export function RateMenu({ controller }: MenuProps) {
  const open = controller.menu === "rate";

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => controller.setMenu(next ? "rate" : null)}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Playback speed: ${formatRate(controller.rate)}`}
          className={buttonClasses(
            "ghost",
            "icon",
            "size-9 text-[11px] font-semibold tabular-nums text-ink-soft hover:text-ink",
          )}
        >
          <span aria-hidden>{formatRate(controller.rate) === "Normal" ? "1×" : `${controller.rate}×`}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" sideOffset={12} className="w-44">
        <DropdownMenuLabel>Playback speed</DropdownMenuLabel>
        {PLAYBACK_RATES.map((rate) => (
          <DropdownMenuItem
            key={rate}
            onSelect={() => controller.setRate(rate)}
            className="justify-between"
          >
            <span>{formatRate(rate)}</span>
            {controller.rate === rate ? (
              <Check className="size-3.5 text-gold" strokeWidth={3} aria-hidden />
            ) : (
              <span className="size-3.5" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Captions menu built from the film's `subtitleSources` — "Off" plus each
 * available language. Rendered only when the film actually ships subtitles.
 */
export function CaptionsMenu({ controller, movie }: MenuProps & { movie: PlayerMovie }) {
  const sources = movie.subtitleSources;
  if (sources.length === 0) return null;

  const selected = controller.selectedCaption;
  const currentLabel = selected === null ? "Off" : (sources[selected]?.label ?? "Off");
  const open = controller.menu === "captions";
  const isOn = selected !== null;
  const Icon = isOn ? Captions : CaptionsOff;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => controller.setMenu(next ? "captions" : null)}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Captions: ${currentLabel}`}
          className={buttonClasses(
            "ghost",
            "icon",
            cn("size-9 text-ink-soft hover:text-ink", isOn && "text-gold hover:text-gold-hover"),
          )}
        >
          <Icon className="size-5" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" sideOffset={12} className="w-48">
        <DropdownMenuLabel>Subtitles</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => controller.setCaption(null)} className="justify-between">
          <span>Off</span>
          {selected === null ? (
            <Check className="size-3.5 text-gold" strokeWidth={3} aria-hidden />
          ) : (
            <span className="size-3.5" aria-hidden />
          )}
        </DropdownMenuItem>
        {sources.map((source, index) => (
          <DropdownMenuItem
            key={`${source.language}-${index}`}
            onSelect={() => controller.setCaption(index)}
            className="justify-between"
          >
            <span>
              {source.label}
              <span className="ml-1.5 text-[10px] uppercase tracking-[0.08em] text-ink-muted">
                {source.language}
              </span>
            </span>
            {selected === index ? (
              <Check className="size-3.5 text-gold" strokeWidth={3} aria-hidden />
            ) : (
              <span className="size-3.5" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
