import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "gold" | "muted" | "outline" | "crimson" | "teal" | "solid";

const TONES: Record<Tone, string> = {
  gold: "bg-gold-soft text-gold ring-1 ring-inset ring-gold/25",
  muted: "bg-white/[0.06] text-ink-soft ring-1 ring-inset ring-white/10",
  outline: "text-ink-soft ring-1 ring-inset ring-line-strong",
  crimson: "bg-crimson-soft text-[#ff8b98] ring-1 ring-inset ring-crimson/30",
  teal: "bg-teal-soft text-teal ring-1 ring-inset ring-teal/30",
  solid: "bg-gold text-ink-inverse",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "muted", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em]",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
