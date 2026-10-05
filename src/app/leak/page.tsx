// src/app/leak/page.tsx
// "Leak a fee": write a report, review the structured version, publish.

import type { Metadata } from "next";
import { aiEnabled } from "@/lib/ai/structure";
import { readIdentity } from "@/lib/identity/session";
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
      <LeakFlow aiEnabled={aiEnabled()} username={identity?.names[0] ?? "your anonymous name"} />
    </div>
  );
}
