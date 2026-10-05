// src/components/report-editor.tsx
// The structured-report editor: the reporter checks and corrects the institution,
// year, class, fee items and flags before publishing (also used to edit a report).

"use client";

import { useState, type ChangeEvent, type FocusEvent } from "react";
import { lookupInstitutions } from "@/app/leak/actions";
import { extrasShare, formatPercent, formatRupees, yearOneCost } from "@/lib/fees";
import { findIdentifyingDetails } from "@/lib/identifying";
import { STATES_AND_UTS } from "@/lib/india";
import { MAX_COMPONENTS, type ReportDraft } from "@/lib/report-schema";
import {
  ADMISSION_TYPES,
  ADMISSION_TYPE_LABELS,
  FEE_FREQUENCIES,
  FEE_FREQUENCY_LABELS,
  FEE_KINDS,
  FEE_KIND_LABELS,
  FLAG_KINDS,
  FLAG_LABELS,
  INSTITUTION_TYPES,
  INSTITUTION_TYPE_LABELS,
  type AdmissionType,
  type FeeComponent,
  type FeeFrequency,
  type FeeKind,
  type FlagKind,
  type InstitutionInput,
  type InstitutionOption,
  type InstitutionType,
  type ReportFields,
} from "@/lib/types";
import { cardClass, hintClass, inputClass, labelClass, secondaryButton, warningClass } from "./ui";

type Props = {
  draft: ReportDraft;
  onChange: (draft: ReportDraft) => void;
  candidates: InstitutionOption[];
  onCandidatesChange: (candidates: InstitutionOption[]) => void;
  // Name of the existing institution currently chosen (for display).
  chosenInstitution: InstitutionOption | null;
};

const EMPTY_INSTITUTION: InstitutionInput = { name: "", type: "school", city: "", state: "", board: null };

export function ReportEditor({ draft, onChange, candidates, onCandidatesChange, chosenInstitution }: Props) {
  function setFields(fields: ReportFields) {
    onChange({ ...draft, fields });
  }

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange({ ...draft, originalText: event.target.value });
  }

  const hints = findIdentifyingDetails(draft.originalText);

  return (
    <div className="space-y-6">
      <InstitutionSection
        draft={draft}
        onChange={onChange}
        candidates={candidates}
        onCandidatesChange={onCandidatesChange}
        chosenInstitution={chosenInstitution}
      />
      <DetailsSection fields={draft.fields} onChange={setFields} />
      <ComponentsSection fields={draft.fields} onChange={setFields} />
      <FlagsSection fields={draft.fields} onChange={setFields} />

      <section className={cardClass}>
        <h2 className="mb-2 font-semibold">Your report as written</h2>
        <p className="mb-2 text-xs text-muted">This text is published exactly as it appears here. You can still edit it.</p>
        <textarea value={draft.originalText} onChange={handleTextChange} rows={7} className={inputClass} />
        {hints.length > 0 && (
          <div className={`${warningClass} mt-3`}>
            <p className="font-semibold">These details could identify your family:</p>
            <ul className="mt-1 list-disc pl-5">
              {hints.map((hint, index) => (
                <li key={index}>
                  {hint.label}: <span className="font-mono">“{hint.match}”</span>
                </li>
              ))}
            </ul>
            <p className="mt-1">Consider removing them before you publish. Class is enough; section isn&apos;t needed.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function InstitutionSection({ draft, onChange, candidates, onCandidatesChange, chosenInstitution }: Props) {
  const [lastNew, setLastNew] = useState<InstitutionInput>(
    draft.institution.mode === "new" ? draft.institution.institution : EMPTY_INSTITUTION,
  );
  const choice = draft.institution;

  function setNew(institution: InstitutionInput) {
    setLastNew(institution);
    onChange({ ...draft, institution: { mode: "new", institution } });
  }

  function handleNotThisOne() {
    const nameAsWritten = choice.mode === "existing" ? choice.nameAsWritten : "";
    setNew({ ...lastNew, name: lastNew.name || nameAsWritten });
  }

  function handleCandidateChosen(option: InstitutionOption) {
    const nameAsWritten = choice.mode === "new" ? choice.institution.name : option.name;
    onChange({ ...draft, institution: { mode: "existing", id: option.id, nameAsWritten } });
  }

  async function handleLookup() {
    if (choice.mode !== "new") return;
    onCandidatesChange(await lookupInstitutions(choice.institution.name, choice.institution.city));
  }

  if (choice.mode === "existing") {
    return (
      <section className={cardClass}>
        <h2 className="mb-2 font-semibold">Institution</h2>
        <p className="text-lg">{chosenInstitution?.name ?? "Chosen institution"}</p>
        {chosenInstitution && (
          <p className="text-sm text-muted">
            {INSTITUTION_TYPE_LABELS[chosenInstitution.type]} · {chosenInstitution.city}, {chosenInstitution.state}
          </p>
        )}
        <p className={hintClass}>Already on FeeLeaks — your report will be added to its page.</p>
        <button type="button" onClick={handleNotThisOne} className={`${secondaryButton} mt-3`}>
          Not this one
        </button>
      </section>
    );
  }

  return (
    <section className={cardClass}>
      <h2 className="mb-3 font-semibold">Institution</h2>
      {candidates.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm">Is it one of these already on FeeLeaks?</p>
          <ul className="space-y-2">
            {candidates.map((option) => (
              <CandidateRow key={option.id} option={option} onChoose={handleCandidateChosen} />
            ))}
          </ul>
        </div>
      )}
      <NewInstitutionFields value={choice.institution} onChange={setNew} onLookup={handleLookup} />
    </section>
  );
}

function CandidateRow({ option, onChoose }: { option: InstitutionOption; onChoose: (o: InstitutionOption) => void }) {
  function handleClick() {
    onChoose(option);
  }
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border p-2">
      <div className="min-w-0">
        <p className="truncate text-sm">{option.name}</p>
        <p className="text-xs text-muted">
          {option.city}, {option.state}
        </p>
      </div>
      <button type="button" onClick={handleClick} className={secondaryButton}>
        Yes, this one
      </button>
    </li>
  );
}

function NewInstitutionFields({
  value,
  onChange,
  onLookup,
}: {
  value: InstitutionInput;
  onChange: (value: InstitutionInput) => void;
  onLookup: () => void;
}) {
  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...value, name: event.target.value });
  }
  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange({ ...value, type: event.target.value as InstitutionType });
  }
  function handleCityChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...value, city: event.target.value });
  }
  function handleStateChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...value, state: event.target.value });
  }
  function handleBoardChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...value, board: event.target.value || null });
  }
  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    if (event.target.value.trim().length >= 2) onLookup();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="inst-name">Name</label>
        <input id="inst-name" value={value.name} onChange={handleNameChange} onBlur={handleBlur} className={inputClass} placeholder="e.g. Delhi Public School, Bangalore East" />
      </div>
      <div>
        <label className={labelClass} htmlFor="inst-type">Type</label>
        <select id="inst-type" value={value.type} onChange={handleTypeChange} className={inputClass}>
          {INSTITUTION_TYPES.map((type) => (
            <option key={type} value={type}>{INSTITUTION_TYPE_LABELS[type]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="inst-board">Board / affiliation</label>
        <input id="inst-board" value={value.board ?? ""} onChange={handleBoardChange} className={inputClass} placeholder="CBSE, ICSE, IB, state board…" />
      </div>
      <div>
        <label className={labelClass} htmlFor="inst-city">City</label>
        <input id="inst-city" value={value.city} onChange={handleCityChange} onBlur={handleBlur} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="inst-state">State</label>
        <input id="inst-state" list="states-list" value={value.state} onChange={handleStateChange} className={inputClass} />
        <datalist id="states-list">
          {STATES_AND_UTS.map((state) => (
            <option key={state} value={state} />
          ))}
        </datalist>
      </div>
    </div>
  );
}

function DetailsSection({ fields, onChange }: { fields: ReportFields; onChange: (f: ReportFields) => void }) {
  function handleYearChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...fields, academicYear: event.target.value.trim() || null });
  }
  function handleClassChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...fields, classOrCourse: event.target.value || null });
  }
  function handleAdmissionChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange({ ...fields, admissionType: (event.target.value || null) as AdmissionType | null });
  }

  return (
    <section className={cardClass}>
      <h2 className="mb-3 font-semibold">Year and class</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="year">Academic year</label>
          <input id="year" value={fields.academicYear ?? ""} onChange={handleYearChange} className={inputClass} placeholder="2026-27" inputMode="numeric" />
        </div>
        <div>
          <label className={labelClass} htmlFor="class">Class / course</label>
          <input id="class" value={fields.classOrCourse ?? ""} onChange={handleClassChange} className={inputClass} placeholder="Grade 1, B.Tech CSE…" />
          <p className={hintClass}>Class only — no section.</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="admission">Admission type</label>
          <select id="admission" value={fields.admissionType ?? ""} onChange={handleAdmissionChange} className={inputClass}>
            <option value="">Not stated</option>
            {ADMISSION_TYPES.map((type) => (
              <option key={type} value={type}>{ADMISSION_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

function ComponentsSection({ fields, onChange }: { fields: ReportFields; onChange: (f: ReportFields) => void }) {
  function handleAdd() {
    onChange({
      ...fields,
      components: [...fields.components, { kind: "tuition", label: null, amount: 0, frequency: "yearly" }],
    });
  }
  function handleRowChange(index: number, component: FeeComponent) {
    onChange({ ...fields, components: fields.components.map((c, i) => (i === index ? component : c)) });
  }
  function handleRowRemove(index: number) {
    onChange({ ...fields, components: fields.components.filter((_, i) => i !== index) });
  }
  function handleTotalChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...fields, reportedTotal: parseRupees(event.target.value) });
  }
  function handleHikeChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.trim();
    onChange({ ...fields, hikePercent: value === "" || Number.isNaN(Number(value)) ? null : Number(value) });
  }

  const total = yearOneCost(fields);
  const extras = extrasShare(fields);

  return (
    <section className={cardClass}>
      <h2 className="mb-1 font-semibold">What you were asked to pay</h2>
      <p className="mb-3 text-xs text-muted">One line per fee item, with how often it is charged.</p>
      <ul className="space-y-3">
        {fields.components.map((component, index) => (
          <ComponentRow
            key={index}
            index={index}
            component={component}
            onChange={handleRowChange}
            onRemove={handleRowRemove}
          />
        ))}
      </ul>
      {fields.components.length < MAX_COMPONENTS && (
        <button type="button" onClick={handleAdd} className={`${secondaryButton} mt-3`}>
          Add fee item
        </button>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="total">Total you were told (₹, optional)</label>
          <input id="total" value={fields.reportedTotal ?? ""} onChange={handleTotalChange} className={inputClass} inputMode="numeric" placeholder="Leave empty to add up the items" />
        </div>
        <div>
          <label className={labelClass} htmlFor="hike">Hike over last year (%, optional)</label>
          <input id="hike" value={fields.hikePercent ?? ""} onChange={handleHikeChange} className={inputClass} inputMode="decimal" />
        </div>
      </div>

      {total !== null && (
        <p className="mt-4 text-sm">
          First-year cost: <strong className="text-accent">{formatRupees(total)}</strong>
          {extras !== null && <> · {formatPercent(Math.round(extras * 100))} of it is not tuition</>}
        </p>
      )}
    </section>
  );
}

function ComponentRow({
  index,
  component,
  onChange,
  onRemove,
}: {
  index: number;
  component: FeeComponent;
  onChange: (index: number, c: FeeComponent) => void;
  onRemove: (index: number) => void;
}) {
  function handleKindChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(index, { ...component, kind: event.target.value as FeeKind });
  }
  function handleLabelChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(index, { ...component, label: event.target.value || null });
  }
  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(index, { ...component, amount: parseRupees(event.target.value) ?? 0 });
  }
  function handleFrequencyChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(index, { ...component, frequency: event.target.value as FeeFrequency });
  }
  function handleRemoveClick() {
    onRemove(index);
  }

  return (
    <li className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_1fr_8rem_10rem_auto] sm:items-center">
      <select aria-label="Fee item" value={component.kind} onChange={handleKindChange} className={inputClass}>
        {FEE_KINDS.map((kind) => (
          <option key={kind} value={kind}>{FEE_KIND_LABELS[kind]}</option>
        ))}
      </select>
      <input aria-label="Description" value={component.label ?? ""} onChange={handleLabelChange} className={inputClass} placeholder="Description (optional)" />
      <input aria-label="Amount in rupees" value={component.amount || ""} onChange={handleAmountChange} className={inputClass} inputMode="numeric" placeholder="₹" />
      <select aria-label="How often" value={component.frequency} onChange={handleFrequencyChange} className={inputClass}>
        {FEE_FREQUENCIES.map((frequency) => (
          <option key={frequency} value={frequency}>{FEE_FREQUENCY_LABELS[frequency]}</option>
        ))}
      </select>
      <button type="button" onClick={handleRemoveClick} className="col-span-2 text-sm text-muted hover:text-foreground sm:col-span-1">
        Remove
      </button>
    </li>
  );
}

function FlagsSection({ fields, onChange }: { fields: ReportFields; onChange: (f: ReportFields) => void }) {
  function handleToggle(kind: FlagKind, on: boolean) {
    const others = fields.flags.filter((f) => f.kind !== kind);
    onChange({ ...fields, flags: on ? [...others, { kind, note: null }] : others });
  }
  function handleNote(kind: FlagKind, note: string) {
    onChange({ ...fields, flags: fields.flags.map((f) => (f.kind === kind ? { ...f, note: note || null } : f)) });
  }

  return (
    <section className={cardClass}>
      <h2 className="mb-1 font-semibold">Anything that may be questionable?</h2>
      <p className="mb-3 text-xs text-muted">
        Tick what happened to you. These are shown as &quot;may be questionable&quot; with the rule, where we have one.
      </p>
      <ul className="space-y-2">
        {FLAG_KINDS.map((kind) => (
          <FlagRow
            key={kind}
            kind={kind}
            flag={fields.flags.find((f) => f.kind === kind) ?? null}
            onToggle={handleToggle}
            onNote={handleNote}
          />
        ))}
      </ul>
    </section>
  );
}

function FlagRow({
  kind,
  flag,
  onToggle,
  onNote,
}: {
  kind: FlagKind;
  flag: { note: string | null } | null;
  onToggle: (kind: FlagKind, on: boolean) => void;
  onNote: (kind: FlagKind, note: string) => void;
}) {
  function handleCheck(event: ChangeEvent<HTMLInputElement>) {
    onToggle(kind, event.target.checked);
  }
  function handleNoteChange(event: ChangeEvent<HTMLInputElement>) {
    onNote(kind, event.target.value);
  }
  return (
    <li>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={flag !== null} onChange={handleCheck} className="mt-1 accent-[var(--accent)]" />
        <span>{FLAG_LABELS[kind]}</span>
      </label>
      {flag && (
        <input
          aria-label="What happened"
          value={flag.note ?? ""}
          onChange={handleNoteChange}
          className={`${inputClass} mt-1 text-sm`}
          placeholder="What happened, in a few words (no names)"
        />
      )}
    </li>
  );
}

// Accepts "1,20,000", "120000", "₹ 1.2 lakh" is not parsed — digits only.
function parseRupees(value: string): number | null {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}
