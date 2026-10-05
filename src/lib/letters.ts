// src/lib/letters.ts
// Builds the letters a parent can download and send themselves: a request to the
// institution for the fee breakdown, a complaint to an authority, and an RTI application.
// Runs in the browser; the parent's details never reach FeeLeaks.

import { academicYearLabel, academicYearStart, annualAmount, formatRupees, yearOneCost } from "./fees";
import {
  ADMISSION_TYPE_LABELS,
  FEE_FREQUENCY_LABELS,
  FEE_KIND_LABELS,
  FLAG_LABELS,
  type Institution,
  type Report,
} from "./types";

export const LETTER_KINDS = ["breakdown", "complaint", "rti"] as const;
export type LetterKind = (typeof LETTER_KINDS)[number];

export const LETTER_TITLES: Record<LetterKind, string> = {
  breakdown: "Ask the institution for the fee breakdown in writing",
  complaint: "Complaint to an authority",
  rti: "RTI application",
};

export type ParentDetails = {
  name: string;
  address: string;
  contact: string;
};

export type LetterInput = {
  report: Report;
  institution: Institution;
  // Office the letter is addressed to, if a verified authority is known.
  authorityName: string | null;
  parent: ParentDetails;
  date: string;
  reportUrl: string | null; // only if the parent chooses to include it
};

const BLANK = (label: string) => `[${label}]`;

function classAndYear(report: Report): string {
  return [report.classOrCourse ?? BLANK("class / course"), report.academicYear ?? BLANK("academic year")].join(", ");
}

function previousYear(report: Report): string {
  const start = academicYearStart(report.academicYear);
  return start ? academicYearLabel(start - 1) : BLANK("previous academic year");
}

function feeLines(report: Report): string[] {
  const lines = report.components.map((c) => {
    const name = c.label ? `${FEE_KIND_LABELS[c.kind]} (${c.label})` : FEE_KIND_LABELS[c.kind];
    const yearly =
      c.frequency !== "one_time" && c.frequency !== "yearly" ? ` = ${formatRupees(annualAmount(c))} a year` : "";
    return `   - ${name}: ${formatRupees(c.amount)}, ${FEE_FREQUENCY_LABELS[c.frequency].toLowerCase()}${yearly}`;
  });
  const total = yearOneCost(report);
  if (total !== null) lines.push(`   Total for the first year: ${formatRupees(total)}`);
  if (report.hikePercent !== null) lines.push(`   Increase over last year: ${report.hikePercent}%`);
  return lines;
}

function signature(parent: ParentDetails): string {
  return [
    "Yours faithfully,",
    "",
    parent.name || BLANK("Your name"),
    parent.address || BLANK("Your address"),
    parent.contact || BLANK("Phone or email"),
  ].join("\n");
}

function header(to: string[], input: LetterInput): string {
  return ["To,", ...to, "", `Date: ${input.date}`].join("\n");
}

export function buildLetter(kind: LetterKind, input: LetterInput): string {
  switch (kind) {
    case "breakdown":
      return breakdownLetter(input);
    case "complaint":
      return complaintLetter(input);
    case "rti":
      return rtiLetter(input);
  }
}

function breakdownLetter(input: LetterInput): string {
  const { report, institution } = input;
  const flagKinds = new Set(report.flags.map((f) => f.kind));
  const asks = [
    `The complete fee structure for ${classAndYear(report)}, listing every fee item, its amount, and whether it is charged once, yearly, per term or monthly.`,
    `The fee structure for the same class for ${previousYear(report)}, for comparison.`,
    "Which of these items are compulsory, and the basis on which each is charged.",
    "A receipt for every payment made.",
  ];
  if (flagKinds.has("donation_capitation")) {
    asks.push("Whether the amount described as a donation or contribution is voluntary, and what it is used for.");
  }
  if (flagKinds.has("forced_purchase")) {
    asks.push("Whether books, uniform and other items may be bought from any shop of our choice.");
  }
  if (flagKinds.has("no_receipt")) {
    asks.push("A receipt for payments already made, and confirmation that fees can be paid by bank transfer or cheque.");
  }

  return [
    header(["The Principal / Head of the Institution", institution.name, `${institution.city}, ${institution.state}`], input),
    "",
    `Subject: Request for the itemised fee structure for ${classAndYear(report)}`,
    "",
    "Respected Sir / Madam,",
    "",
    `I am the parent / guardian of a student or applicant for ${classAndYear(report)}. I request you to kindly give me the following in writing:`,
    "",
    ...asks.map((ask, i) => `${i + 1}. ${ask}`),
    "",
    "I would be grateful for a written reply within 15 days.",
    "",
    signature(input.parent),
  ].join("\n");
}

function complaintLetter(input: LetterInput): string {
  const { report, institution } = input;
  const flags = report.flags.map((f) => `   - ${FLAG_LABELS[f.kind]}${f.note ? `: ${f.note}` : ""}`);
  const admission = report.admissionType ? ` (${ADMISSION_TYPE_LABELS[report.admissionType].toLowerCase()})` : "";

  return [
    header([input.authorityName ?? BLANK("Name and address of the office you are writing to")], input),
    "",
    `Subject: Complaint regarding fees demanded by ${institution.name}, ${institution.city}`,
    "",
    "Respected Sir / Madam,",
    "",
    `I wish to bring to your notice the fees demanded by ${institution.name}, ${institution.city}, ${institution.state}${institution.board ? ` (${institution.board})` : ""}, for ${classAndYear(report)}${admission}.`,
    "",
    "1. The fees demanded were:",
    ...(feeLines(report).length > 0 ? feeLines(report) : ["   " + BLANK("List each fee item and amount")]),
    "",
    ...(flags.length > 0
      ? ["2. The following may not be in line with the rules that apply to the institution:", ...flags, ""]
      : []),
    `${flags.length > 0 ? 3 : 2}. ${BLANK("Describe briefly what happened, when, and whether you paid")}`,
    "",
    "I request you to examine whether these fees are in accordance with the applicable rules and with the fee approved for the institution, to take appropriate action, and to inform me of the action taken.",
    "",
    "Copies of the fee receipts / circulars are attached.",
    ...(input.reportUrl ? ["", `A public record of these fees: ${input.reportUrl}`] : []),
    "",
    signature(input.parent),
  ].join("\n");
}

function rtiLetter(input: LetterInput): string {
  const { report, institution } = input;
  const years = `${previousYear(report)} and ${report.academicYear ?? BLANK("academic year")}`;
  const items = [
    `A copy of the fee structure submitted by, or approved for, ${institution.name}, ${institution.city}, for the academic years ${years}, for ${report.classOrCourse ?? "all classes / courses"}.`,
    `Copies of any orders or decisions of any fee regulatory authority or committee relating to the fees of this institution for the academic years ${years}.`,
    `The number of complaints received about the fees of this institution since ${previousYear(report)}, and the action taken on each.`,
  ];
  if (institution.type === "school") {
    items.push(
      `The number of seats reserved and the number filled under Section 12(1)(c) of the Right of Children to Free and Compulsory Education Act, 2009 in this school for ${report.academicYear ?? BLANK("academic year")}.`,
    );
  }

  return [
    header(
      [
        "The Public Information Officer",
        input.authorityName ?? BLANK("Name and address of the education department office responsible for this institution"),
      ],
      input,
    ),
    "",
    "Subject: Application under Section 6(1) of the Right to Information Act, 2005",
    "",
    `1. Name of applicant: ${input.parent.name || BLANK("Your name")}`,
    `2. Address for correspondence: ${input.parent.address || BLANK("Your address")}`,
    "3. Information sought:",
    ...items.map((item, i) => `   (${String.fromCharCode(97 + i)}) ${item}`),
    `4. Period: academic years ${years}.`,
    `5. Application fee: ${BLANK("How you paid the fee — postal order, demand draft, court-fee stamp or online. The amount depends on whether the office is under the central or a state government. If you hold a BPL card, attach a copy instead.")}`,
    "6. I am a citizen of India. Please provide the information in paper / electronic form.",
    "",
    `Place: ${BLANK("Place")}`,
    "",
    signature(input.parent),
  ].join("\n");
}

// Text for the "Email this report" Gmail draft.
export function emailDraft(report: Report, institution: Institution, reportUrl: string): { subject: string; body: string } {
  const what = [report.classOrCourse, report.academicYear].filter(Boolean).join(", ");
  const total = yearOneCost(report);
  const flags = report.flags.map((f) => `- ${FLAG_LABELS[f.kind]}`);
  return {
    subject: `Fee report: ${institution.name}, ${institution.city}${what ? ` — ${what}` : ""}`,
    body: [
      `A parent reported the fees demanded by ${institution.name}, ${institution.city}, ${institution.state}${what ? ` for ${what}` : ""}.`,
      "",
      ...(total !== null ? [`First-year cost: ${formatRupees(total)}`] : []),
      ...(report.hikePercent !== null ? [`Hike over last year: ${report.hikePercent}%`] : []),
      ...(flags.length > 0 ? ["", "Items that may be questionable:", ...flags] : []),
      "",
      `Full report and evidence: ${reportUrl}`,
      "",
      "Reported anonymously on FeeLeaks. Reports are submitted by users and not verified by FeeLeaks.",
    ].join("\n"),
  };
}

export function gmailComposeUrl(to: string[], subject: string, body: string): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", su: subject, body });
  if (to.length > 0) params.set("to", to.join(","));
  return `https://mail.google.com/mail/?${params.toString()}`;
}
