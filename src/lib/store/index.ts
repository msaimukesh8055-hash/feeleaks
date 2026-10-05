// src/lib/store/index.ts
// Picks the storage backend: Supabase when its keys are set, otherwise the demo file store.

import "server-only";
import { DemoStore } from "./demo-store";
import { SupabaseStore, supabaseConfigured } from "./supabase-store";
import type { Store } from "./types";

let store: Store | null = null;

export function getStore(): Store {
  store ??= supabaseConfigured() ? new SupabaseStore() : new DemoStore();
  return store;
}

export function isDemoMode(): boolean {
  return getStore().kind === "demo";
}

// On Vercel the demo store's disk isn't shared between pages, so saved reports can't
// be read back. Writing is switched off there until Supabase is connected.
export function canSaveReports(): boolean {
  return !(isDemoMode() && process.env.VERCEL);
}
