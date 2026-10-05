// src/app/leak/page.tsx
// "Leak a fee": write a report, review the structured version, publish.

import type { Metadata } from "next";
import { aiEnabled } from "@/lib/ai/structure";
import { readIdentity } from "@/lib/identity/session";
import { canSaveReports } from "@/lib/store";
import { LeakFlow } from "./leak-flow";

export const metadata: Metadata = {
  title: "Leak a fee",
  description: "Anonymously share what a school, college or tuition centre asked you to pay.",
};

export default async function LeakPage() {
  const identity = await readIdentity();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Leak a fee</h1>
      <p className="mb-6 text-sm text-muted">
        Anonymous. No login. Takes about two minutes.
      </p>
      {!canSaveReports() && (
        <p className="mb-6 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
          You can try the form, but publishing is switched off on the live site until the database is connected.
        </p>
      )}
      <LeakFlow aiEnabled={aiEnabled()} username={identity?.names[0] ?? "your anonymous name"} />
    </div>
  );
}
