// src/data/published-cases.ts
// The cases shown on the site: only those with parents' own words, and only those words.
// Sources and other details stay in public-cases.ts / the research doc and are not rendered.

import { quoteWords } from "@/components/inline-markdown";
import { PUBLIC_CASES } from "./public-cases";

export type PublishedCase = {
  number: number;
  title: string;
  region: string;
  words: string[];
};

export const PUBLISHED_CASES: PublishedCase[] = PUBLIC_CASES.filter((c) => c.quotes.length > 0).map((c) => ({
  number: c.number,
  title: c.title,
  region: c.region,
  words: c.quotes.map(quoteWords),
}));
