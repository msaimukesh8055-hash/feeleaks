// src/app/cases/actions.ts
// Server actions for Reddit-style votes and comments on stories.

"use server";

import { randomUUID } from "node:crypto";
import { MAX_COMMENT_LENGTH, isValidTarget } from "@/lib/discussion";
import { commentOwnerKey, requireIdentity, voteKey } from "@/lib/identity/session";
import { allow } from "@/lib/rate-limit";
import { canSaveReports, getStore } from "@/lib/store";
import type { VoteValue } from "@/lib/store/types";

const HOUR = 60 * 60 * 1000;
const OFF = "Voting and comments switch on once the database is connected.";

export async function castVote(target: string, value: number): Promise<{ score: number } | { error: string }> {
  const identity = await requireIdentity();
  if (!canSaveReports()) return { error: OFF };
  const v = Number(value);
  if (![1, 0, -1].includes(v) || !isValidTarget(String(target))) return { error: "Invalid vote." };
  if (!allow(`vote:${identity.deviceId}`, 300, HOUR)) return { error: "Please slow down." };
  const store = getStore();
  if (target.startsWith("comment:") && !(await store.getComment(target.slice(8)))) {
    return { error: "This comment no longer exists." };
  }
  const score = await store.setVote(target, voteKey(identity, target), v as VoteValue);
  return { score };
}

export async function postComment(
  target: string,
  parentId: string | null,
  body: string,
): Promise<{ ok: true } | { error: string }> {
  const identity = await requireIdentity();
  if (!canSaveReports()) return { error: OFF };
  const text = String(body ?? "").trim();
  if (!/^case:\d+$/.test(String(target)) || !isValidTarget(target)) return { error: "This story no longer exists." };
  if (text.length < 2) return { error: "Write something first." };
  if (text.length > MAX_COMMENT_LENGTH) return { error: `Please keep it under ${MAX_COMMENT_LENGTH} characters.` };
  if (!allow(`comment:${identity.deviceId}`, 30, HOUR)) return { error: "Too many comments in the last hour." };
  const store = getStore();
  if (parentId) {
    const parent = await store.getComment(String(parentId));
    if (!parent || parent.target !== target) return { error: "The comment you replied to no longer exists." };
  }
  const id = randomUUID();
  await store.addComment({
    id,
    target,
    parentId: parentId ? String(parentId) : null,
    username: identity.names[0],
    body: text,
    ownerKey: commentOwnerKey(identity, id),
  });
  return { ok: true };
}

export async function removeComment(id: string): Promise<{ ok: true } | { error: string }> {
  const identity = await requireIdentity();
  if (!canSaveReports()) return { error: OFF };
  const ok = await getStore().deleteComment(String(id), commentOwnerKey(identity, String(id)));
  return ok ? { ok: true } : { error: "Only the browser that wrote this comment can delete it." };
}
