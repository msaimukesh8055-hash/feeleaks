// scripts/build-cases.mjs
// Converts the numbered cases in docs/research/public-fee-cases.md into
// src/data/public-cases.ts, word for word. Run: npm run cases

import { readFileSync, writeFileSync } from "node:fs";

const md = readFileSync("docs/research/public-fee-cases.md", "utf8");
const lines = md.split("\n");

const cases = [];
let region = null;
let current = null;
let inCases = false;

for (const line of lines) {
  if (line.startsWith("## ")) {
    const title = line.slice(3).trim();
    // Case sections sit between the first "---" and the forum/context sections.
    if (/^(Forum leads|Context|Skipped|Next steps)/.test(title)) {
      inCases = false;
      current = null;
      continue;
    }
    if (inCases) region = title;
    continue;
  }
  if (line.trim() === "---") {
    inCases = !inCases ? true : inCases;
    continue;
  }
  if (!inCases || !region) continue;
  const heading = /^### (\d+)\. (.+)$/.exec(line);
  if (heading) {
    current = { number: Number(heading[1]), title: heading[2].trim(), region, quotes: [], lines: [] };
    cases.push(current);
    continue;
  }
  if (current && line.startsWith("> ")) current.quotes.push(line.slice(2));
  if (current && line.startsWith("- ")) current.lines.push(line.slice(2));
}

const out = `// src/data/public-cases.ts
// Generated from docs/research/public-fee-cases.md by scripts/build-cases.mjs — do not edit by hand.

export type PublicCase = {
  number: number;
  title: string; // markdown
  region: string;
  quotes: string[]; // parents' exact words as printed by the named source (markdown)
  lines: string[]; // markdown
};

export const PUBLIC_CASES: PublicCase[] = ${JSON.stringify(cases, null, 2)};
`;
writeFileSync("src/data/public-cases.ts", out);
console.log(`Wrote ${cases.length} cases`);
