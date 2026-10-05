// src/lib/identity/cookie.ts
// Signed browser identity cookie: a random device ID plus that device's usernames.
// The device ID never leaves the server and is never stored next to reports.

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { randomUsername } from "./usernames";

export const IDENTITY_COOKIE = "fl_id";
// Browsers cap cookie lifetime at 400 days.
export const IDENTITY_MAX_AGE = 400 * 24 * 60 * 60;
const REFRESH_AFTER_SECONDS = 30 * 24 * 60 * 60;
const MAX_NAMES = 50;

export type Identity = {
  deviceId: string;
  // names[0] is the device's default username; later ones are fresh names.
  names: string[];
  issuedAt: number;
};

let warned = false;

export function identitySecret(): string {
  const secret = process.env.IDENTITY_SECRET;
  if (secret) return secret;
  if (!warned) {
    console.warn("IDENTITY_SECRET is not set — using an insecure development secret.");
    warned = true;
  }
  return "feeleaks-insecure-development-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", identitySecret()).update(payload).digest("base64url");
}

export function encodeIdentity(identity: Identity): string {
  const payload = Buffer.from(
    JSON.stringify({ d: identity.deviceId, n: identity.names, t: identity.issuedAt }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeIdentity(value: string | undefined): Identity | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.d !== "string" || !Array.isArray(data.n) || data.n.length === 0) return null;
    return { deviceId: data.d, names: data.n.map(String), issuedAt: Number(data.t) || 0 };
  } catch {
    return null;
  }
}

export function newIdentity(): Identity {
  return { deviceId: randomUUID(), names: [randomUsername()], issuedAt: nowSeconds() };
}

export function withFreshName(identity: Identity): { identity: Identity; name: string } {
  let name = randomUsername();
  while (identity.names.includes(name)) name = randomUsername();
  const names = [identity.names[0], ...identity.names.slice(1).slice(-(MAX_NAMES - 2)), name];
  return { identity: { ...identity, names, issuedAt: nowSeconds() }, name };
}

export function needsRefresh(identity: Identity): boolean {
  return nowSeconds() - identity.issuedAt > REFRESH_AFTER_SECONDS;
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

// A per-report key: proves "this browser wrote / confirmed this report" without
// letting anyone link one browser's reports together from the database alone.
export function deviceKey(deviceId: string, purpose: string, id: string): string {
  return createHmac("sha256", identitySecret())
    .update(`${purpose}:${deviceId}:${id}`)
    .digest("base64url");
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: IDENTITY_MAX_AGE,
  };
}
