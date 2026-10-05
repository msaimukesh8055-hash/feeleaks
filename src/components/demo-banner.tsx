// src/components/demo-banner.tsx
// Warns that no database is connected yet, so reports are temporary (or, on the live
// site, can't be published at all).

import { canSaveReports, isDemoMode } from "@/lib/store";

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="bg-accent/10 px-4 py-2 text-center text-xs text-accent print:hidden">
      {canSaveReports()
        ? "Demo mode: no database is connected yet, so reports here are temporary and may disappear."
        : "Preview only: the database isn't connected yet, so new reports can't be published on the live site."}
    </div>
  );
}
