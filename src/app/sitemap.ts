// src/app/sitemap.ts
// Sitemap so institution pages can show up in Google for "<institution> fees".

import type { MetadataRoute } from "next";
import { PUBLISHED_CASES } from "@/data/published-cases";
import { siteUrl } from "@/lib/site";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const store = getStore();
  const [institutions, reports] = await Promise.all([store.listInstitutions(), store.listReports()]);
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/dashboard`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/cases`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.3 },
    ...PUBLISHED_CASES.map((c) => ({ url: `${base}/cases/${c.number}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...institutions.map((i) => ({ url: `${base}/institution/${i.slug}`, changeFrequency: "daily" as const, priority: 0.9 })),
    ...reports.map((r) => ({ url: `${base}/report/${r.id}`, lastModified: r.updatedAt, priority: 0.6 })),
  ];
}
