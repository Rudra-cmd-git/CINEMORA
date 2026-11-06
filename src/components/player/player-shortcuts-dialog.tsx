"use client";

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ShortcutRow {
  keys: string[];
  description: string;
}

export const PLAYER_SHORTCUTS: ShortcutRow[] = [
  { keys: ["Space", "K"], description: "Play / pause" },
  { keys: ["←", "→"], description: "Back / forward 10 seconds" },
  { keys: ["J", "L"], description: "Back / forward 10 seconds" },
  { keys: ["↑", "↓"], description: "Volume up / down" },
  { keys: ["M"], description: "Mute / unmute" },
  { keys: ["F"], description: "Toggle fullscreen" },
  { keys: ["C"], description: "Cycle subtitles" },
  { keys: ["P"], description: "Picture-in-picture" },
  { keys: ["0–9"], description: "Jump to 0%–90% of the film" },
  { keys: [">", "<"], description: "Speed up / slow down" },
  { keys: ["?"], description: "Show this shortcut list" },
  { keys: ["Esc"], description: "Close menus and overlays" },
];

function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-line-strong bg-white/[0.06] px-1.5 font-mono text-[11px] font-medium text-ink shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]">
      {children}
    </kbd>
  );
}

interface PlayerShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The `?` overlay — a focused reference sheet, not a full settings page. */
export function PlayerShortcutsDialog({ open, onOpenChange }: PlayerShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,30rem)] border-line bg-elevated/95 p-0 shadow-[var(--cm-shadow-xl)] backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-line px-6 py-5">
          <span className="flex size-9 items-center justify-center rounded-full bg-gold-soft text-gold">
            <Keyboard className="size-4" aria-hidden />
          </span>
          <div>
            <DialogTitle className="font-display text-[17px] font-medium tracking-wide text-ink">
              Keyboard shortcuts
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-ink-muted">
              Every control works without a mouse.
            </DialogDescription>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 px-6 py-5 sm:grid-cols-2">
          {PLAYER_SHORTCUTS.map((row) => (
            <div key={row.description + row.keys.join("")} className="flex items-center justify-between gap-3">
              <dt className="text-[13px] text-ink-soft">{row.description}</dt>
              <dd className="flex shrink-0 items-center gap-1">
                {row.keys.map((key) => (
                  <Keycap key={key}>{key}</Keycap>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
