// src/lib/store/index.ts
// Picks the storage backend. Supabase will plug in here once it's set up.

import "server-only";
import { DemoStore } from "./demo-store";
import type { Store } from "./types";

let store: Store | null = null;

export function getStore(): Store {
  store ??= new DemoStore();
  return store;
}

export function isDemoMode(): boolean {
  return getStore().kind === "demo";
}
