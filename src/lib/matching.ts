// src/lib/matching.ts
// Fuzzy matching of institution names written different ways
// ("DPS Bangalore East", "Delhi Public School, Bangalore East").

import type { Institution } from "./types";

const FILLER = new Set(["the", "of", "and", "s", "pvt", "ltd", "private", "limited", "trust", "society"]);

// Words most institution names share; they count for less when comparing.
const GENERIC = new Set([
  "school", "college", "university", "academy", "institute", "institution", "international",
  "public", "senior", "secondary", "higher", "high", "primary", "convent", "vidyalaya",
  "english", "medium", "residential", "global", "centre", "center", "classes", "coaching",
  "tuition", "tutorials", "st", "sri", "shri", "new", "national", "model", "engineering",
  "technology", "science", "arts", "commerce", "management", "studies", "education",
]);

function weight(token: string): number {
  return GENERIC.has(token) ? 0.25 : 1;
}

export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(name: string): string[] {
  return normaliseName(name)
    .split(" ")
    .filter((t) => t && !FILLER.has(t));
}

function acronym(name: string): string {
  return tokens(name)
    .map((t) => t[0])
    .join("");
}

// Expands a leading acronym ("dps") when the other name spells it out.
function expandAcronyms(a: string[], b: string[]): string[] {
  const out: string[] = [];
  for (const token of a) {
    out.push(...(acronymWindow(token, b) ?? [token]));
  }
  return out;
}

function acronymWindow(token: string, b: string[]): string[] | null {
  if (token.length < 2 || token.length > 5 || b.includes(token)) return null;
  for (let i = 0; i + token.length <= b.length; i++) {
    const window = b.slice(i, i + token.length);
    if (window.map((t) => t[0]).join("") === token) return window;
  }
  return null;
}

// 0–1 similarity between two institution names.
export function nameSimilarity(a: string, b: string): number {
  const na = normaliseName(a);
  const nb = normaliseName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (acronym(a) === nb.replace(/\s/g, "") || acronym(b) === na.replace(/\s/g, "")) return 0.9;
  const ta = new Set(expandAcronyms(tokens(a), tokens(b)));
  const tb = new Set(expandAcronyms(tokens(b), tokens(a)));
  const total = (set: Set<string>) => [...set].reduce((sum, t) => sum + weight(t), 0);
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += weight(t);
  const small = Math.min(total(ta), total(tb));
  const large = Math.max(total(ta), total(tb));
  if (small === 0) return 0;
  return (shared / small) * Math.sqrt(shared / large);
}

function bestNameScore(institution: Institution, name: string): number {
  return Math.max(
    nameSimilarity(institution.name, name),
    ...institution.aliases.map((alias) => nameSimilarity(alias, name)),
  );
}

export type Candidate = { institution: Institution; score: number };

// Institutions that could be the one the reporter means, best first.
export function findCandidates(
  institutions: Institution[],
  name: string,
  city: string | null,
  limit = 8,
): Candidate[] {
  const cityNorm = city ? normaliseName(city) : null;
  return institutions
    .map((institution) => {
      let score = bestNameScore(institution, name);
      if (cityNorm && normaliseName(institution.city) === cityNorm) score += 0.15;
      return { institution, score };
    })
    .filter((c) => c.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function slugify(text: string): string {
  return normaliseName(text).replace(/\s/g, "-").slice(0, 80) || "institution";
}
