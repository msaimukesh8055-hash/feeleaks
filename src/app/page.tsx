// src/app/page.tsx
// Home: "Leak a fee", search, headline numbers and the latest reports.

import Link from "next/link";
import { ReportCard } from "@/components/report-parts";
import { InlineMarkdown } from "@/components/inline-markdown";
import { SearchForm } from "@/components/search-form";
import { PUBLISHED_CASES } from "@/data/published-cases";
import { cardClass, primaryButton } from "@/components/ui";
import { siteTotals } from "@/lib/insights";
import { getStore } from "@/lib/store";

export default async function Home(props: PageProps<"/">) {
  const { deleted } = await props.searchParams;
  const reports = await getStore().listReports();
  const totals = siteTotals(reports);
  const latest = reports.slice(0, 20);

  return (
    <div className="space-y-10">
      {deleted && <p className={`${cardClass} text-sm`}>Your report was deleted.</p>}

      <section className="py-4 text-center sm:py-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          What institutions <span className="text-accent">really</span> charge
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted sm:text-lg">
          Parents and students anonymously share the fees schools, colleges, universities and tuition centres
          actually asked them to pay — so the next family knows before they walk in.
        </p>
        <Link href="/leak" className={`${primaryButton} mt-6 w-full sm:w-auto`}>
          Leak a fee
        </Link>
        <div className="mx-auto mt-6 max-w-xl">
          <SearchForm />
        </div>
      </section>

      {totals.reports > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Headline value={totals.reports} label="reports" />
          <Headline value={totals.institutions} label="institutions" />
          <Headline value={totals.meToos} label="“me too” confirmations" />
          <Headline value={totals.flagged} label="reports with questionable items" />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">In parents&apos; words</h2>
          <Link href="/cases" className="text-sm text-muted hover:text-foreground">
            See all →
          </Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PUBLISHED_CASES.slice(0, 6).map((c) => (
            <li key={c.number}>
              <Link href={`/cases#case-${c.number}`} className={`${cardClass} block text-sm hover:border-muted`}>
                <span className="block italic">“{c.words[0]}”</span>
                <span className="mt-1 block text-xs text-muted">
                  <InlineMarkdown text={c.title} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Latest reports</h2>
          {totals.reports > 0 && (
            <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
              Dashboard →
            </Link>
          )}
        </div>
        {latest.length === 0 ? (
          <p className={`${cardClass} text-sm text-muted`}>
            No reports yet. Be the first to share what you were asked to pay.
          </p>
        ) : (
          <ul className="space-y-3">
            {latest.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Headline({ value, label }: { value: number; label: string }) {
  return (
    <div className={cardClass}>
      <p className="text-2xl font-bold text-accent">{value.toLocaleString("en-IN")}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
