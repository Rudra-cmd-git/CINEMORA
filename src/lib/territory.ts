"use client";

import { DEFAULT_TERRITORY, STORAGE_KEYS } from "@/lib/constants";
import { createJsonStore } from "@/lib/storage";
import type { TerritorySelection } from "@/types";

/** Rough timezone → country hints. Used only for a sensible default. */
const TIMEZONE_HINTS: Array<[RegExp, string]> = [
  [/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Indiana)/, "US"],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax)/, "CA"],
  [/^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Manaus)/, "BR"],
  [/^Europe\/(London|Belfast)/, "GB"],
  [/^Europe\/Berlin/, "DE"],
  [/^Europe\/Paris/, "FR"],
  [/^Asia\/(Kolkata|Calcutta)/, "IN"],
  [/^Asia\/Tokyo/, "JP"],
  [/^Australia\//, "AU"],
];

const EMPTY_SELECTION: TerritorySelection | null = null;

function isSelection(value: unknown): value is TerritorySelection | null {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  const s = value as TerritorySelection;
  return (
    typeof s.code === "string" &&
    s.code.length === 2 &&
    (s.source === "heuristic" || s.source === "manual")
  );
}

export const territoryStore = createJsonStore<TerritorySelection | null>(
  STORAGE_KEYS.territory,
  EMPTY_SELECTION,
  isSelection,
);

/** Best-effort guess from the browser locale, then timezone. Never authoritative. */
export function detectTerritory(): TerritorySelection {
  if (typeof window === "undefined") {
    return { code: DEFAULT_TERRITORY, source: "heuristic" };
  }

  for (const language of navigator.languages ?? [navigator.language]) {
    try {
      const locale = new Intl.Locale(language) as Intl.Locale & { region?: string };
      const region = locale.region ?? locale.maximize().region;
      if (region && region.length === 2) {
        return { code: region.toUpperCase(), source: "heuristic" };
      }
    } catch {
      // Older engines — fall through to timezone detection.
    }
  }

  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    for (const [pattern, code] of TIMEZONE_HINTS) {
      if (pattern.test(zone)) return { code, source: "heuristic" };
    }
  } catch {
    // ignore
  }

  return { code: DEFAULT_TERRITORY, source: "heuristic" };
}

export function setTerritory(code: string): void {
  territoryStore.set({ code: code.toUpperCase(), source: "manual" });
}

export function clearTerritory(): void {
  territoryStore.reset();
}
