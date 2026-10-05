// src/app/cases/page.tsx
// "In parents' words": Reddit-style list of stories, filterable by region, sortable by votes.

import type { Metadata } from "next";
import Link from "next/link";
import { InlineMarkdown, stripMarkdown } from "@/components/inline-markdown";
import { VoteControl } from "@/components/vote-control";
import { cardClass } from "@/components/ui";
import { PUBLISHED_CASES, REGIONS, regionSlug } from "@/data/published-cases";
import { caseTarget, statsFor } from "@/lib/discussion";
import { canSaveReports } from "@/lib/store";

export const metadata: Metadata = {
  title: "In parents' words",
  description: "What parents say about fees at named schools across India, in their own words.",
};

const SORTS = { top: "Top", discussed: "Most discussed" } as const;
type Sort = keyof typeof SORTS;

export default async function CasesPage(props: PageProps<"/cases">) {
  const params = await props.searchParams;
  const regionParam = typeof params.region === "string" ? params.region : "";
  const region = REGIONS.find((r) => regionSlug(r) === regionParam) ?? null;
  const sort: Sort = params.sort === "discussed" ? "discussed" : "top";

  const cases = PUBLISHED_CASES.filter((c) => !region || c.region === region);
  const stats = await statsFor(cases.map((c) => caseTarget(c.number)));
  const sorted = [...cases].sort((a, b) => {
    const sa = stats[caseTarget(a.number)];
    const sb = stats[caseTarget(b.number)];
    const primary = sort === "top" ? sb.score - sa.score : sb.comments - sa.comments;
    return primary || a.number - b.number;
  });
  const enabled = canSaveReports();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">In parents&apos; words</h1>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Regions">
          <FilterChip href={hrefFor(null, sort)} active={!region} label="All" />
          {REGIONS.map((r) => (
            <FilterChip key={r} href={hrefFor(r, sort)} active={region === r} label={r} />
          ))}
        </nav>
        <nav className="mt-3 flex gap-4 text-sm" aria-label="Sort">
          {(Object.keys(SORTS) as Sort[]).map((s) => (
            <Link
              key={s}
              href={hrefFor(region, s)}
              className={s === sort ? "font-semibold text-accent" : "text-muted hover:text-foreground"}
            >
              {SORTS[s]}
            </Link>
          ))}
        </nav>
      </header>

      <ol className="space-y-3">
        {sorted.map((c) => {
          const s = stats[caseTarget(c.number)];
          return (
            <li key={c.number} className={`${cardClass} flex gap-3 p-3`}>
              <VoteControl target={caseTarget(c.number)} initialScore={s.score} initialVote={s.myVote} enabled={enabled} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{c.region}</p>
                <Link href={`/cases/${c.number}`} className="block">
                  <h2 className="font-semibold hover:underline">
                    <InlineMarkdown text={c.title} />
                  </h2>
                  {c.words.map((words, index) => (
                    <blockquote key={index} className="mt-2 border-l-2 border-accent pl-3 text-sm leading-relaxed italic">
                      “{words}”
                    </blockquote>
                  ))}
                </Link>
                <div className="mt-2 flex gap-4 text-xs text-muted">
                  <Link href={`/cases/${c.number}#comments`} className="hover:text-foreground">
                    💬 {s.comments} {s.comments === 1 ? "comment" : "comments"}
                  </Link>
                  <Link href={`/cases/${c.number}`} className="hover:text-foreground" title={stripMarkdown(c.title)}>
                    ↗ Open
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function hrefFor(region: string | null, sort: Sort): string {
  const query = new URLSearchParams();
  if (region) query.set("region", regionSlug(region));
  if (sort !== "top") query.set("sort", sort);
  const qs = query.toString();
  return qs ? `/cases?${qs}` : "/cases";
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1 ${active ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-muted"}`}
    >
      {label}
    </Link>
  );
}
