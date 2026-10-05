// src/lib/identifying.ts
// Spots details in a report's text that could identify the family (simple patterns,
// no AI). Shown to the reporter as a warning before publishing; nothing is blocked.

export type IdentifyingHint = { label: string; match: string };

const PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Phone number", pattern: /(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g },
  { label: "Email address", pattern: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g },
  { label: "Section or division", pattern: /\b(?:section|sec\.?|div(?:ision)?\.?)\s*[-:]?\s*[A-H]\b/gi },
  { label: "Roll / admission / enrolment number", pattern: /\b(?:roll(?:\s*(?:no\.?|number|#))?|(?:admission|adm|enrol(?:l)?ment|registration|reg|student\s*id)\.?\s*(?:no\.?|number|#))\s*[:-]?\s*[A-Z]{0,4}[/-]?\d[A-Z0-9/-]*/gi },
  { label: "Child's or parent's name", pattern: /\b[Mm]y\s+(?:son|daughter|child|kid|ward|husband|wife)\s*,?\s+(?:named\s+|is\s+)?[A-Z][a-z]{2,}/g },
  { label: "Name", pattern: /\b(?:[Mm]y name is|I am|I'm)\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?/g },
  { label: "Siblings or twins", pattern: /\b(?:twins?|both my (?:kids|children|sons|daughters)|my (?:two|three) (?:kids|children))\b/gi },
  { label: "Exact joining date", pattern: /\bjoined\s+(?:on|in)\s+\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+/gi },
];

export function findIdentifyingDetails(text: string): IdentifyingHint[] {
  const hints: IdentifyingHint[] = [];
  for (const { label, pattern } of PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      hints.push({ label, match: match[0].trim() });
    }
  }
  return hints;
}
