// src/components/demo-banner.tsx
// Warns that no database is connected yet, so reports are temporary.

import { isDemoMode } from "@/lib/store";

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="bg-accent/10 px-4 py-2 text-center text-xs text-accent print:hidden">
      Demo mode: no database is connected yet, so reports here are temporary and may disappear.
    </div>
  );
}
