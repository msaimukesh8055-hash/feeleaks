// src/lib/letters.test.ts
import { describe, expect, it } from "vitest";
import { buildLetter, emailDraft, gmailComposeUrl } from "./letters";
import type { Institution, Report } from "./types";

const institution: Institution = {
  id: "i", slug: "abc", name: "ABC Public School", aliases: [], type: "school",
  city: "Pune", state: "Maharashtra", board: "CBSE", createdAt: "",
};

const report: Report = {
  id: "r", institutionId: "i", username: "u", originalText: "", evidence: [], meTooCount: 0,
  createdAt: "", updatedAt: "", academicYear: "2026-27", classOrCourse: "Grade 1", admissionType: "new",
  components: [
    { kind: "tuition", label: null, amount: 10000, frequency: "monthly" },
    { kind: "donation", label: "Building fund", amount: 100000, frequency: "one_time" },
  ],
  reportedTotal: null, hikePercent: 15,
  flags: [{ kind: "donation_capitation", note: "Asked for 1 lakh donation" }],
};

const base = { report, institution, authorityName: null, date: "5 Oct 2026", reportUrl: null };

describe("letters", () => {
  it("fills the complaint with fees, flags and blanks for unknowns", () => {
    const text = buildLetter("complaint", { ...base, parent: { name: "", address: "", contact: "" } });
    expect(text).toContain("ABC Public School, Pune");
    expect(text).toContain("Tuition: ₹10,000, per month = ₹1,20,000 a year");
    expect(text).toContain("Total for the first year: ₹2,20,000");
    expect(text).toContain("Donation / capitation demanded: Asked for 1 lakh donation");
    expect(text).toContain("[Name and address of the office you are writing to]");
    expect(text).not.toContain("feeleaks");
  });

  it("asks about RTE seats and the previous year in the RTI application", () => {
    const text = buildLetter("rti", { ...base, parent: { name: "A Parent", address: "Pune", contact: "" } });
    expect(text).toContain("Section 6(1) of the Right to Information Act, 2005");
    expect(text).toContain("2025-26 and 2026-27");
    expect(text).toContain("Section 12(1)(c)");
    expect(text).toContain("1. Name of applicant: A Parent");
  });

  it("asks whether the donation is voluntary in the breakdown request", () => {
    expect(buildLetter("breakdown", { ...base, parent: { name: "", address: "", contact: "" } })).toContain("voluntary");
  });

  it("builds a Gmail link without recipients", () => {
    const { subject, body } = emailDraft(report, institution, "https://x/report/r");
    const url = gmailComposeUrl([], subject, body);
    expect(url).toMatch(/^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&su=/);
    expect(url).not.toContain("to=");
  });
});
