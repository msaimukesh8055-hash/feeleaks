// src/app/report/[id]/action/letter-generator.tsx
// Letter generator: the parent picks a letter, adds their own details (kept on this
// device only), edits the text, then copies, downloads or prints it.

"use client";

import { useState, type ChangeEvent } from "react";
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton, warningClass } from "@/components/ui";
import { buildLetter, LETTER_KINDS, LETTER_TITLES, type LetterKind, type ParentDetails } from "@/lib/letters";
import type { Institution, Report } from "@/lib/types";

export function LetterGenerator({
  report,
  institution,
  authorityName,
  reportUrl,
  initialKind,
}: {
  report: Report;
  institution: Institution;
  authorityName: string | null;
  reportUrl: string;
  initialKind: LetterKind;
}) {
  const [kind, setKind] = useState<LetterKind>(initialKind);
  const [parent, setParent] = useState<ParentDetails>({ name: "", address: "", contact: "" });
  const [includeLink, setIncludeLink] = useState(false);
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const generated = buildLetter(kind, {
    report,
    institution,
    authorityName,
    parent,
    date,
    reportUrl: includeLink ? reportUrl : null,
  });
  const text = edited ?? generated;

  function handleKindChange(event: ChangeEvent<HTMLSelectElement>) {
    setKind(event.target.value as LetterKind);
    setEdited(null);
  }
  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setParent({ ...parent, name: event.target.value });
    setEdited(null);
  }
  function handleAddressChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setParent({ ...parent, address: event.target.value });
    setEdited(null);
  }
  function handleContactChange(event: ChangeEvent<HTMLInputElement>) {
    setParent({ ...parent, contact: event.target.value });
    setEdited(null);
  }
  function handleIncludeLinkChange(event: ChangeEvent<HTMLInputElement>) {
    setIncludeLink(event.target.checked);
    setEdited(null);
  }
  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setEdited(event.target.value);
  }
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }
  function handleDownload() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${kind}-letter-${institution.slug}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-5">
      <div className={`${cardClass} print:hidden`}>
        <label className={labelClass} htmlFor="letter-kind">Letter</label>
        <select id="letter-kind" value={kind} onChange={handleKindChange} className={inputClass}>
          {LETTER_KINDS.map((k) => (
            <option key={k} value={k}>{LETTER_TITLES[k]}</option>
          ))}
        </select>

        <p className="mt-4 mb-2 text-sm font-medium">Your details (optional)</p>
        <p className="mb-2 text-xs text-muted">
          These stay on this phone. FeeLeaks never receives them. You can also leave them blank and write them by hand.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input aria-label="Your name" value={parent.name} onChange={handleNameChange} className={inputClass} placeholder="Your name" />
          <input aria-label="Phone or email" value={parent.contact} onChange={handleContactChange} className={inputClass} placeholder="Phone or email" />
          <textarea aria-label="Your address" value={parent.address} onChange={handleAddressChange} className={`${inputClass} sm:col-span-2`} rows={2} placeholder="Your address" />
        </div>

        {kind === "complaint" && (
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={includeLink} onChange={handleIncludeLinkChange} className="mt-1 accent-[var(--accent)]" />
            <span>
              Include a link to this report on FeeLeaks.{" "}
              <span className="text-muted">If you wrote it, this links your name to it.</span>
            </span>
          </label>
        )}
        {authorityName === null && kind !== "breakdown" && (
          <p className={`${warningClass} mt-3`}>
            We haven&apos;t added a verified office for {institution.state} yet, so the address is left blank for you to fill in.
          </p>
        )}
      </div>

      <div>
        <label className={`${labelClass} print:hidden`} htmlFor="letter-text">
          Your letter — you can edit it
        </label>
        <textarea
          id="letter-text"
          value={text}
          onChange={handleTextChange}
          rows={24}
          className={`${inputClass} font-mono text-sm print:hidden`}
        />
        <pre className="hidden whitespace-pre-wrap font-serif text-[12pt] leading-relaxed text-black print:block">{text}</pre>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={handlePrint} className={primaryButton}>Print / save as PDF</button>
        <button type="button" onClick={handleDownload} className={secondaryButton}>Download text</button>
        <button type="button" onClick={handleCopy} className={secondaryButton}>{copied ? "Copied" : "Copy"}</button>
      </div>
      <p className="text-xs text-muted print:hidden">
        This is a starting point, not legal advice. Check the facts and the office address before sending, and keep a copy.
      </p>
    </div>
  );
}
