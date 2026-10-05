// src/data/types.ts
// Types for the sourced accountability data. Every entry must carry an official source.

import type { FlagKind, InstitutionType } from "@/lib/types";

type Sourced = {
  sourceName: string; // e.g. "Right of Children to Free and Compulsory Education Act, 2009"
  sourceUrl: string; // official link (government, board or court website)
  verifiedOn: string; // "2026-10-05" — when the owner last checked the source
};

// A rule a fee item may break. state/board null = applies everywhere.
export type Rule = Sourced & {
  id: string;
  title: string;
  summary: string; // plain-English, says "may", never "illegal"
  flagKinds: FlagKind[];
  states: string[] | null;
  boards: string[] | null;
  institutionTypes: InstitutionType[] | null;
};

// Who a parent can complain to.
export type Authority = Sourced & {
  id: string;
  name: string; // e.g. "District Education Officer"
  howTo: string; // how to complain, in one or two sentences
  contactUrl: string | null;
  states: string[] | null;
  boards: string[] | null;
  institutionTypes: InstitutionType[] | null;
};

// An institution's own published fee.
export type DeclaredFee = Sourced & {
  institutionSlug: string;
  academicYear: string;
  classOrCourse: string;
  yearlyTotal: number; // rupees
};

// Official consumer price inflation for a year.
export type InflationFigure = Sourced & {
  year: string; // e.g. "2025-26"
  percent: number;
};

// Journalists, MPs and MLAs for the email button. Owner-provided only.
export type Recipient = {
  name: string;
  role: "journalist" | "mp" | "mla";
  email: string;
  states: string[] | null;
};
