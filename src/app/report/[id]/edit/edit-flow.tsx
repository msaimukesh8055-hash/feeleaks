// src/app/report/[id]/edit/edit-flow.tsx
// Editing a published report from the browser that wrote it.

"use client";

import { useState, useTransition } from "react";
import { ReportEditor } from "@/components/report-editor";
import { primaryButton } from "@/components/ui";
import type { ReportDraft } from "@/lib/report-schema";
import type { InstitutionOption } from "@/lib/types";
import { updateReport } from "../../actions";

export function EditFlow({
  reportId,
  initialDraft,
  institution,
}: {
  reportId: string;
  initialDraft: ReportDraft;
  institution: InstitutionOption;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [candidates, setCandidates] = useState<InstitutionOption[]>([institution]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateReport(reportId, JSON.stringify(draft));
      if (result?.error) setError(result.error);
    });
  }

  const chosen =
    draft.institution.mode === "existing"
      ? (candidates.find((c) => draft.institution.mode === "existing" && c.id === draft.institution.id) ?? null)
      : null;

  return (
    <div className="space-y-5">
      <ReportEditor
        draft={draft}
        onChange={setDraft}
        candidates={candidates}
        onCandidatesChange={setCandidates}
        chosenInstitution={chosen}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="button" onClick={handleSave} disabled={pending} className={primaryButton}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
