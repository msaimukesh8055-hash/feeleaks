// src/lib/store/types.ts
// The storage contract. The demo file store implements it today; Supabase will later.

import type {
  EvidenceKind,
  Institution,
  InstitutionInput,
  ReportFields,
  ReportWithInstitution,
} from "../types";

export type NewEvidenceFile = {
  kind: EvidenceKind;
  mimeType: string;
  bytes: Uint8Array;
};

export type NewReport = {
  id: string;
  institutionId: string;
  username: string;
  originalText: string;
  fields: ReportFields;
  ownerKey: string;
};

export type PushSubscriptionRecord = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type VoteValue = -1 | 0 | 1;

export type StoredComment = {
  id: string;
  target: string; // e.g. "case:31"
  parentId: string | null;
  username: string;
  body: string; // "" when deleted
  deleted: boolean;
  createdAt: string;
};

export type NewComment = {
  id: string;
  target: string;
  parentId: string | null;
  username: string;
  body: string;
  ownerKey: string;
};

export interface Store {
  readonly kind: "demo" | "supabase";

  listInstitutions(): Promise<Institution[]>;
  getInstitution(id: string): Promise<Institution | null>;
  getInstitutionBySlug(slug: string): Promise<Institution | null>;
  createInstitution(input: InstitutionInput, aliases: string[]): Promise<Institution>;
  addInstitutionAlias(id: string, alias: string): Promise<void>;

  listReports(options?: { institutionId?: string; limit?: number }): Promise<ReportWithInstitution[]>;
  getReport(id: string): Promise<ReportWithInstitution | null>;
  createReport(report: NewReport, files: NewEvidenceFile[]): Promise<ReportWithInstitution>;
  updateReport(id: string, institutionId: string, originalText: string, fields: ReportFields): Promise<void>;
  deleteReport(id: string): Promise<void>;
  isReportOwner(id: string, ownerKey: string): Promise<boolean>;

  hasMeToo(reportId: string, key: string): Promise<boolean>;
  setMeToo(reportId: string, key: string, on: boolean): Promise<number>;

  getEvidenceFile(id: string): Promise<{ bytes: Uint8Array; mimeType: string } | null>;

  followInstitution(institutionId: string, subscription: PushSubscriptionRecord): Promise<void>;
  unfollowInstitution(institutionId: string, endpoint: string): Promise<void>;
  listFollowers(institutionId: string): Promise<PushSubscriptionRecord[]>;
  removeSubscription(endpoint: string): Promise<void>;

  // Reddit-style votes. `key` is a per-target key derived from the browser's private ID.
  getScores(targets: string[]): Promise<Record<string, number>>;
  getMyVotes(keys: string[]): Promise<Record<string, VoteValue>>;
  setVote(target: string, key: string, value: VoteValue): Promise<number>;

  listComments(target: string): Promise<StoredComment[]>;
  countComments(targets: string[]): Promise<Record<string, number>>;
  getComment(id: string): Promise<StoredComment | null>;
  addComment(comment: NewComment): Promise<StoredComment>;
  deleteComment(id: string, ownerKey: string): Promise<boolean>;
  isCommentOwner(id: string, ownerKey: string): Promise<boolean>;
}
