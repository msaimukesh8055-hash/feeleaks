// src/app/opengraph-image.tsx
// Default share preview for the site.

import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "FeeLeaks — what institutions really charge";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Schools · colleges · universities · tuition centres",
    title: "What institutions really charge",
    lines: ["Shared anonymously by the parents and students who paid"],
  });
}
