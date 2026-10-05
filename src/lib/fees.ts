// src/lib/fees.ts
// Fee arithmetic: yearly costs, medians, ranges, hikes and rupee formatting.

import {
  PAYMENTS_PER_YEAR,
  type FeeComponent,
  type Report,
  type ReportFields,
} from "./types";

export function annualAmount(component: FeeComponent): number {
  return component.amount * PAYMENTS_PER_YEAR[component.frequency];
}

export function componentsYearOneSum(components: FeeComponent[]): number | null {
  if (components.length === 0) return null;
  return components.reduce((sum, c) => sum + annualAmount(c), 0);
}

// Everything charged again every year (excludes one-time fees).
export function recurringYearly(components: FeeComponent[]): number | null {
  const recurring = components.filter((c) => c.frequency !== "one_time");
  if (recurring.length === 0) return null;
  return recurring.reduce((sum, c) => sum + annualAmount(c), 0);
}

// What the family pays in the first year, all items included.
// The reporter's own total wins; otherwise the sum of the components.
export function yearOneCost(fields: ReportFields): number | null {
  return fields.reportedTotal ?? componentsYearOneSum(fields.components);
}

// Share of the first-year cost that is not tuition (0–1), when it can be worked out.
export function extrasShare(fields: ReportFields): number | null {
  const total = componentsYearOneSum(fields.components);
  const tuition = fields.components
    .filter((c) => c.kind === "tuition")
    .reduce((sum, c) => sum + annualAmount(c), 0);
  if (total === null || total === 0 || tuition === 0) return null;
  return (total - tuition) / total;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export type Spread = { count: number; min: number; median: number; max: number };

export function spread(values: number[]): Spread | null {
  const m = median(values);
  if (m === null) return null;
  return { count: values.length, min: Math.min(...values), median: m, max: Math.max(...values) };
}

// "2026-27" -> 2026. Returns null for anything we can't read.
export function academicYearStart(year: string | null): number | null {
  if (!year) return null;
  const match = /^(\d{4})/.exec(year.trim());
  return match ? Number(match[1]) : null;
}

export function academicYearLabel(start: number): string {
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export type ClassYearRow = {
  classOrCourse: string;
  academicYear: string;
  yearOne: Spread | null;
  recurring: Spread | null;
};

// Fee spread per class/course and academic year, newest year first.
export function feesByClassAndYear(reports: Report[]): ClassYearRow[] {
  const groups = new Map<string, Report[]>();
  for (const r of reports) {
    const key = `${r.classOrCourse ?? "Not stated"}\u0000${r.academicYear ?? "Year not stated"}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const rows: ClassYearRow[] = [];
  for (const [key, group] of groups) {
    const [classOrCourse, academicYear] = key.split("\u0000");
    rows.push({
      classOrCourse,
      academicYear,
      yearOne: spread(numbers(group.map(yearOneCost))),
      recurring: spread(numbers(group.map((r) => recurringYearly(r.components)))),
    });
  }
  return rows.sort(
    (a, b) =>
      (academicYearStart(b.academicYear) ?? 0) - (academicYearStart(a.academicYear) ?? 0) ||
      a.classOrCourse.localeCompare(b.classOrCourse, "en", { numeric: true }),
  );
}

export type HikePoint = { academicYear: string; medianHike: number; sources: number };

// Hike % per academic year: hikes reporters mentioned, plus hikes worked out
// from the same class's recurring fee in consecutive years.
export function hikeHistory(reports: Report[]): HikePoint[] {
  const byYear = new Map<number, number[]>();
  function add(year: number, value: number) {
    byYear.set(year, [...(byYear.get(year) ?? []), value]);
  }

  for (const r of reports) {
    const year = academicYearStart(r.academicYear);
    if (year !== null && r.hikePercent !== null) add(year, r.hikePercent);
  }

  const recurringByClassYear = new Map<string, number[]>();
  for (const r of reports) {
    const year = academicYearStart(r.academicYear);
    const yearly = recurringYearly(r.components);
    if (year === null || yearly === null || !r.classOrCourse) continue;
    const key = `${r.classOrCourse.toLowerCase()}\u0000${year}`;
    recurringByClassYear.set(key, [...(recurringByClassYear.get(key) ?? []), yearly]);
  }
  for (const [key, values] of recurringByClassYear) {
    const [cls, yearText] = key.split("\u0000");
    const year = Number(yearText);
    const previous = recurringByClassYear.get(`${cls}\u0000${year - 1}`);
    const now = median(values);
    const before = previous ? median(previous) : null;
    if (now !== null && before !== null && before > 0) {
      add(year, Math.round(((now - before) / before) * 1000) / 10);
    }
  }

  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, values]) => ({
      academicYear: academicYearLabel(year),
      medianHike: median(values) ?? 0,
      sources: values.length,
    }));
}

export function numbers(values: (number | null)[]): number[] {
  return values.filter((v): v is number => v !== null && Number.isFinite(v));
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

// ₹1,25,000
export function formatRupees(amount: number): string {
  return `₹${inr.format(Math.round(amount))}`;
}

// ₹1.25 L / ₹2.1 Cr / ₹45,000
export function formatRupeesShort(amount: number): string {
  if (amount >= 1_00_00_000) return `₹${trim(amount / 1_00_00_000)} Cr`;
  if (amount >= 1_00_000) return `₹${trim(amount / 1_00_000)} L`;
  return formatRupees(amount);
}

function trim(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}
