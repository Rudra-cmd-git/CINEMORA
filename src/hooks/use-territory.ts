"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DEFAULT_TERRITORY } from "@/lib/constants";
import { detectTerritory, setTerritory, territoryStore } from "@/lib/territory";
import type { TerritorySelection } from "@/types";

export interface UseTerritory {
  /** Effective territory used for rights gating. */
  code: string;
  selection: TerritorySelection;
  isManual: boolean;
  choose: (code: string) => void;
}

export function useTerritory(): UseTerritory {
  const stored = useSyncExternalStore(
    territoryStore.subscribe,
    territoryStore.getSnapshot,
    territoryStore.getServerSnapshot,
  );

  const [detected, setDetected] = useState<TerritorySelection>({
    code: DEFAULT_TERRITORY,
    source: "heuristic",
  });

  useEffect(() => {
    setDetected(detectTerritory());
  }, []);

  const selection = stored ?? detected;

  return {
    code: selection.code,
    selection,
    isManual: selection.source === "manual",
    choose: setTerritory,
  };
}
