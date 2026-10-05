// src/lib/og.tsx
// Share-preview images (WhatsApp, etc.): one dark card layout used by every page.

import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function ogCard({ eyebrow, title, lines }: { eyebrow: string; title: string; lines: string[] }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#0b0d10",
          color: "#e8eaed",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, color: "#9aa3ad" }}>{eyebrow}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: title.length > 40 ? 60 : 76, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </div>
          {lines.map((line) => (
            <div key={line} style={{ display: "flex", fontSize: 40, color: "#f5b301" }}>
              {line}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
          Fee<span style={{ color: "#f5b301" }}>Leaks</span>
          <span style={{ marginLeft: 24, fontSize: 26, fontWeight: 400, color: "#9aa3ad", alignSelf: "center" }}>
            Anonymous parent reports · not verified
          </span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
