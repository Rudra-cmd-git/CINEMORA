"use client";

import { Check, Globe } from "lucide-react";
import { TERRITORIES } from "@/lib/constants";
import { useTerritory } from "@/hooks/use-territory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

function countryName(code: string): string {
  return TERRITORIES.find((territory) => territory.code === code)?.name ?? code;
}

export function RegionSelector({ className }: { className?: string }) {
  const { code, choose, isManual } = useTerritory();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-[12px] text-ink-soft transition-colors",
            "hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            className,
          )}
          aria-label={`Region: ${countryName(code)}. Change region.`}
        >
          <Globe className="size-3.5" aria-hidden />
          <span className="cm-tabular font-medium tracking-wide">{code}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[15rem]">
        <DropdownMenuLabel>Watching from</DropdownMenuLabel>
        {TERRITORIES.map((territory) => (
          <DropdownMenuItem key={territory.code} onSelect={() => choose(territory.code)}>
            <span className="w-4 shrink-0">
              {territory.code === code ? <Check className="size-3.5 text-gold" /> : null}
            </span>
            <span className="flex-1">{territory.name}</span>
            <span className="cm-tabular text-[11px] text-ink-muted">{territory.code}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="px-3 pb-2 pt-1 text-[11px] leading-relaxed text-ink-muted">
          {isManual ? "Set manually. " : "Detected automatically. "}
          Region only controls which public-domain titles we show — it is not a legal guarantee.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
