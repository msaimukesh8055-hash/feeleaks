// src/components/me-too-button.tsx
// "Me too" — another parent confirms they were asked the same, without writing a report.

"use client";

import { useState, useTransition } from "react";
import { setMeToo } from "@/app/report/actions";

export function MeTooButton({
  reportId,
  initialCount,
  initialActive,
  disabled,
}: {
  reportId: string;
  initialCount: number;
  initialActive: boolean;
  disabled: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [active, setActive] = useState(initialActive);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !active;
    setError(null);
    startTransition(async () => {
      const result = await setMeToo(reportId, next);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setActive(next);
      setCount(result.count);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || disabled}
        aria-pressed={active}
        className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 font-semibold disabled:opacity-60 ${
          active ? "border-accent bg-accent text-accent-foreground" : "border-accent text-accent"
        }`}
      >
        {active ? "✓ Me too" : "Me too"}
        <span className="font-mono text-sm">{count}</span>
      </button>
      <p className="mt-1 text-xs text-muted">
        {disabled
          ? "Other parents can tap this to confirm they were asked the same."
          : "Tap if you were asked the same. Anonymous, one per browser."}
      </p>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
