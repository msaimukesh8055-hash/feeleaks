// src/lib/site.ts
// Site-wide constants.

export const SITE_NAME = "FeeLeaks";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
