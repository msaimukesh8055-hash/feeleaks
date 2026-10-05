// src/lib/insights.ts
// Summaries across many reports: per institution and site-wide (dashboard).

import {
  extrasShare,
  hikeHistory,
  median,
  numbers,
  spread,
  yearOneCost,
  type HikePoint,
  type Spread,
} from "./fees";
import type { FlagKind, Institution, InstitutionType, Report, ReportWithInstitution } from "./types";

export type InstitutionSummary = {
  reportCount: number;
  evidenceCount: number;
  meTooTotal: number;
  yearOne: Spread | null;
  medianExtrasShare: number | null;
  medianHike: number | null;
  hikes: HikePoint[];
  flagCounts: Partial<Record<FlagKind, number>>;
  flaggedReports: number;
};

export function summariseInstitution(reports: Report[]): InstitutionSummary {
  const flagCounts: Partial<Record<FlagKind, number>> = {};
  for (const r of reports) for (const f of r.flags) flagCounts[f.kind] = (flagCounts[f.kind] ?? 0) + 1;
  const hikes = hikeHistory(reports);
  return {
    reportCount: reports.length,
    evidenceCount: reports.reduce((sum, r) => sum + r.evidence.length, 0),
    meTooTotal: reports.reduce((sum, r) => sum + r.meTooCount, 0),
    yearOne: spread(numbers(reports.map(yearOneCost))),
    medianExtrasShare: median(numbers(reports.map(extrasShare))),
    medianHike: median(numbers(reports.map((r) => r.hikePercent))),
    hikes,
    flagCounts,
    flaggedReports: reports.filter((r) => r.flags.length > 0).length,
  };
}

export type InstitutionRow = { institution: Institution; summary: InstitutionSummary };

export function groupByInstitution(reports: ReportWithInstitution[]): InstitutionRow[] {
  const groups = new Map<string, ReportWithInstitution[]>();
  for (const r of reports) groups.set(r.institutionId, [...(groups.get(r.institutionId) ?? []), r]);
  return [...groups.values()].map((group) => ({
    institution: group[0].institution,
    summary: summariseInstitution(group),
  }));
}

export type BreakdownRow = { key: string; reportCount: number; institutionCount: number; medianYearOne: number | null; medianHike: number | null };

function breakdown(reports: ReportWithInstitution[], keyOf: (r: ReportWithInstitution) => string): BreakdownRow[] {
  const groups = new Map<string, ReportWithInstitution[]>();
  for (const r of reports) {
    const key = keyOf(r);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      reportCount: group.length,
      institutionCount: new Set(group.map((r) => r.institutionId)).size,
      medianYearOne: median(numbers(group.map(yearOneCost))),
      medianHike: median(numbers(group.map((r) => r.hikePercent))),
    }))
    .sort((a, b) => b.reportCount - a.reportCount);
}

export function byCity(reports: ReportWithInstitution[]): BreakdownRow[] {
  return breakdown(reports, (r) => `${r.institution.city}, ${r.institution.state}`);
}

export function byType(reports: ReportWithInstitution[]): (BreakdownRow & { type: InstitutionType })[] {
  return breakdown(reports, (r) => r.institution.type).map((row) => ({ ...row, type: row.key as InstitutionType }));
}

export type SiteTotals = {
  reports: number;
  institutions: number;
  cities: number;
  meToos: number;
  withEvidence: number;
  flagged: number;
};

export function siteTotals(reports: ReportWithInstitution[]): SiteTotals {
  return {
    reports: reports.length,
    institutions: new Set(reports.map((r) => r.institutionId)).size,
    cities: new Set(reports.map((r) => `${r.institution.city.toLowerCase()}|${r.institution.state.toLowerCase()}`)).size,
    meToos: reports.reduce((sum, r) => sum + r.meTooCount, 0),
    withEvidence: reports.filter((r) => r.evidence.length > 0).length,
    flagged: reports.filter((r) => r.flags.length > 0).length,
  };
}
