// src/app/leak/actions.ts
// Server actions for writing a report: AI structuring, institution lookup and publishing.

"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { aiEnabled, extractReport, matchInstitution } from "@/lib/ai/structure";
import {
  MAX_EVIDENCE_FILES,
  MAX_EVIDENCE_TOTAL_BYTES,
  sniffType,
  stripJpegMetadata,
} from "@/lib/evidence";
import { ownerKey, requireIdentity, takeFreshName } from "@/lib/identity/session";
import { findCandidates } from "@/lib/matching";
import { notifyFollowers } from "@/lib/push";
import { allow } from "@/lib/rate-limit";
import {
  MAX_TEXT_LENGTH,
  MIN_TEXT_LENGTH,
  evidenceKindsSchema,
  reportDraftSchema,
  type ReportDraft,
} from "@/lib/report-schema";
import { institutionOptions, resolveInstitution, toOption } from "@/lib/reports";
import { canSaveReports, getStore } from "@/lib/store";
import type { NewEvidenceFile } from "@/lib/store/types";
import type { InstitutionOption, ReportFields } from "@/lib/types";

const HOUR = 60 * 60 * 1000;

const EMPTY_FIELDS: ReportFields = {
  academicYear: null,
  classOrCourse: null,
  admissionType: null,
  components: [],
  reportedTotal: null,
  hikePercent: null,
  flags: [],
};

export type StructureResult =
  | {
      ok: true;
      draft: ReportDraft;
      candidates: InstitutionOption[];
      ai: "used" | "off" | "failed";
    }
  | { ok: false; error: string };

export async function structureReport(text: string): Promise<StructureResult> {
  const identity = await requireIdentity();
  const originalText = String(text ?? "").trim();
  if (originalText.length < MIN_TEXT_LENGTH) {
    return { ok: false, error: `Please write a little more (at least ${MIN_TEXT_LENGTH} characters).` };
  }
  if (originalText.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: `Please keep it under ${MAX_TEXT_LENGTH} characters.` };
  }

  const manual: StructureResult = {
    ok: true,
    draft: {
      originalText,
      institution: { mode: "new", institution: { name: "", type: "school", city: "", state: "", board: null } },
      fields: EMPTY_FIELDS,
    },
    candidates: [],
    ai: "off",
  };
  if (!aiEnabled()) return manual;
  if (!allow(`structure:${identity.deviceId}`, 20, HOUR)) {
    return { ok: false, error: "Too many reports from this browser in the last hour. Please try again later." };
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const extraction = await extractReport(originalText, today);
    const all = await getStore().listInstitutions();
    const candidates = findCandidates(all, extraction.institution.name, extraction.institution.city || null).map(
      (c) => c.institution,
    );
    const matchId = extraction.institution.name
      ? await matchInstitution(extraction.institution, candidates)
      : null;
    return {
      ok: true,
      draft: {
        originalText,
        institution: matchId
          ? { mode: "existing", id: matchId, nameAsWritten: extraction.institution.name }
          : { mode: "new", institution: extraction.institution },
        fields: extraction.fields,
      },
      candidates: candidates.map(toOption),
      ai: "used",
    };
  } catch (error) {
    console.error("AI structuring failed", error);
    return { ...manual, ai: "failed" };
  }
}

export async function lookupInstitutions(name: string, city: string): Promise<InstitutionOption[]> {
  return institutionOptions(String(name ?? ""), String(city ?? "") || null);
}

export type PublishResult = { ok: false; error: string };

export async function publishReport(formData: FormData): Promise<PublishResult> {
  const identity = await requireIdentity();
  if (!canSaveReports()) return { ok: false, error: "Publishing is switched off on the live site until the database is connected. Nothing was saved." };
  if (!allow(`publish:${identity.deviceId}`, 10, HOUR)) {
    return { ok: false, error: "Too many reports from this browser in the last hour. Please try again later." };
  }

  const parsed = reportDraftSchema.safeParse(safeJson(formData.get("draft")));
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };
  const draft = parsed.data;

  const files = formData.getAll("evidence").filter((f): f is File => f instanceof File && f.size > 0);
  const kinds = evidenceKindsSchema.safeParse(safeJson(formData.get("evidenceKinds")));
  if (files.length > MAX_EVIDENCE_FILES) return { ok: false, error: `Attach at most ${MAX_EVIDENCE_FILES} files.` };
  if (!kinds.success || kinds.data.length !== files.length) return { ok: false, error: "Evidence details are missing." };
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_EVIDENCE_TOTAL_BYTES) {
    return { ok: false, error: "Evidence files are too large together. Please attach fewer or smaller files." };
  }

  const evidence: NewEvidenceFile[] = [];
  for (const [index, file] of files.entries()) {
    const raw = new Uint8Array(await file.arrayBuffer());
    const type = sniffType(raw);
    const bytes = type === "image/jpeg" ? stripJpegMetadata(raw) : raw;
    if (!type || !bytes) return { ok: false, error: "Evidence must be a photo or a PDF." };
    evidence.push({ kind: kinds.data[index], mimeType: type, bytes });
  }

  let reportId: string;
  let institutionId: string;
  try {
    const institution = await resolveInstitution(draft.institution);
    institutionId = institution.id;
    reportId = randomUUID();
    const username = formData.get("freshName") === "1" ? await takeFreshName() : identity.names[0];
    await getStore().createReport(
      {
        id: reportId,
        institutionId,
        username,
        originalText: draft.originalText,
        fields: draft.fields,
        ownerKey: ownerKey(identity, reportId),
      },
      evidence,
    );
  } catch (error) {
    console.error("Publishing failed", error);
    return { ok: false, error: error instanceof Error ? error.message : "Publishing failed. Please try again." };
  }

  after(() => notifyFollowers(institutionId, reportId));
  redirect(`/report/${reportId}?published=1`);
}

function safeJson(value: FormDataEntryValue | null): unknown {
  try {
    return typeof value === "string" ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function firstIssue(issues: { path: PropertyKey[]; message: string }[]): string {
  const issue = issues[0];
  if (!issue) return "Something in the report isn't valid.";
  const where = issue.path.map(String).join(" › ");
  return `Please check ${where || "the report"}: ${issue.message}`;
}
