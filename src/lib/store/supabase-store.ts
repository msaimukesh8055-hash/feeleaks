// src/lib/store/supabase-store.ts
// Supabase store: Postgres for data, a private storage bucket for evidence files.
// Used from the server only, with the secret key (never sent to browsers).

import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "../matching";
import type {
  AdmissionType,
  Evidence,
  EvidenceKind,
  FeeFrequency,
  FeeKind,
  FlagKind,
  Institution,
  InstitutionInput,
  InstitutionType,
  ReportFields,
  ReportWithInstitution,
} from "../types";
import type {
  NewComment,
  NewEvidenceFile,
  NewReport,
  PushSubscriptionRecord,
  Store,
  StoredComment,
  VoteValue,
} from "./types";

const BUCKET = "evidence";

type InstitutionRow = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  type: InstitutionType;
  city: string;
  state: string;
  board: string | null;
  created_at: string;
};

type ReportRow = {
  id: string;
  institution_id: string;
  username: string;
  original_text: string;
  academic_year: string | null;
  class_or_course: string | null;
  admission_type: AdmissionType | null;
  reported_total: number | null;
  hike_percent: number | string | null;
  created_at: string;
  updated_at: string;
  institution: InstitutionRow;
  fee_components: { position: number; kind: FeeKind; label: string | null; amount: number; frequency: FeeFrequency }[];
  report_flags: { kind: FlagKind; note: string | null }[];
  evidence_files: { id: string; kind: EvidenceKind; mime_type: string; size: number }[];
  me_toos: { count: number }[];
};

// Everything a report page needs, in one query. owner_key is never selected.
const REPORT_SELECT = `
  id, institution_id, username, original_text, academic_year, class_or_course, admission_type,
  reported_total, hike_percent, created_at, updated_at,
  institution:institutions!inner(*),
  fee_components(position, kind, label, amount, frequency),
  report_flags(kind, note),
  evidence_files(id, kind, mime_type, size),
  me_toos(count)
`;

function toInstitution(row: InstitutionRow): Institution {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    aliases: row.aliases ?? [],
    type: row.type,
    city: row.city,
    state: row.state,
    board: row.board,
    createdAt: row.created_at,
  };
}

function toReport(row: ReportRow): ReportWithInstitution {
  const evidence: Evidence[] = row.evidence_files.map((e) => ({
    id: e.id,
    kind: e.kind,
    mimeType: e.mime_type,
    size: e.size,
  }));
  return {
    id: row.id,
    institutionId: row.institution_id,
    username: row.username,
    originalText: row.original_text,
    academicYear: row.academic_year,
    classOrCourse: row.class_or_course,
    admissionType: row.admission_type,
    components: [...row.fee_components]
      .sort((a, b) => a.position - b.position)
      .map(({ kind, label, amount, frequency }) => ({ kind, label, amount: Number(amount), frequency })),
    reportedTotal: row.reported_total === null ? null : Number(row.reported_total),
    hikePercent: row.hike_percent === null ? null : Number(row.hike_percent),
    flags: row.report_flags.map(({ kind, note }) => ({ kind, note })),
    evidence,
    meTooCount: row.me_toos[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    institution: toInstitution(row.institution),
  };
}

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Database error: ${result.error.message}`);
  return result.data;
}

function detailsPayload(fields: ReportFields) {
  return {
    academic_year: fields.academicYear,
    class_or_course: fields.classOrCourse,
    admission_type: fields.admissionType,
    reported_total: fields.reportedTotal,
    hike_percent: fields.hikePercent,
    components: fields.components,
    flags: fields.flags,
  };
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;

  constructor() {
    this.db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async listInstitutions() {
    const rows = check(await this.db.from("institutions").select("*").order("name"));
    return (rows as InstitutionRow[]).map(toInstitution);
  }

  async getInstitution(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const row = check(await this.db.from("institutions").select("*").eq("id", id).maybeSingle());
    return row ? toInstitution(row as InstitutionRow) : null;
  }

  async getInstitutionBySlug(slug: string) {
    const row = check(await this.db.from("institutions").select("*").eq("slug", slug).maybeSingle());
    return row ? toInstitution(row as InstitutionRow) : null;
  }

  async createInstitution(input: InstitutionInput, aliases: string[]) {
    const base = slugify(`${input.name} ${input.city}`);
    for (let n = 1; n < 50; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const result = await this.db
        .from("institutions")
        .insert({ ...input, slug, aliases: [...new Set(aliases.filter((a) => a && a !== input.name))] })
        .select("*")
        .single();
      if (!result.error) return toInstitution(result.data as InstitutionRow);
      if (result.error.code !== "23505") throw new Error(`Database error: ${result.error.message}`);
    }
    throw new Error("Could not create the institution page. Please try again.");
  }

  async addInstitutionAlias(id: string, alias: string) {
    const institution = await this.getInstitution(id);
    if (!institution) return;
    const known = [institution.name, ...institution.aliases].map((a) => a.toLowerCase());
    if (known.includes(alias.toLowerCase())) return;
    check(await this.db.from("institutions").update({ aliases: [...institution.aliases, alias] }).eq("id", id));
  }

  async listReports(options: { institutionId?: string; limit?: number } = {}) {
    let query = this.db.from("reports").select(REPORT_SELECT).order("created_at", { ascending: false });
    if (options.institutionId) query = query.eq("institution_id", options.institutionId);
    if (options.limit) query = query.limit(options.limit);
    const rows = check(await query);
    return (rows as unknown as ReportRow[]).map(toReport);
  }

  async getReport(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const row = check(await this.db.from("reports").select(REPORT_SELECT).eq("id", id).maybeSingle());
    return row ? toReport(row as unknown as ReportRow) : null;
  }

  async createReport(input: NewReport, files: NewEvidenceFile[]) {
    const uploaded: { id: string; kind: EvidenceKind; mime_type: string; size: number; storage_path: string }[] = [];
    try {
      for (const file of files) {
        const id = randomUUID();
        const path = `${input.id}/${id}`;
        check(
          await this.db.storage.from(BUCKET).upload(path, file.bytes, { contentType: file.mimeType, upsert: false }),
        );
        uploaded.push({ id, kind: file.kind, mime_type: file.mimeType, size: file.bytes.length, storage_path: path });
      }
      check(
        await this.db.rpc("create_report", {
          p: {
            id: input.id,
            institution_id: input.institutionId,
            username: input.username,
            original_text: input.originalText,
            owner_key: input.ownerKey,
            ...detailsPayload(input.fields),
            evidence: uploaded,
          },
        }),
      );
    } catch (error) {
      if (uploaded.length > 0) await this.db.storage.from(BUCKET).remove(uploaded.map((u) => u.storage_path));
      throw error;
    }
    const report = await this.getReport(input.id);
    if (!report) throw new Error("The report was saved but couldn't be read back.");
    return report;
  }

  async updateReport(id: string, institutionId: string, originalText: string, fields: ReportFields) {
    check(
      await this.db.rpc("update_report", {
        p: { id, institution_id: institutionId, original_text: originalText, ...detailsPayload(fields) },
      }),
    );
  }

  async deleteReport(id: string) {
    const files = check(await this.db.from("evidence_files").select("storage_path").eq("report_id", id));
    check(await this.db.from("reports").delete().eq("id", id));
    const paths = (files as { storage_path: string }[]).map((f) => f.storage_path);
    if (paths.length > 0) await this.db.storage.from(BUCKET).remove(paths);
  }

  async isReportOwner(id: string, ownerKey: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
    const row = check(
      await this.db.from("reports").select("id").eq("id", id).eq("owner_key", ownerKey).maybeSingle(),
    );
    return row !== null;
  }

  async hasMeToo(reportId: string, key: string) {
    if (!/^[0-9a-f-]{36}$/i.test(reportId)) return false;
    const row = check(
      await this.db.from("me_toos").select("report_id").eq("report_id", reportId).eq("device_key", key).maybeSingle(),
    );
    return row !== null;
  }

  async setMeToo(reportId: string, key: string, on: boolean) {
    if (on) {
      check(
        await this.db
          .from("me_toos")
          .upsert({ report_id: reportId, device_key: key }, { onConflict: "report_id,device_key", ignoreDuplicates: true }),
      );
    } else {
      check(await this.db.from("me_toos").delete().eq("report_id", reportId).eq("device_key", key));
    }
    const { count, error } = await this.db
      .from("me_toos")
      .select("report_id", { count: "exact", head: true })
      .eq("report_id", reportId);
    if (error) throw new Error(`Database error: ${error.message}`);
    return count ?? 0;
  }

  async getEvidenceFile(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const row = check(
      await this.db.from("evidence_files").select("mime_type, storage_path").eq("id", id).maybeSingle(),
    ) as { mime_type: string; storage_path: string } | null;
    if (!row) return null;
    const { data, error } = await this.db.storage.from(BUCKET).download(row.storage_path);
    if (error || !data) return null;
    return { bytes: new Uint8Array(await data.arrayBuffer()), mimeType: row.mime_type };
  }

  async followInstitution(institutionId: string, subscription: PushSubscriptionRecord) {
    check(await this.db.from("push_subscriptions").upsert(subscription, { onConflict: "endpoint" }));
    check(
      await this.db
        .from("follows")
        .upsert(
          { endpoint: subscription.endpoint, institution_id: institutionId },
          { onConflict: "endpoint,institution_id", ignoreDuplicates: true },
        ),
    );
  }

  async unfollowInstitution(institutionId: string, endpoint: string) {
    check(await this.db.from("follows").delete().eq("endpoint", endpoint).eq("institution_id", institutionId));
  }

  async listFollowers(institutionId: string) {
    const rows = check(
      await this.db
        .from("follows")
        .select("push_subscriptions!inner(endpoint, p256dh, auth)")
        .eq("institution_id", institutionId),
    ) as unknown as { push_subscriptions: PushSubscriptionRecord }[];
    return rows.map((r) => r.push_subscriptions);
  }

  async removeSubscription(endpoint: string) {
    check(await this.db.from("push_subscriptions").delete().eq("endpoint", endpoint));
  }

  async getScores(targets: string[]) {
    const scores: Record<string, number> = Object.fromEntries(targets.map((t) => [t, 0]));
    if (targets.length === 0) return scores;
    const rows = check(await this.db.from("vote_scores").select("target, score").in("target", targets)) as {
      target: string;
      score: number;
    }[];
    for (const r of rows) scores[r.target] = Number(r.score);
    return scores;
  }

  async getMyVotes(keys: string[]) {
    if (keys.length === 0) return {};
    const rows = check(await this.db.from("votes").select("device_key, value").in("device_key", keys)) as {
      device_key: string;
      value: number;
    }[];
    return Object.fromEntries(rows.map((r) => [r.device_key, r.value as VoteValue]));
  }

  async setVote(target: string, key: string, value: VoteValue) {
    if (value === 0) {
      check(await this.db.from("votes").delete().eq("target", target).eq("device_key", key));
    } else {
      check(
        await this.db.from("votes").upsert({ target, device_key: key, value }, { onConflict: "target,device_key" }),
      );
    }
    return (await this.getScores([target]))[target] ?? 0;
  }

  async listComments(target: string) {
    const rows = check(
      await this.db
        .from("comments")
        .select("id, target, parent_id, username, body, deleted, created_at")
        .eq("target", target)
        .order("created_at"),
    ) as CommentRow[];
    return rows.map(toComment);
  }

  async countComments(targets: string[]) {
    const counts: Record<string, number> = Object.fromEntries(targets.map((t) => [t, 0]));
    if (targets.length === 0) return counts;
    const rows = check(await this.db.from("comment_counts").select("target, count").in("target", targets)) as {
      target: string;
      count: number;
    }[];
    for (const r of rows) counts[r.target] = Number(r.count);
    return counts;
  }

  async getComment(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const row = check(
      await this.db
        .from("comments")
        .select("id, target, parent_id, username, body, deleted, created_at")
        .eq("id", id)
        .maybeSingle(),
    ) as CommentRow | null;
    return row ? toComment(row) : null;
  }

  async addComment(input: NewComment) {
    const row = check(
      await this.db
        .from("comments")
        .insert({
          id: input.id,
          target: input.target,
          parent_id: input.parentId,
          username: input.username,
          body: input.body,
          owner_key: input.ownerKey,
        })
        .select("id, target, parent_id, username, body, deleted, created_at")
        .single(),
    ) as CommentRow;
    return toComment(row);
  }

  async deleteComment(id: string, ownerKey: string) {
    const rows = check(
      await this.db
        .from("comments")
        .update({ deleted: true, body: "" })
        .eq("id", id)
        .eq("owner_key", ownerKey)
        .select("id"),
    ) as { id: string }[];
    return rows.length > 0;
  }

  async isCommentOwner(id: string, ownerKey: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
    const row = check(
      await this.db.from("comments").select("id").eq("id", id).eq("owner_key", ownerKey).maybeSingle(),
    );
    return row !== null;
  }
}

type CommentRow = {
  id: string;
  target: string;
  parent_id: string | null;
  username: string;
  body: string;
  deleted: boolean;
  created_at: string;
};

function toComment(row: CommentRow): StoredComment {
  return {
    id: row.id,
    target: row.target,
    parentId: row.parent_id,
    username: row.username,
    body: row.deleted ? "" : row.body,
    deleted: row.deleted,
    createdAt: row.created_at,
  };
}
