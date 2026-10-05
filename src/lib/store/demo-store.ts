// src/lib/store/demo-store.ts
// Demo store: keeps everything in a JSON file on the server's disk.
// Used until Supabase is connected. Starts empty — no sample data.
// On Vercel the disk is temporary, so demo data there can disappear at any time.

import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { slugify } from "../matching";
import type { Evidence, Institution, InstitutionInput, Report, ReportFields, ReportWithInstitution } from "../types";
import type { NewEvidenceFile, NewReport, PushSubscriptionRecord, Store } from "./types";

type StoredReport = Omit<Report, "meTooCount"> & { ownerKey: string; meTooKeys: string[] };
type Follow = PushSubscriptionRecord & { institutionIds: string[] };

type Data = {
  institutions: Institution[];
  reports: StoredReport[];
  follows: Follow[];
};

function dataDir(): string {
  if (process.env.FEELEAKS_DATA_DIR) return process.env.FEELEAKS_DATA_DIR;
  return process.env.VERCEL ? "/tmp/feeleaks-data" : path.join(process.cwd(), ".data");
}

export class DemoStore implements Store {
  readonly kind = "demo" as const;
  private queue: Promise<unknown> = Promise.resolve();

  private file() {
    return path.join(dataDir(), "demo.json");
  }

  private async load(): Promise<Data> {
    try {
      return JSON.parse(await readFile(this.file(), "utf8")) as Data;
    } catch {
      return { institutions: [], reports: [], follows: [] };
    }
  }

  private async save(data: Data): Promise<void> {
    await mkdir(dataDir(), { recursive: true });
    const tmp = `${this.file()}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, this.file());
  }

  // Runs read-modify-write changes one at a time.
  private mutate<T>(change: (data: Data) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const data = await this.load();
      const result = await change(data);
      await this.save(data);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private toPublic(report: StoredReport, institutions: Institution[]): ReportWithInstitution | null {
    const institution = institutions.find((i) => i.id === report.institutionId);
    if (!institution) return null;
    // Never expose ownerKey or meTooKeys.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ownerKey, meTooKeys, ...rest } = report;
    return { ...rest, meTooCount: meTooKeys.length, institution };
  }

  async listInstitutions() {
    return (await this.load()).institutions;
  }

  async getInstitution(id: string) {
    return (await this.load()).institutions.find((i) => i.id === id) ?? null;
  }

  async getInstitutionBySlug(slug: string) {
    return (await this.load()).institutions.find((i) => i.slug === slug) ?? null;
  }

  createInstitution(input: InstitutionInput, aliases: string[]) {
    return this.mutate((data) => {
      const base = slugify(`${input.name} ${input.city}`);
      let slug = base;
      for (let n = 2; data.institutions.some((i) => i.slug === slug); n++) slug = `${base}-${n}`;
      const institution: Institution = {
        id: randomUUID(),
        slug,
        ...input,
        aliases: [...new Set(aliases.filter((a) => a && a !== input.name))],
        createdAt: new Date().toISOString(),
      };
      data.institutions.push(institution);
      return institution;
    });
  }

  addInstitutionAlias(id: string, alias: string) {
    return this.mutate((data) => {
      const institution = data.institutions.find((i) => i.id === id);
      const known = institution && [institution.name, ...institution.aliases].map((a) => a.toLowerCase());
      if (institution && known && !known.includes(alias.toLowerCase())) institution.aliases.push(alias);
    });
  }

  async listReports(options: { institutionId?: string; limit?: number } = {}) {
    const data = await this.load();
    return data.reports
      .filter((r) => !options.institutionId || r.institutionId === options.institutionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, options.limit ?? Infinity)
      .map((r) => this.toPublic(r, data.institutions))
      .filter((r): r is ReportWithInstitution => r !== null);
  }

  async getReport(id: string) {
    const data = await this.load();
    const report = data.reports.find((r) => r.id === id);
    return report ? this.toPublic(report, data.institutions) : null;
  }

  async createReport(input: NewReport, files: NewEvidenceFile[]) {
    const id = input.id;
    const evidence: Evidence[] = [];
    if (files.length > 0) await mkdir(path.join(dataDir(), "evidence"), { recursive: true });
    for (const file of files) {
      const evidenceId = randomUUID();
      await writeFile(path.join(dataDir(), "evidence", evidenceId), file.bytes);
      await writeFile(path.join(dataDir(), "evidence", `${evidenceId}.type`), file.mimeType);
      evidence.push({ id: evidenceId, kind: file.kind, mimeType: file.mimeType, size: file.bytes.length });
    }
    return this.mutate((data) => {
      const now = new Date().toISOString();
      const report: StoredReport = {
        id,
        institutionId: input.institutionId,
        username: input.username,
        originalText: input.originalText,
        ...input.fields,
        evidence,
        ownerKey: input.ownerKey,
        meTooKeys: [],
        createdAt: now,
        updatedAt: now,
      };
      data.reports.push(report);
      const result = this.toPublic(report, data.institutions);
      if (!result) throw new Error("Institution not found");
      return result;
    });
  }

  updateReport(id: string, institutionId: string, fields: ReportFields) {
    return this.mutate((data) => {
      const report = data.reports.find((r) => r.id === id);
      if (!report) throw new Error("Report not found");
      Object.assign(report, fields, { institutionId, updatedAt: new Date().toISOString() });
    });
  }

  deleteReport(id: string) {
    return this.mutate((data) => {
      data.reports = data.reports.filter((r) => r.id !== id);
    });
  }

  async isReportOwner(id: string, ownerKey: string) {
    return (await this.load()).reports.some((r) => r.id === id && r.ownerKey === ownerKey);
  }

  async hasMeToo(reportId: string, key: string) {
    return (await this.load()).reports.some((r) => r.id === reportId && r.meTooKeys.includes(key));
  }

  setMeToo(reportId: string, key: string, on: boolean) {
    return this.mutate((data) => {
      const report = data.reports.find((r) => r.id === reportId);
      if (!report) throw new Error("Report not found");
      report.meTooKeys = report.meTooKeys.filter((k) => k !== key);
      if (on) report.meTooKeys.push(key);
      return report.meTooKeys.length;
    });
  }

  async getEvidenceFile(id: string) {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    try {
      const bytes = await readFile(path.join(dataDir(), "evidence", id));
      const mimeType = await readFile(path.join(dataDir(), "evidence", `${id}.type`), "utf8");
      return { bytes: new Uint8Array(bytes), mimeType };
    } catch {
      return null;
    }
  }

  followInstitution(institutionId: string, subscription: PushSubscriptionRecord) {
    return this.mutate((data) => {
      let follow = data.follows.find((f) => f.endpoint === subscription.endpoint);
      if (!follow) {
        follow = { ...subscription, institutionIds: [] };
        data.follows.push(follow);
      }
      Object.assign(follow, subscription);
      if (!follow.institutionIds.includes(institutionId)) follow.institutionIds.push(institutionId);
    });
  }

  unfollowInstitution(institutionId: string, endpoint: string) {
    return this.mutate((data) => {
      const follow = data.follows.find((f) => f.endpoint === endpoint);
      if (follow) follow.institutionIds = follow.institutionIds.filter((id) => id !== institutionId);
    });
  }

  async listFollowers(institutionId: string) {
    return (await this.load()).follows
      .filter((f) => f.institutionIds.includes(institutionId))
      .map(({ endpoint, p256dh, auth }) => ({ endpoint, p256dh, auth }));
  }

  removeSubscription(endpoint: string) {
    return this.mutate((data) => {
      data.follows = data.follows.filter((f) => f.endpoint !== endpoint);
    });
  }
}
