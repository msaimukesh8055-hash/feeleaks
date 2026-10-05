// src/lib/site.ts
// Site-wide constants.

export const SITE_NAME = "FeeLeaks";

// Public address used in share links, emails and previews. Falls back to the address
// Vercel provides automatically, then to localhost for development.
export function siteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const url = process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}
