// src/lib/evidence.ts
// Checks uploaded evidence files and strips hidden metadata (camera, GPS location)
// from photos before they are stored.

export const MAX_EVIDENCE_FILES = 4;
export const MAX_EVIDENCE_TOTAL_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_EVIDENCE = "image/*,application/pdf";

export type SniffedType = "image/jpeg" | "application/pdf";

// Only JPEG (the browser converts every photo to JPEG) and PDF are accepted.
export function sniffType(bytes: Uint8Array): SniffedType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  return null;
}

// Removes APP1–APP13 and APP15 segments (EXIF, GPS, XMP, IPTC) and comments from a JPEG.
// Keeps APP0 (JFIF) and APP14 (Adobe colour info) so the image still displays correctly.
// Returns null if the file isn't a well-formed JPEG, so it can be rejected.
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array | null {
  const keep: [number, number][] = [[0, 2]];
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === 0xda) {
      // Start of scan: the rest is image data.
      keep.push([i, bytes.length]);
      return concat(bytes, keep);
    }
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    const end = i + 2 + length;
    if (length < 2 || end > bytes.length) return null;
    const isApp = marker >= 0xe1 && marker <= 0xef && marker !== 0xee;
    const isComment = marker === 0xfe;
    if (!isApp && !isComment) keep.push([i, end]);
    i = end;
  }
  return null;
}

function concat(bytes: Uint8Array, ranges: [number, number][]): Uint8Array {
  const out = new Uint8Array(ranges.reduce((sum, [a, b]) => sum + (b - a), 0));
  let offset = 0;
  for (const [a, b] of ranges) {
    out.set(bytes.subarray(a, b), offset);
    offset += b - a;
  }
  return out;
}
