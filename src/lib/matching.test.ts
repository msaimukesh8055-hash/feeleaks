// src/lib/matching.test.ts
import { describe, expect, it } from "vitest";
import { findCandidates, nameSimilarity, slugify } from "./matching";
import type { Institution } from "./types";

function institution(name: string, city: string, aliases: string[] = []): Institution {
  return { id: name, slug: slugify(name), name, aliases, type: "school", city, state: "", board: null, createdAt: "" };
}

describe("matching", () => {
  it("matches acronyms and spellings", () => {
    expect(nameSimilarity("DPS Bangalore East", "Delhi Public School, Bangalore East")).toBeGreaterThan(0.9);
    expect(nameSimilarity("DPS", "Delhi Public School")).toBeGreaterThan(0.8);
    expect(nameSimilarity("St. Joseph's School", "St Josephs School")).toBeLessThan(1);
  });

  it("does not match different institutions on generic words alone", () => {
    expect(nameSimilarity("St Mary's School", "St Joseph's School")).toBeLessThan(0.35);
  });

  it("prefers the same city", () => {
    const list = [institution("Delhi Public School", "Pune"), institution("Delhi Public School", "Bengaluru")];
    const result = findCandidates(list, "DPS", "Bengaluru");
    expect(result[0].institution.city).toBe("Bengaluru");
  });
});
