// src/app/institution/[slug]/opengraph-image.tsx
// Share preview for an institution page.

import { formatRupeesShort } from "@/lib/fees";
import { summariseInstitution } from "@/lib/insights";
import { OG_SIZE, ogCard } from "@/lib/og";
import { getStore } from "@/lib/store";

export const alt = "Fees reported by parents on FeeLeaks";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = getStore();
  const institution = await store.getInstitutionBySlug(slug);
  if (!institution) return ogCard({ eyebrow: "FeeLeaks", title: "Institution not found", lines: [] });
  const summary = summariseInstitution(await store.listReports({ institutionId: institution.id }));
  const lines = [
    summary.yearOne ? `Typical first-year cost ${formatRupeesShort(summary.yearOne.median)}` : null,
    `${summary.reportCount} report${summary.reportCount === 1 ? "" : "s"} · ${summary.meTooTotal} parents said “me too”`,
  ].filter((line): line is string => line !== null);
  return ogCard({ eyebrow: `${institution.city}, ${institution.state}`, title: institution.name, lines });
}
