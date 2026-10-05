// src/app/leak/leak-flow.tsx
// The two-step "Leak a fee" flow: write the report (+ evidence), then review the
// structured version and publish.

"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { EvidencePicker, type EvidenceItem } from "@/components/evidence-picker";
import { ReportEditor } from "@/components/report-editor";
import { cardClass, inputClass, primaryButton, secondaryButton, warningClass } from "@/components/ui";
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH, type ReportDraft } from "@/lib/report-schema";
import type { InstitutionOption } from "@/lib/types";
import { publishReport, structureReport } from "./actions";

const PROMPTS = [
  "Which institution, and which city?",
  "Which academic year and class or course?",
  "What were you asked to pay — each fee and how often?",
  "Anything else: hikes, donations, no receipts, forced purchases?",
];

export function LeakFlow({ aiEnabled, username }: { aiEnabled: boolean; username: string }) {
  const [text, setText] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [candidates, setCandidates] = useState<InstitutionOption[]>([]);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [freshName, setFreshName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
  }

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await structureReport(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft(result.draft);
      setCandidates(result.candidates);
      setAiNote(
        result.ai === "used"
          ? "We've filled this in from your report. Please check every field and correct anything that's wrong."
          : result.ai === "failed"
            ? "Automatic filling didn't work this time. Please fill in the details below."
            : "Please fill in the details below.",
      );
      window.scrollTo({ top: 0 });
    });
  }

  function handleBack() {
    if (draft) setText(draft.originalText);
    setDraft(null);
    setError(null);
  }

  function handleFreshNameChange(event: ChangeEvent<HTMLInputElement>) {
    setFreshName(event.target.checked);
  }

  function handlePublish() {
    if (!draft) return;
    const problem = checkDraft(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("draft", JSON.stringify(draft));
    formData.set("freshName", freshName ? "1" : "0");
    formData.set("evidenceKinds", JSON.stringify(evidence.map((item) => item.kind)));
    for (const item of evidence) formData.append("evidence", item.blob, item.name);
    startTransition(async () => {
      const result = await publishReport(formData);
      if (result && !result.ok) setError(result.error);
    });
  }

  if (!draft) {
    return (
      <div className="space-y-5">
        <div className={cardClass}>
          <label htmlFor="report-text" className="mb-2 block font-semibold">
            Tell us what you were asked to pay
          </label>
          <ul className="mb-3 list-disc pl-5 text-sm text-muted">
            {PROMPTS.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
          <textarea
            id="report-text"
            value={text}
            onChange={handleTextChange}
            rows={9}
            maxLength={MAX_TEXT_LENGTH}
            className={inputClass}
            placeholder="e.g. ABC Public School, Whitefield, Bengaluru (CBSE). For Grade 1 in 2026-27 they asked ₹55,000 admission fee one-time, ₹1,40,000 tuition per year, ₹35,000 transport, and ₹25,000 for books and uniform which we must buy from the school. Tuition went up 18% from last year."
          />
          <p className="mt-1 text-right text-xs text-muted">
            {text.length}/{MAX_TEXT_LENGTH}
          </p>
          <p className={`${warningClass} mt-2`}>
            Don&apos;t include your name, your child&apos;s name, section, roll number or phone number.
          </p>
        </div>

        <div className={cardClass}>
          <EvidencePicker items={evidence} onChange={setEvidence} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleContinue}
          disabled={pending || text.trim().length < MIN_TEXT_LENGTH}
          className={`${primaryButton} w-full sm:w-auto`}
        >
          {pending ? (aiEnabled ? "Reading your report…" : "Continuing…") : "Continue"}
        </button>
      </div>
    );
  }

  const chosenInstitution =
    draft.institution.mode === "existing"
      ? (candidates.find((c) => draft.institution.mode === "existing" && c.id === draft.institution.id) ?? null)
      : null;

  return (
    <div className="space-y-5">
      {aiNote && <p className="text-sm text-muted">{aiNote}</p>}
      <ReportEditor
        draft={draft}
        onChange={setDraft}
        candidates={candidates}
        onCandidatesChange={setCandidates}
        chosenInstitution={chosenInstitution}
      />

      <section className={cardClass}>
        <h2 className="mb-2 font-semibold">Your anonymous name</h2>
        <p className="text-sm">
          This report will appear as <span className="font-mono text-accent">{freshName ? "a brand-new name" : username}</span>.
        </p>
        <label className="mt-2 flex items-start gap-2 text-sm">
          <input type="checkbox" checked={freshName} onChange={handleFreshNameChange} className="mt-1 accent-[var(--accent)]" />
          <span>
            Post under a fresh name, so this report can&apos;t be linked to your other reports.
          </span>
        </label>
        {evidence.length > 0 && (
          <p className="mt-3 text-xs text-muted">{evidence.length} evidence file(s) will be published with this report.</p>
        )}
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handlePublish} disabled={pending} className={primaryButton}>
          {pending ? "Publishing…" : "Publish report"}
        </button>
        <button type="button" onClick={handleBack} disabled={pending} className={secondaryButton}>
          Back
        </button>
      </div>
      <p className="text-xs text-muted">
        Reports are published immediately and are not verified by FeeLeaks. Only publish what you were actually asked to pay.
      </p>
    </div>
  );
}

// Friendly checks before sending; the server checks again.
function checkDraft(draft: ReportDraft): string | null {
  if (draft.institution.mode === "new") {
    const i = draft.institution.institution;
    if (i.name.trim().length < 2) return "Please enter the institution's name.";
    if (i.city.trim().length < 2) return "Please enter the city.";
    if (i.state.trim().length < 2) return "Please enter the state.";
  }
  if (draft.fields.academicYear && !/^\d{4}-\d{2}$/.test(draft.fields.academicYear)) {
    return "Please write the academic year like 2026-27.";
  }
  if (draft.fields.components.length === 0 && draft.fields.reportedTotal === null) {
    return "Please add at least one fee item or the total you were asked to pay.";
  }
  if (draft.fields.components.some((c) => c.amount <= 0)) return "Every fee item needs an amount.";
  if (draft.originalText.trim().length < MIN_TEXT_LENGTH) return "Your report text is too short.";
  return null;
}
