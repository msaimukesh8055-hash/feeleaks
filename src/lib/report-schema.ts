// src/lib/report-schema.ts
// Validation schemas for report fields, shared by AI output and the publish/edit actions.

import { z } from "zod";
import {
  ADMISSION_TYPES,
  EVIDENCE_KINDS,
  FEE_FREQUENCIES,
  FEE_KINDS,
  FLAG_KINDS,
  INSTITUTION_TYPES,
} from "./types";

export const MAX_TEXT_LENGTH = 5000;
export const MIN_TEXT_LENGTH = 30;
export const MAX_COMPONENTS = 20;

const shortText = z.string().trim().max(120);
const rupees = z.number().int().min(0).max(10_00_00_00_000);

export const feeComponentSchema = z.object({
  kind: z.enum(FEE_KINDS),
  label: shortText.nullable(),
  amount: rupees,
  frequency: z.enum(FEE_FREQUENCIES),
});

export const flagSchema = z.object({
  kind: z.enum(FLAG_KINDS),
  note: z.string().trim().max(300).nullable(),
});

export const reportFieldsSchema = z.object({
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "Use the form 2026-27")
    .nullable(),
  classOrCourse: shortText.nullable(),
  admissionType: z.enum(ADMISSION_TYPES).nullable(),
  components: z.array(feeComponentSchema).max(MAX_COMPONENTS),
  reportedTotal: rupees.nullable(),
  hikePercent: z.number().min(-100).max(1000).nullable(),
  flags: z.array(flagSchema).max(FLAG_KINDS.length),
});

export const institutionInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(INSTITUTION_TYPES),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  board: shortText.nullable(),
});

// Either an institution already on FeeLeaks, or a new one.
export const institutionChoiceSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("existing"), id: z.string().uuid(), nameAsWritten: z.string().trim().max(160) }),
  z.object({ mode: z.literal("new"), institution: institutionInputSchema }),
]);

export const reportDraftSchema = z.object({
  originalText: z.string().trim().min(MIN_TEXT_LENGTH).max(MAX_TEXT_LENGTH),
  institution: institutionChoiceSchema,
  fields: reportFieldsSchema,
});

export const evidenceKindsSchema = z.array(z.enum(EVIDENCE_KINDS));

export type InstitutionChoice = z.infer<typeof institutionChoiceSchema>;
export type ReportDraft = z.infer<typeof reportDraftSchema>;
