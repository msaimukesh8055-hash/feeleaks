// src/lib/discussion.ts
// Votes and comment threads for stories (server side).

import "server-only";
import { PUBLISHED_CASES } from "@/data/published-cases";
import { commentOwnerKey, readIdentity, voteKey } from "./identity/session";
import { getStore } from "./store";
import type { StoredComment, VoteValue } from "./store/types";

export const MAX_COMMENT_LENGTH = 2000;

export function caseTarget(number: number): string {
  return `case:${number}`;
}

export function isValidTarget(target: string): boolean {
  const caseMatch = /^case:(\d+)$/.exec(target);
  if (caseMatch) return PUBLISHED_CASES.some((c) => c.number === Number(caseMatch[1]));
  return /^comment:[0-9a-f-]{36}$/i.test(target);
}

export type TargetStats = { score: number; myVote: VoteValue; comments: number };

export async function statsFor(targets: string[]): Promise<Record<string, TargetStats>> {
  const store = getStore();
  const identity = await readIdentity();
  const keys = identity ? targets.map((t) => voteKey(identity, t)) : [];
  const [scores, counts, mine] = await Promise.all([
    store.getScores(targets),
    store.countComments(targets),
    store.getMyVotes(keys),
  ]);
  return Object.fromEntries(
    targets.map((t, i) => [t, { score: scores[t] ?? 0, comments: counts[t] ?? 0, myVote: (keys[i] && mine[keys[i]]) || 0 }]),
  );
}

export type CommentNode = StoredComment & {
  score: number;
  myVote: VoteValue;
  isMine: boolean;
  replies: CommentNode[];
};

export async function commentTree(target: string): Promise<CommentNode[]> {
  const store = getStore();
  const comments = await store.listComments(target);
  const identity = await readIdentity();
  const stats = await statsFor(comments.map((c) => `comment:${c.id}`));
  const owned = identity
    ? await Promise.all(comments.map((c) => store.isCommentOwner(c.id, commentOwnerKey(identity, c.id))))
    : comments.map(() => false);

  const nodes = new Map<string, CommentNode>();
  comments.forEach((c, i) => {
    const s = stats[`comment:${c.id}`];
    nodes.set(c.id, { ...c, score: s.score, myVote: s.myVote, isMine: owned[i], replies: [] });
  });
  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    (parent ? parent.replies : roots).push(node);
  }
  const byScore = (a: CommentNode, b: CommentNode) => b.score - a.score || a.createdAt.localeCompare(b.createdAt);
  function sortTree(list: CommentNode[]) {
    list.sort(byScore);
    for (const n of list) sortTree(n.replies);
  }
  sortTree(roots);
  return roots;
}
