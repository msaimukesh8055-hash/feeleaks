// src/app/institution/[slug]/page.tsx
// Institution page: all its reports, fee ranges by class and year, hikes vs inflation,
// declared vs reported fees, and how many parents confirmed.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportCard } from "@/components/report-parts";
import { cardClass } from "@/components/ui";
import { YourOptions } from "@/components/your-options";
import { declaredFeesFor, inflationFor } from "@/lib/accountability";
import { feesByClassAndYear, formatPercent, formatRupees, formatRupeesShort, type Spread } from "@/lib/fees";
import { summariseInstitution } from "@/lib/insights";
import { getStore } from "@/lib/store";
import { FLAG_LABELS, INSTITUTION_TYPE_LABELS, type FlagKind } from "@/lib/types";

export async function generateMetadata(props: PageProps<"/institution/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const institution = await getStore().getInstitutionBySlug(slug);
  if (!institution) return { title: "Institution not found" };
  const reports = await getStore().listReports({ institutionId: institution.id });
  const summary = summariseInstitution(reports);
  const range = summary.yearOne
    ? `First-year cost reported: ${formatRupeesShort(summary.yearOne.min)}–${formatRupeesShort(summary.yearOne.max)}. `
    : "";
  return {
    title: `${institution.name}, ${institution.city} fees`,
    description: `${range}${summary.reportCount} anonymous parent report${summary.reportCount === 1 ? "" : "s"} on FeeLeaks.`,
  };
}

export default async function InstitutionPage(props: PageProps<"/institution/[slug]">) {
  const { slug } = await props.params;
  const store = getStore();
  const institution = await store.getInstitutionBySlug(slug);
  if (!institution) notFound();

  const reports = await store.listReports({ institutionId: institution.id });
  const summary = summariseInstitution(reports);
  const rows = feesByClassAndYear(reports);
  const declared = declaredFeesFor(institution);
  const flagEntries = Object.entries(summary.flagCounts) as [FlagKind, number][];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{institution.name}</h1>
        <p className="text-muted">
          {INSTITUTION_TYPE_LABELS[institution.type]} · {institution.city}, {institution.state}
          {institution.board ? ` · ${institution.board}` : ""}
        </p>
        {institution.aliases.length > 0 && (
          <p className="mt-1 text-xs text-muted">Also written as: {institution.aliases.join(", ")}</p>
        )}
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Reports" value={String(summary.reportCount)} />
        <Stat label="Parents confirmed (me too)" value={String(summary.meTooTotal)} />
        <Stat label="Evidence files" value={String(summary.evidenceCount)} />
        <Stat
          label="Typical first-year cost"
          value={summary.yearOne ? formatRupeesShort(summary.yearOne.median) : "—"}
          note={summary.yearOne && summary.yearOne.min !== summary.yearOne.max ? `${formatRupeesShort(summary.yearOne.min)}–${formatRupeesShort(summary.yearOne.max)}` : undefined}
        />
      </section>

      {summary.medianExtrasShare !== null && summary.medianExtrasShare > 0 && (
        <p className="text-sm">
          In a typical report here, <strong className="text-accent">{formatPercent(Math.round(summary.medianExtrasShare * 100))}</strong>{" "}
          of the first-year cost is something other than tuition.
        </p>
      )}

      {flagEntries.length > 0 && (
        <section className={`${cardClass} border-accent/40`}>
          <h2 className="mb-2 font-semibold">May be questionable</h2>
          <ul className="space-y-1 text-sm">
            {flagEntries.map(([kind, count]) => (
              <li key={kind}>
                <span className="text-accent">{FLAG_LABELS[kind]}</span> — in {count} report{count === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">Fees by class and year</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No fee figures yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="py-2 pr-2 font-normal">Class / course</th>
                  <th className="py-2 pr-2 font-normal">Year</th>
                  <th className="py-2 pr-2 text-right font-normal">First-year cost</th>
                  <th className="py-2 text-right font-normal">Yearly (recurring)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.classOrCourse}|${row.academicYear}`} className="border-t border-border/60">
                    <td className="py-2 pr-2">{row.classOrCourse}</td>
                    <td className="py-2 pr-2">{row.academicYear}</td>
                    <td className="py-2 pr-2 text-right"><SpreadCell spread={row.yearOne} /></td>
                    <td className="py-2 text-right"><SpreadCell spread={row.recurring} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-muted">Typical value is the middle (median) report; range shown when there are several.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Declared by the institution vs reported by parents</h2>
        {declared.length === 0 ? (
          <p className="text-sm text-muted">
            We haven&apos;t added this institution&apos;s own published fee yet. Each declared fee is added only with a link to
            where the institution published it.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {declared.map((fee) => {
              const row = rows.find(
                (r) => r.academicYear === fee.academicYear && r.classOrCourse.toLowerCase() === fee.classOrCourse.toLowerCase(),
              );
              const reported = row?.recurring?.median ?? null;
              return (
                <li key={`${fee.classOrCourse}|${fee.academicYear}`} className={cardClass}>
                  <p className="font-medium">{fee.classOrCourse} · {fee.academicYear}</p>
                  <p>
                    Declared: <strong>{formatRupees(fee.yearlyTotal)}</strong> a year ·{" "}
                    <a href={fee.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{fee.sourceName}</a>{" "}
                    <span className="text-xs text-muted">(checked {fee.verifiedOn})</span>
                  </p>
                  <p>
                    Reported by parents (yearly, typical):{" "}
                    {reported !== null ? (
                      <strong className={reported > fee.yearlyTotal ? "text-accent" : ""}>
                        {formatRupees(reported)}
                        {reported > fee.yearlyTotal && ` (${formatPercent(Math.round(((reported - fee.yearlyTotal) / fee.yearlyTotal) * 1000) / 10)} more)`}
                      </strong>
                    ) : (
                      <span className="text-muted">no reports for this class and year yet</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Hikes</h2>
        {summary.hikes.length === 0 ? (
          <p className="text-sm text-muted">No hike figures yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2 pr-2 font-normal">Year</th>
                <th className="py-2 pr-2 text-right font-normal">Typical hike</th>
                <th className="py-2 text-right font-normal">Inflation (CPI)</th>
              </tr>
            </thead>
            <tbody>
              {summary.hikes.map((point) => {
                const inflation = inflationFor(point.academicYear);
                return (
                  <tr key={point.academicYear} className="border-t border-border/60">
                    <td className="py-2 pr-2">{point.academicYear}</td>
                    <td className="py-2 pr-2 text-right">
                      <strong>{formatPercent(point.medianHike)}</strong>
                      <span className="text-xs text-muted"> ({point.sources} figure{point.sources === 1 ? "" : "s"})</span>
                    </td>
                    <td className="py-2 text-right">
                      {inflation ? (
                        <a href={inflation.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          {formatPercent(inflation.percent)}
                        </a>
                      ) : (
                        <span className="text-xs text-muted">not added yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <YourOptions institution={institution} reportId={null} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">All reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted">No reports yet.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} showInstitution={false} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={cardClass}>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
}

function SpreadCell({ spread }: { spread: Spread | null }) {
  if (!spread) return <span className="text-muted">—</span>;
  return (
    <span>
      <strong>{formatRupees(spread.median)}</strong>
      {spread.count > 1 && (
        <span className="block text-xs text-muted">
          {spread.min !== spread.max && `${formatRupeesShort(spread.min)}–${formatRupeesShort(spread.max)} · `}
          {spread.count} reports
        </span>
      )}
    </span>
  );
}
