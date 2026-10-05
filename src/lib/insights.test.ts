// src/lib/insights.test.ts
import { describe, expect, it } from "vitest";
import { byCity, siteTotals } from "./insights";
import type { Institution, ReportWithInstitution } from "./types";

const inst = (id: string, city: string): Institution => ({
  id, slug: id, name: id, aliases: [], type: "school", city, state: "S", board: null, createdAt: "",
});

function report(institution: Institution, year: string, tuition: number, hike: number | null = null): ReportWithInstitution {
  return {
    id: `${institution.id}-${year}-${tuition}`, institutionId: institution.id, institution, username: "u",
    originalText: "", evidence: [], meTooCount: 1, createdAt: "", updatedAt: "",
    academicYear: year, classOrCourse: "Grade 1", admissionType: null, reportedTotal: null, hikePercent: hike, flags: [],
    components: [{ kind: "tuition", label: null, amount: tuition, frequency: "yearly" }],
  };
}

describe("insights", () => {
  it("uses each institution's own hike, not a mix across institutions", () => {
    const a = inst("a", "Pune");
    const b = inst("b", "Pune");
    const rows = byCity([
      report(a, "2025-26", 100000), report(a, "2026-27", 110000),
      report(b, "2025-26", 200000), report(b, "2026-27", 260000),
    ]);
    expect(rows[0].medianHike).toBe(20); // middle of 10% and 30%
  });

  it("counts totals", () => {
    const a = inst("a", "Pune");
    expect(siteTotals([report(a, "2026-27", 1)])).toMatchObject({ reports: 1, institutions: 1, cities: 1, meToos: 1 });
  });
});
