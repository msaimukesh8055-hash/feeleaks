// src/app/evidence/[id]/route.ts
// Serves an evidence file (photo or PDF) attached to a report.

import { getStore } from "@/lib/store";

export async function GET(_request: Request, context: RouteContext<"/evidence/[id]">) {
  const { id } = await context.params;
  const file = await getStore().getEvidenceFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
