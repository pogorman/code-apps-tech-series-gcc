import { useState } from "react";

export type ViewMode = "table" | "card";

const STORAGE_PREFIX = "view-mode-";

export function useViewPreference(entity: string): [ViewMode, (mode: ViewMode) => void] {
  const key = `${STORAGE_PREFIX}${entity}`;
  const [mode, setModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(key);
    return stored === "card" ? "card" : "table";
  });

  const setMode = (next: ViewMode) => {
    localStorage.setItem(key, next);
    setModeState(next);
  };

  return [mode, setMode];
}
