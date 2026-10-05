// src/lib/fees.test.ts
import { describe, expect, it } from "vitest";
import {
  extrasShare,
  feesByClassAndYear,
  formatRupees,
  formatRupeesShort,
  hikeHistory,
  median,
  yearOneCost,
} from "./fees";
import type { Report, ReportFields } from "./types";

const empty: ReportFields = {
  academicYear: null,
  classOrCourse: null,
  admissionType: null,
  components: [],
  reportedTotal: null,
  hikePercent: null,
  flags: [],
};

function report(fields: Partial<ReportFields>): Report {
  return {
    ...empty,
    ...fields,
    id: "r",
    institutionId: "i",
    username: "u",
    originalText: "",
    evidence: [],
    meTooCount: 0,
    createdAt: "",
    updatedAt: "",
  };
}

describe("fees", () => {
  it("annualises recurring fees and adds one-time fees", () => {
    const fields: ReportFields = {
      ...empty,
      components: [
        { kind: "tuition", label: null, amount: 10000, frequency: "monthly" },
        { kind: "admission", label: null, amount: 50000, frequency: "one_time" },
        { kind: "transport", label: null, amount: 9000, frequency: "quarterly" },
      ],
    };
    expect(yearOneCost(fields)).toBe(120000 + 50000 + 36000);
    expect(extrasShare(fields)).toBeCloseTo(86000 / 206000);
  });

  it("prefers the reporter's own total", () => {
    expect(yearOneCost({ ...empty, reportedTotal: 250000 })).toBe(250000);
    expect(yearOneCost(empty)).toBeNull();
  });

  it("computes medians", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it("formats rupees the Indian way", () => {
    expect(formatRupees(125000)).toBe("₹1,25,000");
    expect(formatRupeesShort(125000)).toBe("₹1.25 L");
    expect(formatRupeesShort(21000000)).toBe("₹2.1 Cr");
  });

  it("groups by class and year and works out hikes", () => {
    const reports = [
      report({ classOrCourse: "Grade 1", academicYear: "2025-26", reportedTotal: 100000,
        components: [{ kind: "tuition", label: null, amount: 100000, frequency: "yearly" }] }),
      report({ classOrCourse: "Grade 1", academicYear: "2026-27", reportedTotal: 120000, hikePercent: 15,
        components: [{ kind: "tuition", label: null, amount: 120000, frequency: "yearly" }] }),
    ];
    const rows = feesByClassAndYear(reports);
    expect(rows[0].academicYear).toBe("2026-27");
    expect(rows[0].yearOne?.median).toBe(120000);
    const hikes = hikeHistory(reports);
    expect(hikes).toEqual([{ academicYear: "2026-27", medianHike: 17.5, sources: 2 }]);
  });
});
