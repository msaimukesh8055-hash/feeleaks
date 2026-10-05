// src/app/report/actions.ts
// Server actions on a published report: "Me too", edit and delete (own reports only).

"use server";

import { redirect } from "next/navigation";
import { meTooKey, ownerKey, requireIdentity } from "@/lib/identity/session";
import { allow } from "@/lib/rate-limit";
import { reportDraftSchema } from "@/lib/report-schema";
import { resolveInstitution } from "@/lib/reports";
import { canSaveReports, getStore } from "@/lib/store";

export async function setMeToo(reportId: string, on: boolean): Promise<{ count: number } | { error: string }> {
  const identity = await requireIdentity();
  const store = getStore();
  if (!canSaveReports()) return { error: "Not available until the database is connected." };
  if (!allow(`metoo:${identity.deviceId}`, 60, 60 * 60 * 1000)) return { error: "Please slow down." };
  if (await store.isReportOwner(reportId, ownerKey(identity, reportId))) {
    return { error: "You wrote this report." };
  }
  try {
    return { count: await store.setMeToo(reportId, meTooKey(identity, reportId), Boolean(on)) };
  } catch {
    return { error: "This report no longer exists." };
  }
}

async function assertOwner(reportId: string) {
  const identity = await requireIdentity();
  if (!(await getStore().isReportOwner(reportId, ownerKey(identity, reportId)))) {
    throw new Error("Only the browser that wrote this report can change it.");
  }
}

export async function updateReport(reportId: string, draftJson: string): Promise<{ error: string }> {
  try {
    await assertOwner(reportId);
    const parsed = reportDraftSchema.safeParse(JSON.parse(draftJson));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Something isn't valid." };
    const institution = await resolveInstitution(parsed.data.institution);
    await getStore().updateReport(reportId, institution.id, parsed.data.originalText, parsed.data.fields);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Saving failed." };
  }
  redirect(`/report/${reportId}`);
}

export async function deleteReport(reportId: string): Promise<{ error: string }> {
  try {
    await assertOwner(reportId);
    await getStore().deleteReport(reportId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Deleting failed." };
  }
  redirect("/?deleted=1");
}
