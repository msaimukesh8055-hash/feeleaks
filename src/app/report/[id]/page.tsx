// src/app/report/[id]/page.tsx
// A single report: story, fee breakdown, flags, evidence, "Me too", and what to do next.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteReportButton } from "@/components/delete-report-button";
import { EmailReportButton } from "@/components/email-report-button";
import { MeTooButton } from "@/components/me-too-button";
import { ShareButton } from "@/components/share-button";
import {
  EvidenceGallery,
  FeeBreakdown,
  FlagList,
  ReportFacts,
  ReportMeta,
} from "@/components/report-parts";
import { cardClass, secondaryButton } from "@/components/ui";
import { YourOptions } from "@/components/your-options";
import { RECIPIENTS } from "@/data/recipients";
import { formatRupees, yearOneCost } from "@/lib/fees";
import { meTooKey, ownerKey, readIdentity } from "@/lib/identity/session";
import { emailDraft } from "@/lib/letters";
import { siteUrl } from "@/lib/site";
import { getStore } from "@/lib/store";

export async function generateMetadata(props: PageProps<"/report/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const report = await getStore().getReport(id);
  if (!report) return { title: "Report not found" };
  const total = yearOneCost(report);
  const what = [report.classOrCourse, report.academicYear].filter(Boolean).join(", ");
  return {
    title: `${report.institution.name} fees${what ? ` — ${what}` : ""}`,
    description: `${total !== null ? `Asked to pay ${formatRupees(total)} in the first year. ` : ""}Anonymous parent report on FeeLeaks.`,
  };
}

export default async function ReportPage(props: PageProps<"/report/[id]">) {
  const { id } = await props.params;
  const { published } = await props.searchParams;
  const store = getStore();
  const report = await store.getReport(id);
  if (!report) notFound();

  const identity = await readIdentity();
  const isOwner = identity ? await store.isReportOwner(id, ownerKey(identity, id)) : false;
  const meTooActive = identity ? await store.hasMeToo(id, meTooKey(identity, id)) : false;
  const { institution } = report;
  const email = emailDraft(report, institution, `${siteUrl()}/report/${report.id}`);
  const recipients = RECIPIENTS.filter(
    (r) => r.states === null || r.states.some((s) => s.toLowerCase() === institution.state.toLowerCase()),
  ).map((r) => r.email);

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      {published && (
        <div className={`${cardClass} border-accent/60`}>
          <p className="font-semibold text-accent">Your report is published.</p>
          <p className="text-sm text-muted">
            Thank you. Share this page with other parents so they can confirm with &quot;Me too&quot;.
          </p>
        </div>
      )}

      <header>
        <Link href={`/institution/${institution.slug}`} className="text-2xl font-bold hover:underline">
          {institution.name}
        </Link>
        <p className="text-sm text-muted">
          {institution.city}, {institution.state}
          {institution.board ? ` · ${institution.board}` : ""}
        </p>
        <div className="mt-2">
          <ReportFacts report={report} />
          <ReportMeta report={report} />
        </div>
      </header>

      <section className={cardClass}>
        <FeeBreakdown report={report} />
      </section>

      <FlagList report={report} institution={institution} />

      <section>
        <h2 className="mb-2 font-semibold">In their words</h2>
        <p className="whitespace-pre-wrap leading-relaxed">{report.originalText}</p>
      </section>

      <EvidenceGallery evidence={report.evidence} />

      <MeTooButton reportId={report.id} initialCount={report.meTooCount} initialActive={meTooActive} disabled={isOwner} />

      <ShareButton
        url={`${siteUrl()}/report/${report.id}`}
        text={`Fees reported for ${institution.name}, ${institution.city} on FeeLeaks:`}
      />

      <YourOptions institution={institution} reportId={report.id} />

      <EmailReportButton subject={email.subject} body={email.body} recipients={recipients} />

      {isOwner && (
        <section className={cardClass}>
          <p className="mb-2 text-sm text-muted">You wrote this report on this browser.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/report/${report.id}/edit`} className={secondaryButton}>
              Edit
            </Link>
            <DeleteReportButton reportId={report.id} />
          </div>
        </section>
      )}

      <p className="text-xs text-muted">
        Submitted anonymously and not verified by FeeLeaks.
      </p>
    </article>
  );
}
