// src/app/about/page.tsx
// About FeeLeaks, the disclaimer, and what we do and don't store.

import type { Metadata } from "next";
import Link from "next/link";
import { cardClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "About and disclaimer",
  description: "How FeeLeaks works, what we store, and why reports are not verified.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 leading-relaxed">
      <header>
        <h1 className="text-2xl font-bold">About FeeLeaks</h1>
        <p className="mt-2 text-muted">
          FeeLeaks shows what schools, colleges, universities and tuition centres in India actually ask families to pay —
          shared anonymously by the parents and students who were asked.
        </p>
      </header>

      <section className={`${cardClass} border-accent/50`}>
        <h2 className="mb-2 font-semibold">Disclaimer</h2>
        <p>
          <strong>Reports are submitted by users and are not verified by FeeLeaks.</strong> They describe what the person
          writing them says they were asked to pay. Figures may be wrong, out of date or incomplete. Check with the
          institution before you rely on them.
        </p>
        <p className="mt-2">
          Items marked &quot;may be questionable&quot; are fee demands that could break rules that apply to some
          institutions. Whether a rule applies depends on the state, board and institution. FeeLeaks does not give legal
          advice.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">How it works</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Anyone writes what they were asked to pay, in plain English, and can attach receipts or circulars.</li>
          <li>AI turns the text into a fee breakdown. The writer checks and corrects it before publishing.</li>
          <li>The report appears straight away under a random funny name.</li>
          <li>Other parents tap &quot;Me too&quot; if they were asked the same.</li>
          <li>Institution pages and the dashboard update as soon as a report is published.</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Your anonymity</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>No login. We never ask for your name, email or phone number.</li>
          <li>
            Your browser gets a random name (like SleepyRickshaw_17) kept in a private cookie. You can post any report
            under a fresh name so your reports can&apos;t be linked together.
          </li>
          <li>
            We store a code that lets your browser edit or delete its own reports and &quot;Me too&quot; taps. It is
            different for every report and can&apos;t be used to link your reports together.
          </li>
          <li>Photos are shrunk and their hidden location and camera data is removed. Anything visible in a photo stays visible — cover names and numbers before uploading.</li>
          <li>The text you write is published as written. Don&apos;t include names, sections, roll numbers or phone numbers.</li>
          <li>
            Letters (complaints, RTI) are made on your phone. Your name and address are never sent to FeeLeaks.
          </li>
          <li>
            &quot;Email this report&quot; opens your own Gmail, so the person you email will see your address.
          </li>
          <li>&quot;Follow&quot; uses your browser&apos;s notification system — no email or phone number.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Rules, authorities and declared fees</h2>
        <p>
          Every rule, complaint authority, institution&apos;s own published fee and inflation figure shown on FeeLeaks
          links to the official source it was taken from, with the date it was checked. Where we haven&apos;t verified
          one yet, the site says so rather than guessing.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Money</h2>
        <p>
          FeeLeaks is free. It takes no money from the institutions being reported on or from education-technology
          companies, and shows no ads.
        </p>
      </section>

      <p>
        <Link href="/leak" className="text-accent underline">Leak a fee</Link> ·{" "}
        <Link href="/dashboard" className="text-accent underline">See the dashboard</Link>
      </p>
    </div>
  );
}
