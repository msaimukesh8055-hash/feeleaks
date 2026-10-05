// src/components/report-parts.tsx
// Building blocks for showing a report: fee breakdown, flags with their rules, evidence.

import Link from "next/link";
import { rulesFor } from "@/lib/accountability";
import { annualAmount, extrasShare, formatPercent, formatRupees, yearOneCost } from "@/lib/fees";
import {
  ADMISSION_TYPE_LABELS,
  EVIDENCE_KIND_LABELS,
  FEE_FREQUENCY_LABELS,
  FEE_KIND_LABELS,
  FLAG_LABELS,
  type Evidence,
  type Institution,
  type Report,
  type ReportWithInstitution,
} from "@/lib/types";
import { cardClass } from "./ui";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ReportMeta({ report }: { report: Report }) {
  return (
    <p className="text-xs text-muted">
      <span className="font-mono">{report.username}</span> · {formatDate(report.createdAt)}
    </p>
  );
}

export function ReportFacts({ report }: { report: Report }) {
  const facts = [
    report.classOrCourse,
    report.academicYear,
    report.admissionType ? ADMISSION_TYPE_LABELS[report.admissionType] : null,
  ].filter(Boolean);
  if (facts.length === 0) return null;
  return <p className="text-sm text-muted">{facts.join(" · ")}</p>;
}

export function FeeBreakdown({ report }: { report: Report }) {
  const total = yearOneCost(report);
  const extras = extrasShare(report);
  return (
    <div>
      {report.components.length > 0 && (
        <table className="w-full text-sm">
          <tbody>
            {report.components.map((component, index) => (
              <tr key={index} className="border-b border-border/60">
                <td className="py-2 pr-2">
                  {FEE_KIND_LABELS[component.kind]}
                  {component.label && <span className="block text-xs text-muted">{component.label}</span>}
                </td>
                <td className="py-2 pr-2 text-right whitespace-nowrap">{formatRupees(component.amount)}</td>
                <td className="py-2 text-right text-xs whitespace-nowrap text-muted">
                  {FEE_FREQUENCY_LABELS[component.frequency]}
                  {component.frequency !== "one_time" && component.frequency !== "yearly" && (
                    <span className="block">= {formatRupees(annualAmount(component))}/yr</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {total !== null && (
          <p>
            <span className="text-sm text-muted">First-year cost </span>
            <strong className="text-xl text-accent">{formatRupees(total)}</strong>
            {report.reportedTotal !== null && <span className="text-xs text-muted"> (as reported)</span>}
          </p>
        )}
        {extras !== null && (
          <p className="text-sm text-muted">{formatPercent(Math.round(extras * 100))} is not tuition</p>
        )}
        {report.hikePercent !== null && (
          <p className="text-sm">
            Hike: <strong>{formatPercent(report.hikePercent)}</strong> vs last year
          </p>
        )}
      </div>
    </div>
  );
}

export function FlagList({ report, institution }: { report: Report; institution: Institution }) {
  if (report.flags.length === 0) return null;
  return (
    <section className={`${cardClass} border-accent/40`}>
      <h2 className="mb-2 font-semibold">May be questionable</h2>
      <ul className="space-y-3">
        {report.flags.map((flag) => {
          const rules = rulesFor(institution, flag.kind);
          return (
            <li key={flag.kind}>
              <p className="font-medium text-accent">{FLAG_LABELS[flag.kind]}</p>
              {flag.note && <p className="text-sm">“{flag.note}”</p>}
              {rules.length > 0 ? (
                <ul className="mt-1 space-y-1 text-sm text-muted">
                  {rules.map((rule) => (
                    <li key={rule.id}>
                      {rule.summary}{" "}
                      <a href={rule.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        {rule.sourceName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  We haven&apos;t added a verified rule for this in {institution.state} yet.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function EvidenceBadges({ evidence }: { evidence: Evidence[] }) {
  const kinds = [...new Set(evidence.map((e) => e.kind))];
  if (kinds.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {kinds.map((kind) => (
        <span key={kind} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
          {EVIDENCE_KIND_LABELS[kind]} attached
        </span>
      ))}
    </span>
  );
}

export function EvidenceGallery({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 font-semibold">Evidence</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {evidence.map((item) => (
          <li key={item.id}>
            <a href={`/evidence/${item.id}`} target="_blank" rel="noopener noreferrer" className="block">
              {item.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/evidence/${item.id}`}
                  alt={EVIDENCE_KIND_LABELS[item.kind]}
                  className="aspect-square w-full rounded-lg border border-border object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex aspect-square w-full items-center justify-center rounded-lg border border-border text-sm text-muted">
                  PDF
                </span>
              )}
              <span className="mt-1 block text-xs text-muted">{EVIDENCE_KIND_LABELS[item.kind]}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Compact report summary for lists (home page, institution page).
export function ReportCard({ report, showInstitution = true }: { report: ReportWithInstitution; showInstitution?: boolean }) {
  const total = yearOneCost(report);
  return (
    <li className={cardClass}>
      <Link href={`/report/${report.id}`} className="block">
        {showInstitution && (
          <p className="font-semibold">
            {report.institution.name}
            <span className="font-normal text-muted"> · {report.institution.city}</span>
          </p>
        )}
        <ReportFacts report={report} />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {total !== null && <span className="text-lg font-semibold text-accent">{formatRupees(total)}</span>}
          {report.hikePercent !== null && <span className="text-sm">+{formatPercent(report.hikePercent)} hike</span>}
          {report.flags.length > 0 && (
            <span className="text-xs text-accent">
              {report.flags.length} questionable item{report.flags.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{report.originalText}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <ReportMeta report={report} />
          <span className="flex flex-wrap items-center gap-2">
            <EvidenceBadges evidence={report.evidence} />
            {report.meTooCount > 0 && <span className="text-xs text-muted">{report.meTooCount} me too</span>}
          </span>
        </div>
      </Link>
    </li>
  );
}
