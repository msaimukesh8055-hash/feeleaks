// src/components/evidence-picker.tsx
// Lets the reporter attach photos or PDFs as evidence, with a warning to hide personal details.

"use client";

import { useState, type ChangeEvent } from "react";
import { compressImage } from "@/lib/client/compress";
import { ACCEPTED_EVIDENCE, MAX_EVIDENCE_FILES, MAX_EVIDENCE_TOTAL_BYTES } from "@/lib/evidence";
import { EVIDENCE_KINDS, EVIDENCE_KIND_LABELS, type EvidenceKind } from "@/lib/types";
import { inputClass, warningClass } from "./ui";

export type EvidenceItem = {
  id: string;
  name: string;
  blob: Blob;
  kind: EvidenceKind;
  previewUrl: string | null;
};

const MAX_PDF_BYTES = 2 * 1024 * 1024;

export function EvidencePicker({
  items,
  onChange,
}: {
  items: EvidenceItem[];
  onChange: (items: EvidenceItem[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    const added: EvidenceItem[] = [];
    try {
      for (const file of files.slice(0, MAX_EVIDENCE_FILES - items.length)) {
        if (file.type === "application/pdf") {
          if (file.size > MAX_PDF_BYTES) {
            setError(`${file.name} is larger than 2 MB. Try a photo of the page instead.`);
            continue;
          }
          added.push({ id: crypto.randomUUID(), name: file.name, blob: file, kind: "receipt", previewUrl: null });
        } else if (file.type.startsWith("image/")) {
          const blob = await compressImage(file);
          added.push({
            id: crypto.randomUUID(),
            name: file.name,
            blob,
            kind: "receipt",
            previewUrl: URL.createObjectURL(blob),
          });
        } else {
          setError(`${file.name} isn't a photo or PDF.`);
        }
      }
    } catch {
      setError("One of the photos couldn't be read. Try taking a screenshot of it instead.");
    } finally {
      setBusy(false);
    }
    const next = [...items, ...added];
    if (next.reduce((sum, item) => sum + item.blob.size, 0) > MAX_EVIDENCE_TOTAL_BYTES) {
      setError("These files are too large together. Please attach fewer files.");
      for (const item of added) if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return;
    }
    onChange(next);
  }

  function handleItemChange(updated: EvidenceItem) {
    onChange(items.map((item) => (item.id === updated.id ? updated : item)));
  }

  function handleItemRemove(removed: EvidenceItem) {
    if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    onChange(items.filter((item) => item.id !== removed.id));
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium">Evidence (optional)</p>
      <p className="mb-2 text-xs text-muted">
        Fee receipts, circulars or messages. Up to {MAX_EVIDENCE_FILES} photos or PDFs. Evidence is shown
        publicly with your report.
      </p>
      <div className={warningClass}>
        <strong>Before you upload:</strong> cover or crop out children&apos;s names, roll numbers, parents&apos;
        names, phone numbers, signatures and addresses. Photos are shrunk and their hidden location data is
        removed, but anything visible in the picture stays visible. PDFs are uploaded unchanged and can carry
        hidden details such as the author&apos;s name; if unsure, upload a screenshot instead.
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <EvidenceRow key={item.id} item={item} onChange={handleItemChange} onRemove={handleItemRemove} />
          ))}
        </ul>
      )}

      {items.length < MAX_EVIDENCE_FILES && (
        <label className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-full border border-border px-4 text-sm hover:border-muted">
          {busy ? "Processing…" : "Add photo or PDF"}
          <input
            type="file"
            accept={ACCEPTED_EVIDENCE}
            multiple
            className="sr-only"
            disabled={busy}
            onChange={handleFilesSelected}
          />
        </label>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

function EvidenceRow({
  item,
  onChange,
  onRemove,
}: {
  item: EvidenceItem;
  onChange: (item: EvidenceItem) => void;
  onRemove: (item: EvidenceItem) => void;
}) {
  function handleKindChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange({ ...item, kind: event.target.value as EvidenceKind });
  }

  function handleRemoveClick() {
    onRemove(item);
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border p-2">
      {item.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.previewUrl} alt="" className="h-14 w-14 rounded object-cover" />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded bg-background text-xs text-muted">PDF</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{item.name}</p>
        <select value={item.kind} onChange={handleKindChange} className={`${inputClass} mt-1 py-1 text-sm`}>
          {EVIDENCE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {EVIDENCE_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      <button type="button" onClick={handleRemoveClick} className="text-sm text-muted hover:text-foreground">
        Remove
      </button>
    </li>
  );
}
