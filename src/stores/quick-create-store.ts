import { create } from "zustand";

export type QuickCreateTarget =
  | "accounts"
  | "contacts"
  | "action-items"
  | "meeting-summaries"
  | "ideas"
  | "projects"
  | null;

export type QuickCreatePayload = Record<string, unknown> | null;

interface QuickCreateState {
  target: QuickCreateTarget;
  payload: QuickCreatePayload;
  open: (target: NonNullable<QuickCreateTarget>, payload?: Record<string, unknown>) => void;
  clear: () => void;
}

export const useQuickCreateStore = create<QuickCreateState>((set) => ({
  target: null,
  payload: null,
  open: (target, payload) => set({ target, payload: payload ?? null }),
  clear: () => set({ target: null, payload: null }),
}));
