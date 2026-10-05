// src/app/report/[id]/action/page.tsx
// "Take action" page: letters pre-filled from a report.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authoritiesFor } from "@/lib/accountability";
import { LETTER_KINDS, type LetterKind } from "@/lib/letters";
import { siteUrl } from "@/lib/site";
import { getStore } from "@/lib/store";
import { LetterGenerator } from "./letter-generator";

export const metadata: Metadata = { title: "Take action", robots: { index: false } };

export default async function ActionPage(props: PageProps<"/report/[id]/action">) {
  const { id } = await props.params;
  const { letter } = await props.searchParams;
  const report = await getStore().getReport(id);
  if (!report) notFound();
  const { institution, ...rest } = report;
  const authority = authoritiesFor(institution)[0] ?? null;
  const initialKind = LETTER_KINDS.includes(letter as LetterKind) ? (letter as LetterKind) : "breakdown";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="print:hidden">
        <Link href={`/report/${id}`} className="text-sm text-muted hover:text-foreground">← Back to the report</Link>
        <h1 className="mt-2 text-2xl font-bold">Take action</h1>
        <p className="mb-6 text-sm text-muted">
          {institution.name}, {institution.city}. Pick a letter, check it, and send it yourself.
        </p>
      </div>
      <LetterGenerator
        report={rest}
        institution={institution}
        authorityName={authority ? authority.name : null}
        reportUrl={`${siteUrl()}/report/${id}`}
        initialKind={initialKind}
      />
    </div>
  );
}
