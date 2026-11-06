"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/skeleton";
import type { PlayerProps } from "./player";

/**
 * The player is a client-only island (`ssr: false`). This thin wrapper is the
 * only place `next/dynamic` is called, so the watch page can stay a server
 * component. The loading shell mirrors the player's layout to avoid a shift.
 */
const PlayerClient = dynamic(() => import("./player").then((module) => module.Player), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full max-w-[min(1560px,calc((100dvh_-_10rem)*16/9))] flex-col items-center gap-4">
          <div
            role="status"
            aria-label="Loading player"
            className="flex aspect-video w-full items-center justify-center bg-black sm:rounded-lg"
          >
            <Spinner className="size-10 border-[3px] border-white/20 border-t-gold" />
          </div>
          <div className="h-4 w-40 animate-pulse rounded-xs bg-white/[0.06]" aria-hidden />
        </div>
      </div>
      <div className="border-t border-line/60">
        <div className="cm-shell flex flex-col gap-3 py-5 sm:flex-row sm:items-end sm:justify-between sm:py-6">
          <div className="space-y-2">
            <div className="h-6 w-52 animate-pulse rounded-xs bg-white/[0.07]" aria-hidden />
            <div className="h-3.5 w-36 animate-pulse rounded-xs bg-white/[0.05]" aria-hidden />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-sm bg-white/[0.05]" aria-hidden />
        </div>
      </div>
    </div>
  ),
});

export function PlayerLoader({ movie, initialTime }: PlayerProps) {
  return <PlayerClient movie={movie} initialTime={initialTime} />;
}
