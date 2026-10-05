// src/app/cases/page.tsx
// Parents' own words about named institutions. Sources are kept on file, not shown.

import type { Metadata } from "next";
import Link from "next/link";
import { InlineMarkdown } from "@/components/inline-markdown";
import { cardClass } from "@/components/ui";
import { PUBLISHED_CASES } from "@/data/published-cases";

export const metadata: Metadata = {
  title: "In parents' words",
  description: "What parents say about fees at named schools across India, in their own words.",
};

export default function CasesPage() {
  const regions = [...new Set(PUBLISHED_CASES.map((c) => c.region))];
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold">In parents&apos; words</h1>
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
            {PUBLISHED_CASES.filter((c) => c.region === region).map((c) => (
              <li key={c.number} id={`case-${c.number}`} className={`${cardClass} scroll-mt-4`}>
                <h3 className="font-semibold">
                  <InlineMarkdown text={c.title} />
                </h3>
                {c.words.map((words, index) => (
                  <blockquote key={index} className="mt-3 border-l-2 border-accent pl-3 leading-relaxed italic">
                    “{words}”
                  </blockquote>
                ))}
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
