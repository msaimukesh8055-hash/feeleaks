// src/app/search/page.tsx
// Search institutions by name (any spelling) or by city.

import type { Metadata } from "next";
import Link from "next/link";
import { InlineMarkdown, stripMarkdown } from "@/components/inline-markdown";
import { SearchForm } from "@/components/search-form";
import { PUBLIC_CASES } from "@/data/public-cases";
import { cardClass } from "@/components/ui";
import { formatRupeesShort } from "@/lib/fees";
import { summariseInstitution } from "@/lib/insights";
import { findCandidates, normaliseName } from "@/lib/matching";
import { getStore } from "@/lib/store";
import { INSTITUTION_TYPE_LABELS, type Institution } from "@/lib/types";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage(props: PageProps<"/search">) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const store = getStore();
  const institutions = await store.listInstitutions();
  const results = q ? search(institutions, q) : [];
  const reports = results.length > 0 ? await store.listReports() : [];
  const nq = normaliseName(q);
  const caseResults = q
    ? PUBLIC_CASES.filter((c) =>
        normaliseName(stripMarkdown([c.title, c.region, ...c.quotes, ...c.lines].join(" "))).includes(nq),
      )
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchForm defaultValue={q} />
      {q && (
        <p className="text-sm text-muted">
          {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
        </p>
      )}
      <ul className="space-y-3">
        {results.map((institution) => {
          const summary = summariseInstitution(reports.filter((r) => r.institutionId === institution.id));
          return (
            <li key={institution.id} className={cardClass}>
              <Link href={`/institution/${institution.slug}`} className="block">
                <p className="font-semibold">{institution.name}</p>
                <p className="text-sm text-muted">
                  {INSTITUTION_TYPE_LABELS[institution.type]} · {institution.city}, {institution.state}
                </p>
                <p className="mt-1 text-sm">
                  {summary.reportCount} report{summary.reportCount === 1 ? "" : "s"}
                  {summary.yearOne && <> · typical first year {formatRupeesShort(summary.yearOne.median)}</>}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      {caseResults.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Fee cases</h2>
          <ul className="space-y-2">
            {caseResults.map((c) => (
              <li key={c.number}>
                <Link href={`/cases#case-${c.number}`} className={`${cardClass} block text-sm hover:border-muted`}>
                  {c.number}. <InlineMarkdown text={c.title} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {q && results.length === 0 && caseResults.length === 0 && (
        <p className={`${cardClass} text-sm`}>
          Nothing yet. <Link href="/leak" className="text-accent underline">Be the first to report this institution.</Link>
        </p>
      )}
    </div>
  );
}

// Matches by city or state first, then by name (any spelling or abbreviation).
function search(institutions: Institution[], q: string): Institution[] {
  const nq = normaliseName(q);
  const byPlace = institutions.filter(
    (i) => normaliseName(i.city) === nq || normaliseName(i.state) === nq,
  );
  const byText = institutions.filter((i) =>
    [i.name, ...i.aliases].some((name) => normaliseName(name).includes(nq)),
  );
  const fuzzy = findCandidates(institutions, q, null, 20).map((c) => c.institution);
  const seen = new Set<string>();
  return [...byPlace, ...byText, ...fuzzy].filter((i) => !seen.has(i.id) && seen.add(i.id)).slice(0, 50);
}
