// src/app/report/[id]/edit/page.tsx
// Edit page for a report, only for the browser that wrote it.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ownerKey, readIdentity } from "@/lib/identity/session";
import { toOption } from "@/lib/reports";
import { getStore } from "@/lib/store";
import { EditFlow } from "./edit-flow";

export const metadata: Metadata = { title: "Edit report", robots: { index: false } };

export default async function EditReportPage(props: PageProps<"/report/[id]/edit">) {
  const { id } = await props.params;
  const store = getStore();
  const report = await store.getReport(id);
  const identity = await readIdentity();
  if (!report || !identity || !(await store.isReportOwner(id, ownerKey(identity, id)))) notFound();

  const { academicYear, classOrCourse, admissionType, components, reportedTotal, hikePercent, flags } = report;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Edit your report</h1>
      <EditFlow
        reportId={report.id}
        institution={toOption(report.institution)}
        initialDraft={{
          originalText: report.originalText,
          institution: { mode: "existing", id: report.institution.id, nameAsWritten: report.institution.name },
          fields: { academicYear, classOrCourse, admissionType, components, reportedTotal, hikePercent, flags },
        }}
      />
    </div>
  );
}
