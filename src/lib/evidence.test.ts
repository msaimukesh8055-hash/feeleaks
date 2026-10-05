// src/lib/evidence.test.ts
import { describe, expect, it } from "vitest";
import { sniffType, stripJpegMetadata } from "./evidence";

describe("evidence", () => {
  it("recognises JPEG and PDF only", () => {
    expect(sniffType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffType(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffType(new TextEncoder().encode("<svg"))).toBeNull();
  });

  it("removes EXIF but keeps JFIF and image data", () => {
    const jfif = [0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46];
    const exif = [0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66];
    const scan = [0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9];
    const input = Uint8Array.from([0xff, 0xd8, ...jfif, ...exif, ...scan]);
    expect([...(stripJpegMetadata(input) ?? [])]).toEqual([0xff, 0xd8, ...jfif, ...scan]);
  });

  it("rejects broken JPEGs", () => {
    expect(stripJpegMetadata(Uint8Array.from([0xff, 0xd8, 0x00, 0x01, 0x02, 0x03]))).toBeNull();
  });
});
