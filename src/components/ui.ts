// src/components/ui.ts
// Shared Tailwind class names so forms and buttons look the same everywhere.

export const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none";

export const labelClass = "mb-1 block text-sm font-medium text-foreground";

export const hintClass = "mt-1 text-xs text-muted";

export const primaryButton =
  "inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 font-semibold text-accent-foreground disabled:opacity-50";

export const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm text-foreground hover:border-muted disabled:opacity-50";

export const cardClass = "rounded-xl border border-border bg-surface p-4";

export const warningClass = "rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-foreground";
