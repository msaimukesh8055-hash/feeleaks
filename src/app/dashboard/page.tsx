// src/app/dashboard/page.tsx
// Dashboard: most expensive institutions, steepest hikes, most flagged, by city and type.

import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { stripMarkdown } from "@/components/inline-markdown";
import { RankedBars, type RankedRow } from "@/components/ranked-bars";
import { PUBLISHED_CASES, REGIONS, regionSlug } from "@/data/published-cases";
import { caseTarget, statsFor } from "@/lib/discussion";
import { cardClass, inputClass } from "@/components/ui";
import { formatPercent, formatRupeesShort } from "@/lib/fees";
import { byCity, byType, groupByInstitution, siteTotals, type BreakdownRow } from "@/lib/insights";
import { getStore } from "@/lib/store";
import { FLAG_LABELS, INSTITUTION_TYPES, INSTITUTION_TYPE_LABELS, type FlagKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Most expensive institutions, steepest fee hikes and most-flagged fee demands reported on FeeLeaks.",
};

const TOP = 10;

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const params = await props.searchParams;
  const city = typeof params.city === "string" ? params.city : "";
  const type = typeof params.type === "string" ? params.type : "";

  const all = await getStore().listReports();
  const cities = [...new Set(all.map((r) => r.institution.city))].sort((a, b) => a.localeCompare(b));
  const reports = all.filter(
    (r) =>
      (!city || r.institution.city.toLowerCase() === city.toLowerCase()) && (!type || r.institution.type === type),
  );
  const totals = siteTotals(reports);
  const institutions = groupByInstitution(reports);

  const expensive: RankedRow[] = institutions
    .filter((row) => row.summary.yearOne)
    .sort((a, b) => b.summary.yearOne!.median - a.summary.yearOne!.median)
    .slice(0, TOP)
    .map(({ institution, summary }) => ({
      key: institution.id,
      label: institution.name,
      sublabel: institution.city,
      href: `/institution/${institution.slug}`,
      value: summary.yearOne!.median,
      display: formatRupeesShort(summary.yearOne!.median),
      note: `Typical first-year cost · ${summary.yearOne!.count} figure${summary.yearOne!.count === 1 ? "" : "s"}${
        summary.yearOne!.min !== summary.yearOne!.max
          ? ` · range ${formatRupeesShort(summary.yearOne!.min)}–${formatRupeesShort(summary.yearOne!.max)}`
          : ""
      }`,
    }));

  const hikes: RankedRow[] = institutions
    .map(({ institution, summary }) => ({ institution, latest: summary.hikes.at(-1) }))
    .filter((row) => row.latest && row.latest.medianHike > 0)
    .sort((a, b) => b.latest!.medianHike - a.latest!.medianHike)
    .slice(0, TOP)
    .map(({ institution, latest }) => ({
      key: institution.id,
      label: institution.name,
      sublabel: institution.city,
      href: `/institution/${institution.slug}`,
      value: latest!.medianHike,
      display: formatPercent(latest!.medianHike),
      note: `Typical hike in ${latest!.academicYear} · ${latest!.sources} figure${latest!.sources === 1 ? "" : "s"}`,
    }));

  const flagged: RankedRow[] = institutions
    .filter((row) => row.summary.flaggedReports > 0)
    .sort((a, b) => b.summary.flaggedReports - a.summary.flaggedReports)
    .slice(0, TOP)
    .map(({ institution, summary }) => {
      const top = (Object.entries(summary.flagCounts) as [FlagKind, number][]).sort((a, b) => b[1] - a[1])[0];
      return {
        key: institution.id,
        label: institution.name,
        sublabel: institution.city,
        href: `/institution/${institution.slug}`,
        value: summary.flaggedReports,
        display: String(summary.flaggedReports),
        note: `Reports with questionable items · most common: ${FLAG_LABELS[top[0]]}`,
      };
    });

  const confirmed: RankedRow[] = institutions
    .filter((row) => row.summary.meTooTotal > 0)
    .sort((a, b) => b.summary.meTooTotal - a.summary.meTooTotal)
    .slice(0, TOP)
    .map(({ institution, summary }) => ({
      key: institution.id,
      label: institution.name,
      sublabel: institution.city,
      href: `/institution/${institution.slug}`,
      value: summary.meTooTotal,
      display: String(summary.meTooTotal),
      note: `"Me too" confirmations across ${summary.reportCount} report${summary.reportCount === 1 ? "" : "s"}`,
    }));

  const caseStats = await statsFor(PUBLISHED_CASES.map((c) => caseTarget(c.number)));
  const caseRows = PUBLISHED_CASES.map((c) => ({ c, s: caseStats[caseTarget(c.number)] }));
  const totalVotes = caseRows.reduce((sum, r) => sum + r.s.score, 0);
  const totalComments = caseRows.reduce((sum, r) => sum + r.s.comments, 0);
  const caseBars = (metric: "score" | "comments", unit: string): RankedRow[] =>
    caseRows
      .filter((r) => r.s[metric] > 0)
      .sort((a, b) => b.s[metric] - a.s[metric])
      .slice(0, TOP)
      .map(({ c, s }) => ({
        key: String(c.number),
        label: stripMarkdown(c.title),
        href: `/cases/${c.number}`,
        value: s[metric],
        display: String(s[metric]),
        note: `${s[metric]} ${unit} · “${c.words[0].slice(0, 80)}${c.words[0].length > 80 ? "…" : ""}”`,
      }));
  const regionRows = REGIONS.map((region) => {
    const rows = caseRows.filter((r) => r.c.region === region);
    return {
      region,
      schools: rows.length,
      quotes: rows.reduce((n, r) => n + r.c.words.length, 0),
      votes: rows.reduce((n, r) => n + r.s.score, 0),
      comments: rows.reduce((n, r) => n + r.s.comments, 0),
    };
  }).sort((a, b) => b.schools - a.schools);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">In parents&apos; words</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile value={PUBLISHED_CASES.length} label="schools named by parents" />
          <Tile value={PUBLISHED_CASES.reduce((n, c) => n + c.words.length, 0)} label="parents' quotes" />
          <Tile value={totalVotes} label="upvotes (net)" />
          <Tile value={totalComments} label="comments" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Most upvoted" subtitle="Stories parents agree with most">
            <RankedBars rows={caseBars("score", "upvotes")} empty="No votes yet." />
          </Panel>
          <Panel title="Most discussed" subtitle="Stories with the most comments">
            <RankedBars rows={caseBars("comments", "comments")} empty="No comments yet." />
          </Panel>
        </div>
        <Panel title="By region" subtitle="">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-1 pr-2 font-normal">Region</th>
                <th className="py-1 pr-2 text-right font-normal">Schools</th>
                <th className="py-1 pr-2 text-right font-normal">Quotes</th>
                <th className="py-1 pr-2 text-right font-normal">Upvotes</th>
                <th className="py-1 text-right font-normal">Comments</th>
              </tr>
            </thead>
            <tbody>
              {regionRows.map((row) => (
                <tr key={row.region} className="border-t border-border/60">
                  <td className="py-2 pr-2">
                    <Link href={`/cases?region=${regionSlug(row.region)}`} className="hover:underline">{row.region}</Link>
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">{row.schools}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{row.quotes}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{row.votes}</td>
                  <td className="py-2 text-right tabular-nums">{row.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <header>
        <h2 className="text-xl font-semibold">Parents&apos; reports</h2>
        <p className="text-sm text-muted">Built from every report as soon as it&apos;s published. Not verified by FeeLeaks.</p>
      </header>

      <Form action="/dashboard" className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <select name="city" defaultValue={city} aria-label="City" className={inputClass}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="type" defaultValue={type} aria-label="Institution type" className={inputClass}>
          <option value="">All types</option>
          {INSTITUTION_TYPES.map((t) => (
            <option key={t} value={t}>{INSTITUTION_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-border px-4 text-sm hover:border-muted">
          Filter
        </button>
      </Form>

      <section>
        <p className="text-5xl font-bold">{totals.reports.toLocaleString("en-IN")}</p>
        <p className="text-sm text-muted">reports{city || type ? " matching your filter" : ""}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Tile value={totals.institutions} label="institutions" />
          <Tile value={totals.cities} label="cities" />
          <Tile value={totals.meToos} label="“me too” confirmations" />
          <Tile value={totals.withEvidence} label="reports with evidence" />
          <Tile value={totals.flagged} label="reports with questionable items" />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Most expensive" subtitle="Typical first-year cost">
          <RankedBars rows={expensive} empty="No fee figures yet." />
        </Panel>
        <Panel title="Steepest hikes" subtitle="Typical hike in the latest year reported">
          <RankedBars rows={hikes} empty="No hike figures yet." />
        </Panel>
        <Panel title="Most flagged" subtitle="Reports with items that may be questionable">
          <RankedBars rows={flagged} empty="No questionable items reported yet." />
        </Panel>
        <Panel title="Most confirmed" subtitle="Parents who tapped “Me too”">
          <RankedBars rows={confirmed} empty="No confirmations yet." />
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="By city" subtitle="">
          <BreakdownTable rows={byCity(reports)} label="City" linkFor={cityLink} />
        </Panel>
        <Panel title="By type" subtitle="">
          <BreakdownTable
            rows={byType(reports).map((row) => ({ ...row, key: INSTITUTION_TYPE_LABELS[row.type] }))}
            label="Type"
          />
        </Panel>
      </div>
    </div>
  );
}

function cityLink(key: string): string {
  return `/dashboard?city=${encodeURIComponent(key.split(",")[0])}`;
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className={cardClass}>
      <p className="text-xl font-semibold">{value.toLocaleString("en-IN")}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className={cardClass}>
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="mb-3 text-xs text-muted">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function BreakdownTable({
  rows,
  label,
  linkFor,
}: {
  rows: BreakdownRow[];
  label: string;
  linkFor?: (key: string) => string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted">No reports yet.</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted">
        <tr>
          <th className="py-1 pr-2 font-normal">{label}</th>
          <th className="py-1 pr-2 text-right font-normal">Reports</th>
          <th className="py-1 pr-2 text-right font-normal">Typical first year</th>
          <th className="py-1 text-right font-normal">Typical hike</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-t border-border/60">
            <td className="py-2 pr-2">
              {linkFor ? <Link href={linkFor(row.key)} className="hover:underline">{row.key}</Link> : row.key}
            </td>
            <td className="py-2 pr-2 text-right tabular-nums">{row.reportCount}</td>
            <td className="py-2 pr-2 text-right tabular-nums">
              {row.medianYearOne !== null ? formatRupeesShort(row.medianYearOne) : "—"}
            </td>
            <td className="py-2 text-right tabular-nums">{row.medianHike !== null ? formatPercent(row.medianHike) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
