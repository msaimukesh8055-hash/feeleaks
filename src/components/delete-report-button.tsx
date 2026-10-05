// src/components/delete-report-button.tsx
// Lets the browser that wrote a report delete it, after confirming.

"use client";

import { useState, useTransition } from "react";
import { deleteReport } from "@/app/report/actions";
import { secondaryButton } from "./ui";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Delete this report permanently? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteReport(reportId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={pending} className={secondaryButton}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </>
  );
}
