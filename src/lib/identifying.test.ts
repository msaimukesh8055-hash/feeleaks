// src/lib/identifying.test.ts
import { describe, expect, it } from "vitest";
import { findIdentifyingDetails } from "./identifying";

describe("findIdentifyingDetails", () => {
  it("finds phone numbers, sections and names", () => {
    const hints = findIdentifyingDetails(
      "My daughter Ananya is in Grade 3 section B. Call me on 98765 43210. Roll no 1234.",
    );
    const labels = hints.map((h) => h.label);
    expect(labels).toContain("Phone number");
    expect(labels).toContain("Section or division");
    expect(labels).toContain("Child's or parent's name");
    expect(labels).toContain("Roll / admission / enrolment number");
  });

  it("does not flag ordinary fee text", () => {
    expect(
      findIdentifyingDetails("Grade 1 tuition is ₹1,20,000 a year plus ₹50,000 admission fee for 2026-27."),
    ).toEqual([]);
  });
});

describe("findIdentifyingDetails false positives", () => {
  it("ignores admission years and fees", () => {
    expect(findIdentifyingDetails("New admission 2026-27, admission fee 50000, Section 12 of RTE")).toEqual([]);
  });
});
