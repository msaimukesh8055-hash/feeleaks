// src/lib/ai/structure.ts
// Turns a reporter's free text into structured fee fields with Claude Haiku 4.5,
// and picks the matching institution from FeeLeaks' existing pages. Server only.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { feeComponentSchema, flagSchema } from "../report-schema";
import {
  ADMISSION_TYPES,
  INSTITUTION_TYPES,
  type Institution,
  type InstitutionInput,
  type ReportFields,
} from "../types";

const MODEL = "claude-haiku-4-5";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 2 });
  return client;
}

const extractionSchema = z.object({
  institution: z.object({
    name: z.string().describe("Institution name as written, with obvious spelling fixed. Empty if not mentioned."),
    type: z.enum(INSTITUTION_TYPES),
    city: z.string().describe("City, empty if not mentioned"),
    state: z.string().describe("Indian state, empty if it can't be told from the text or city"),
    board: z.string().nullable().describe("Board or affiliation (CBSE, ICSE, IB, state board, university) if mentioned"),
  }),
  academicYear: z.string().nullable().describe("Form 2026-27, or null"),
  classOrCourse: z.string().nullable(),
  admissionType: z.enum(ADMISSION_TYPES).nullable(),
  components: z.array(feeComponentSchema),
  reportedTotal: z.number().int().nullable(),
  hikePercent: z.number().nullable(),
  flags: z.array(flagSchema),
});

function systemPrompt(today: string): string {
  return `You structure fee reports written by parents and students in India for FeeLeaks, a public fee-transparency site. Today is ${today}.

Read the report and fill in the fields. Rules:
- Use only what the report says. Never invent or estimate institutions, amounts, years or details. If something isn't stated, use null (or an empty string / empty list where the field requires it).
- Amounts are whole rupees. Convert Indian units: "2.5 lakh" = 250000, "1.2 L" = 120000, "1 crore" = 10000000, "45k" = 45000.
- Each fee component gets the amount per payment and how often it is charged: one_time (admission, donation, caution deposit, one-off charges), yearly, half_yearly (per semester), quarterly (per quarter or per term when there are four), monthly. If a fee is charged per term with three terms a year, multiply to a yearly amount and say so in the label. If frequency isn't stated, use yearly for tuition-like fees and one_time for admission or donation.
- Component kinds: tuition, admission, development (development fund, building fund, infrastructure), donation (donation, capitation, "voluntary" contribution demanded for admission), transport, books_uniform, hostel, exam, other. Put the reporter's own name for the item in label when it adds information.
- reportedTotal is the total the reporter states for the first year, if they state one. Do not add it up yourself.
- hikePercent is the increase over last year as stated, or worked out only if the report gives both last year's and this year's figure for the same fee.
- academicYear uses the form 2026-27. "This year" means the academic year in progress or about to start on today's date. Otherwise null if not stated.
- classOrCourse uses a short standard form: Nursery, LKG, UKG, Grade 1 … Grade 12, or the course (B.Tech CSE, MBBS, NEET coaching). Never include a section, division or roll number.
- admissionType: new, continuing, management_quota, rte_ews (RTE / EWS / 25% quota seat) or other.
- flags mark fee items that may break existing rules, only when the report clearly describes them: donation_capitation (donation or capitation demanded for admission), no_receipt (cash only, or no receipt given), forced_purchase (must buy books, uniform or other items from the institution or a named vendor), fee_on_rte_seat (fee charged on an RTE/EWS seat), refund_refused (refund refused or withheld), unapproved_hike (hike announced without notice or explanation). Give a short note quoting what the report says, without personal details.
- Never copy names of children or parents, phone numbers or email addresses into any field.`;
}

export type Extraction = {
  institution: InstitutionInput;
  fields: ReportFields;
};

export async function extractReport(text: string, today: string): Promise<Extraction> {
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system: systemPrompt(today),
    messages: [{ role: "user", content: `<report>\n${text}\n</report>` }],
    output_config: { format: zodOutputFormat(extractionSchema) },
  });
  const out = response.parsed_output;
  if (!out) throw new Error(`AI structuring failed (stop reason: ${response.stop_reason})`);

  return {
    institution: {
      name: out.institution.name.trim(),
      type: out.institution.type,
      city: out.institution.city.trim(),
      state: out.institution.state.trim(),
      board: out.institution.board?.trim() || null,
    },
    fields: {
      academicYear: out.academicYear && /^\d{4}-\d{2}$/.test(out.academicYear) ? out.academicYear : null,
      classOrCourse: out.classOrCourse?.trim() || null,
      admissionType: out.admissionType,
      components: out.components.filter((c) => c.amount > 0),
      reportedTotal: out.reportedTotal && out.reportedTotal > 0 ? out.reportedTotal : null,
      hikePercent: out.hikePercent,
      flags: dedupeFlags(out.flags),
    },
  };
}

function dedupeFlags(flags: ReportFields["flags"]): ReportFields["flags"] {
  const seen = new Set<string>();
  return flags.filter((f) => !seen.has(f.kind) && seen.add(f.kind));
}

const matchSchema = z.object({
  matchId: z.string().nullable().describe("id of the same institution (same campus/branch), or null"),
});

// Picks which existing institution (if any) the reporter means.
export async function matchInstitution(
  written: InstitutionInput,
  candidates: Institution[],
): Promise<string | null> {
  if (candidates.length === 0) return null;
  const list = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    otherSpellings: c.aliases,
    type: c.type,
    city: c.city,
    state: c.state,
    board: c.board,
  }));
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 300,
    system:
      "You decide whether a fee report is about an institution already listed on FeeLeaks. Match only if it is clearly the same institution and the same campus or branch (same city). Different branches of a chain are different institutions. Abbreviations and spelling differences are fine. If unsure, return null.",
    messages: [
      {
        role: "user",
        content: `Institution in the report:\n${JSON.stringify(written)}\n\nListed institutions:\n${JSON.stringify(list)}`,
      },
    ],
    output_config: { format: zodOutputFormat(matchSchema) },
  });
  const id = response.parsed_output?.matchId ?? null;
  return candidates.some((c) => c.id === id) ? id : null;
}
