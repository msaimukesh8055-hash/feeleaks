// src/components/vote-control.tsx
// Reddit-style up/down vote with score. One vote per browser; tap again to undo.

"use client";

import { useState, useTransition } from "react";
import { castVote } from "@/app/cases/actions";

type Vote = -1 | 0 | 1;

export function VoteControl({
  target,
  initialScore,
  initialVote,
  enabled,
  layout = "vertical",
}: {
  target: string;
  initialScore: number;
  initialVote: Vote;
  enabled: boolean;
  layout?: "vertical" | "horizontal";
}) {
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState<Vote>(initialVote);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(next: Vote) {
    const previous = { score, vote };
    setVote(next);
    setScore(score - vote + next);
    setError(null);
    startTransition(async () => {
      const result = await castVote(target, next);
      if ("error" in result) {
        setVote(previous.vote);
        setScore(previous.score);
        setError(result.error);
      } else {
        setScore(result.score);
      }
    });
  }

  function handleUp() {
    send(vote === 1 ? 0 : 1);
  }

  function handleDown() {
    send(vote === -1 ? 0 : -1);
  }

  const offTitle = enabled ? undefined : "Voting switches on once the database is connected";
  const box = layout === "vertical" ? "flex-col" : "flex-row";

  return (
    <div className={`flex ${box} items-center gap-0.5`} title={error ?? offTitle}>
      <button
        type="button"
        onClick={handleUp}
        disabled={!enabled || pending}
        aria-label="Upvote"
        aria-pressed={vote === 1}
        className={`rounded p-1 leading-none disabled:opacity-40 ${vote === 1 ? "text-accent" : "text-muted hover:text-foreground"}`}
      >
        ▲
      </button>
      <span className={`min-w-6 text-center text-sm font-semibold tabular-nums ${vote !== 0 ? "text-accent" : ""}`}>
        {score}
      </span>
      <button
        type="button"
        onClick={handleDown}
        disabled={!enabled || pending}
        aria-label="Downvote"
        aria-pressed={vote === -1}
        className={`rounded p-1 leading-none disabled:opacity-40 ${vote === -1 ? "text-sky-400" : "text-muted hover:text-foreground"}`}
      >
        ▼
      </button>
      {error && <span className="sr-only">{error}</span>}
    </div>
  );
}
