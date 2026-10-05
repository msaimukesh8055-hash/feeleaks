// src/components/your-options.tsx
// "Your options": who to complain to (verified entries only) and the letters a parent can send.

import Link from "next/link";
import { authoritiesFor } from "@/lib/accountability";
import { LETTER_KINDS, LETTER_TITLES } from "@/lib/letters";
import type { Institution } from "@/lib/types";
import { cardClass } from "./ui";

export function YourOptions({ institution, reportId }: { institution: Institution; reportId: string | null }) {
  const authorities = authoritiesFor(institution);
  return (
    <section className={cardClass} id="your-options">
      <h2 className="font-semibold">Your options</h2>

      <h3 className="mt-3 text-sm font-medium">Who to complain to</h3>
      {authorities.length > 0 ? (
        <ul className="mt-1 space-y-2 text-sm">
          {authorities.map((authority) => (
            <li key={authority.id}>
              <p className="font-medium">{authority.name}</p>
              <p className="text-muted">{authority.howTo}</p>
              <p className="text-xs">
                {authority.contactUrl && (
                  <>
                    <a href={authority.contactUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      Official contact
                    </a>{" "}
                    ·{" "}
                  </>
                )}
                <a href={authority.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Source: {authority.sourceName}
                </a>{" "}
                <span className="text-muted">(checked {authority.verifiedOn})</span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">
          We haven&apos;t added a verified authority for {institution.state}
          {institution.board ? ` / ${institution.board}` : ""} yet. Each one is added only with a link to its official source.
        </p>
      )}

      <h3 className="mt-4 text-sm font-medium">Letters you can send yourself</h3>
      {reportId ? (
        <ul className="mt-1 space-y-1 text-sm">
          {LETTER_KINDS.map((kind) => (
            <li key={kind}>
              <Link href={`/report/${reportId}/action?letter=${kind}`} className="text-accent underline">
                {LETTER_TITLES[kind]}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">
          Open any report below to write a complaint, RTI application or fee-breakdown request pre-filled from it.
        </p>
      )}
      <p className="mt-2 text-xs text-muted">
        Letters are made on your phone and sent by you. FeeLeaks never sees your name or address.
      </p>
    </section>
  );
}
