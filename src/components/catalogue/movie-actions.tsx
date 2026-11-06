"use client";

import { Check, Play, Plus, Share2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useTerritory } from "@/hooks/use-territory";
import { useWatchlist } from "@/hooks/use-watchlist";
import { canPlay, playbackBlockedReason } from "@/lib/rights";
import type { Movie } from "@/types";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Playback, watchlist and share controls for the film-detail page.
 *
 * Playback permission is derived at render time from the viewer's territory and
 * the film's rights records — there is no stored "playable" flag.
 */
export function MovieActions({ movie }: { movie: Movie }) {
  const { code } = useTerritory();
  const { has, toggle } = useWatchlist();
  const { toast } = useToast();
  const [sharing, setSharing] = React.useState(false);

  const playable = canPlay(movie, code);
  const saved = has(movie.slug);

  const onToggleWatchlist = () => {
    const nowSaved = toggle(movie.slug);
    toast({
      title: nowSaved ? "Added to My List" : "Removed from My List",
      description: movie.title,
      tone: nowSaved ? "success" : "default",
    });
  };

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    const url = `${window.location.origin}/movie/${movie.slug}`;
    const copied = await copyText(url);
    setSharing(false);
    toast(
      copied
        ? {
            title: "Link copied",
            description: `A shareable link to ${movie.title} is on your clipboard.`,
            tone: "success",
          }
        : {
            title: "Could not copy the link",
            description: "Copy the address from your browser bar instead.",
            tone: "error",
          },
    );
  };

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {playable ? (
          <Link href={`/watch/${movie.slug}`} className={buttonClasses("primary", "lg")}>
            <Play className="size-4 fill-current" aria-hidden />
            Play film
          </Link>
        ) : null}

        <Button
          variant="secondary"
          size="lg"
          onClick={onToggleWatchlist}
          aria-pressed={saved}
          aria-label={
            saved ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`
          }
        >
          {saved ? (
            <Check className="size-4" strokeWidth={2.6} aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          {saved ? "In My List" : "Add to My List"}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={onShare}
          disabled={sharing}
          aria-label={`Copy a shareable link to ${movie.title}`}
        >
          <Share2 className="size-4" aria-hidden />
          Share
        </Button>
      </div>

      {playable ? null : (
        <div
          role="status"
          className="flex max-w-2xl items-start gap-2.5 rounded-md border border-line bg-surface/60 px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          <span>
            {playbackBlockedReason(movie, code)}{" "}
            <Link
              href="/about#region"
              className="text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-hover"
            >
              About regional availability
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
