// src/components/email-report-button.tsx
// "Email this report": opens a pre-filled Gmail draft, after warning that it sends
// from the user's own address.

"use client";

import { useState } from "react";
import { gmailComposeUrl } from "@/lib/letters";
import { secondaryButton, warningClass } from "./ui";

export function EmailReportButton({
  subject,
  body,
  recipients,
}: {
  subject: string;
  body: string;
  recipients: string[];
}) {
  const [open, setOpen] = useState(false);

  function handleToggle() {
    setOpen(!open);
  }

  return (
    <div>
      <button type="button" onClick={handleToggle} className={secondaryButton} aria-expanded={open}>
        Email this report to journalists, MPs or MLAs
      </button>
      {open && (
        <div className={`${warningClass} mt-3 space-y-2`}>
          <p>
            <strong>This sends from your own Gmail</strong>, so the recipient will see your email address. If you wrote
            this report, sending it links it to you.
          </p>
          <p className="text-xs">
            {recipients.length > 0
              ? `${recipients.length} recipient(s) will be filled in.`
              : "We don't have a recipient list yet — add the addresses yourself in Gmail."}
          </p>
          <a
            href={gmailComposeUrl(recipients, subject, body)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground"
          >
            I understand — open Gmail
          </a>
        </div>
      )}
    </div>
  );
}
