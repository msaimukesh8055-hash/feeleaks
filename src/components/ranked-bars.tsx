// src/components/ranked-bars.tsx
// Horizontal ranked bar list (one series, one hue). Each row is a link with its label,
// a bar scaled to the largest value, the value at the bar tip, and a hover/focus note.

import Link from "next/link";

export type RankedRow = {
  key: string;
  label: string;
  sublabel?: string;
  href: string;
  value: number;
  display: string;
  note: string; // shown on hover/focus, e.g. "3 reports · Grade 1 · 2026-27"
};

export function RankedBars({ rows, empty }: { rows: RankedRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <ol className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <Link
            href={row.href}
            title={row.note}
            className="group relative block rounded-md p-1 outline-none hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {row.label}
                {row.sublabel && <span className="text-muted"> · {row.sublabel}</span>}
              </span>
            </span>
            <span className="mt-1 flex items-center gap-2">
              <span className="h-3 flex-1">
                <span
                  className="block h-3 rounded-r bg-accent"
                  style={{ width: `${Math.max(2, (Math.abs(row.value) / max) * 100)}%` }}
                />
              </span>
              <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">{row.display}</span>
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute right-0 bottom-full z-10 mb-1 hidden rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground shadow-lg group-hover:block group-focus-visible:block"
            >
              {row.note}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
