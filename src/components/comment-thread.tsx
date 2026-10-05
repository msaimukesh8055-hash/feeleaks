// src/components/comment-thread.tsx
// Nested Reddit-style comments with votes, reply and delete.

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeComment } from "@/app/cases/actions";
import type { CommentNode } from "@/lib/discussion";
import { CommentForm } from "./comment-form";
import { VoteControl } from "./vote-control";

const MAX_DEPTH = 6;

export function CommentThread({
  comments,
  target,
  enabled,
}: {
  comments: CommentNode[];
  target: string;
  enabled: boolean;
}) {
  if (comments.length === 0) return <p className="text-sm text-muted">No comments yet. Be the first.</p>;
  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} target={target} enabled={enabled} depth={0} />
      ))}
    </ul>
  );
}

function CommentItem({
  comment,
  target,
  enabled,
  depth,
}: {
  comment: CommentNode;
  target: string;
  enabled: boolean;
  depth: number;
}) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleReply() {
    setReplying(!replying);
  }

  function handleReplyDone() {
    setReplying(false);
  }

  function handleToggle() {
    setCollapsed(!collapsed);
  }

  function handleDelete() {
    if (!window.confirm("Delete this comment?")) return;
    startTransition(async () => {
      await removeComment(comment.id);
      router.refresh();
    });
  }

  return (
    <li>
      <div className="flex items-center gap-2 text-xs text-muted">
        <button type="button" onClick={handleToggle} className="hover:text-foreground" aria-label={collapsed ? "Expand" : "Collapse"}>
          {collapsed ? "[+]" : "[–]"}
        </button>
        <span className="font-mono text-foreground">{comment.deleted ? "[deleted]" : comment.username}</span>
        <span>· {timeAgo(comment.createdAt)}</span>
      </div>
      {!collapsed && (
        <div className="mt-1 border-l border-border pl-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {comment.deleted ? <span className="text-muted">[deleted]</span> : comment.body}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted">
            <VoteControl
              target={`comment:${comment.id}`}
              initialScore={comment.score}
              initialVote={comment.myVote}
              enabled={enabled && !comment.deleted}
              layout="horizontal"
            />
            {depth < MAX_DEPTH && !comment.deleted && (
              <button type="button" onClick={handleReply} disabled={!enabled} className="hover:text-foreground disabled:opacity-40">
                Reply
              </button>
            )}
            {comment.isMine && !comment.deleted && (
              <button type="button" onClick={handleDelete} disabled={pending} className="hover:text-foreground">
                Delete
              </button>
            )}
          </div>
          {replying && (
            <div className="mt-2">
              <CommentForm target={target} parentId={comment.id} enabled={enabled} onDone={handleReplyDone} autoFocus />
            </div>
          )}
          {comment.replies.length > 0 && (
            <ul className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} target={target} enabled={enabled} depth={depth + 1} />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units: [number, string][] = [
    [365 * 24 * 3600, "y"],
    [30 * 24 * 3600, "mo"],
    [24 * 3600, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [size, label] of units) if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  return "just now";
}
