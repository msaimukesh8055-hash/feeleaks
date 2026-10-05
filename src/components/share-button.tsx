// src/components/share-button.tsx
// Share a page: the phone's share sheet when available, otherwise WhatsApp or copy link.

"use client";

import { useState } from "react";
import { secondaryButton } from "./ui";

export function ShareButton({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url, text });
      } catch {
        // Share sheet closed.
      }
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={handleShare} className={secondaryButton}>
        Share
      </button>
      <button type="button" onClick={handleCopy} className={secondaryButton}>
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
