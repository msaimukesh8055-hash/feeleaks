// src/app/cases/page.tsx
// Fee cases involving named institutions, published as written in docs/research/public-fee-cases.md.

import type { Metadata } from "next";
import Link from "next/link";
import { InlineMarkdown } from "@/components/inline-markdown";
import { cardClass } from "@/components/ui";
import { PUBLIC_CASES } from "@/data/public-cases";

export const metadata: Metadata = {
  title: "Fee cases",
  description: `${PUBLIC_CASES.length} fee cases involving named schools, colleges and coaching centres across India, with sources.`,
};

export default function CasesPage() {
  const regions = [...new Set(PUBLIC_CASES.map((c) => c.region))];
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Fee cases</h1>
        <p className="text-sm text-muted">
          {PUBLIC_CASES.length} cases involving named institutions. Each lists its sources and dates.
        </p>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {regions.map((region) => (
            <Link key={region} href={`#${regionId(region)}`} className="rounded-full border border-border px-3 py-1 hover:border-muted">
              {region}
            </Link>
          ))}
        </nav>
      </header>

      {regions.map((region) => (
        <section key={region} id={regionId(region)} className="scroll-mt-4">
          <h2 className="mb-3 text-lg font-semibold">{region}</h2>
          <ol className="space-y-3">
            {PUBLIC_CASES.filter((c) => c.region === region).map((c) => (
              <li key={c.number} id={`case-${c.number}`} className={`${cardClass} scroll-mt-4`}>
                <h3 className="font-semibold">
                  {c.number}. <InlineMarkdown text={c.title} />
                </h3>
                {c.quotes.map((quote, index) => (
                  <blockquote key={index} className="mt-2 border-l-2 border-accent pl-3 text-sm leading-relaxed italic">
                    <InlineMarkdown text={quote} />
                  </blockquote>
                ))}
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {c.lines.map((line, index) => (
                    <li key={index} className="break-words">
                      <InlineMarkdown text={line} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function regionId(region: string): string {
  return region.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
