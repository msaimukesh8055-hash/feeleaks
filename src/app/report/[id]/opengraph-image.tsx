// src/app/report/[id]/opengraph-image.tsx
// Share preview for a single report.

import { formatPercent, formatRupees, yearOneCost } from "@/lib/fees";
import { OG_SIZE, ogCard } from "@/lib/og";
import { getStore } from "@/lib/store";

export const alt = "A parent's fee report on FeeLeaks";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getStore().getReport(id);
  if (!report) return ogCard({ eyebrow: "FeeLeaks", title: "Report not found", lines: [] });
  const total = yearOneCost(report);
  const what = [report.classOrCourse, report.academicYear].filter(Boolean).join(" · ");
  const lines = [
    total !== null ? `Asked to pay ${formatRupees(total)} in the first year` : null,
    report.hikePercent !== null ? `${formatPercent(report.hikePercent)} hike over last year` : null,
    report.flags.length > 0 ? `${report.flags.length} item${report.flags.length === 1 ? "" : "s"} that may be questionable` : null,
  ].filter((line): line is string => line !== null);
  return ogCard({
    eyebrow: `${report.institution.city}${what ? ` · ${what}` : ""}`,
    title: report.institution.name,
    lines,
  });
}
