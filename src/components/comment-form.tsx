// src/components/comment-form.tsx
// Write a comment or a reply, under this browser's anonymous name.

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent } from "react";
import { postComment } from "@/app/cases/actions";
import { findIdentifyingDetails } from "@/lib/identifying";
import { inputClass, primaryButton, secondaryButton } from "./ui";

export function CommentForm({
  target,
  parentId = null,
  enabled,
  onDone,
  autoFocus = false,
}: {
  target: string;
  parentId?: string | null;
  enabled: boolean;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await postComment(target, parentId, text);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setText("");
      onDone?.();
      router.refresh();
    });
  }

  function handleCancel() {
    onDone?.();
  }

  if (!enabled) {
    return <p className="text-sm text-muted">Comments switch on once the database is connected.</p>;
  }

  const hints = findIdentifyingDetails(text);

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={handleChange}
        rows={parentId ? 3 : 4}
        maxLength={2000}
        autoFocus={autoFocus}
        placeholder={parentId ? "Write a reply" : "What are your thoughts? Were you asked to pay something similar?"}
        className={inputClass}
      />
      {hints.length > 0 && (
        <p className="text-xs text-accent">
          This may identify your family: {hints.map((h) => h.match).join(", ")}. Consider removing it.
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={pending || text.trim().length < 2} className={`${primaryButton} h-9 px-4 text-sm`}>
          {pending ? "Posting…" : parentId ? "Reply" : "Comment"}
        </button>
        {parentId && (
          <button type="button" onClick={handleCancel} className={`${secondaryButton} h-9`}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
