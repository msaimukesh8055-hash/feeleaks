// src/lib/identity/session.ts
// Server-side access to the current browser's anonymous identity.

import "server-only";
import { cookies } from "next/headers";
import {
  IDENTITY_COOKIE,
  cookieOptions,
  decodeIdentity,
  deviceKey,
  encodeIdentity,
  newIdentity,
  withFreshName,
  type Identity,
} from "./cookie";

// For Server Components: read-only. Returns null if the cookie is missing or invalid.
export async function readIdentity(): Promise<Identity | null> {
  const store = await cookies();
  return decodeIdentity(store.get(IDENTITY_COOKIE)?.value);
}

// For Server Actions: always returns an identity, creating one if needed.
export async function requireIdentity(): Promise<Identity> {
  const existing = await readIdentity();
  if (existing) return existing;
  const identity = newIdentity();
  await saveIdentity(identity);
  return identity;
}

async function saveIdentity(identity: Identity): Promise<void> {
  const store = await cookies();
  store.set(IDENTITY_COOKIE, encodeIdentity(identity), cookieOptions());
}

// For Server Actions: adds a brand-new username to this browser and returns it.
export async function takeFreshName(): Promise<string> {
  const { identity, name } = withFreshName(await requireIdentity());
  await saveIdentity(identity);
  return name;
}

export function ownerKey(identity: Identity, reportId: string): string {
  return deviceKey(identity.deviceId, "owner", reportId);
}

export function meTooKey(identity: Identity, reportId: string): string {
  return deviceKey(identity.deviceId, "metoo", reportId);
}

// Per-target vote key: one vote per browser per story or comment.
export function voteKey(identity: Identity, target: string): string {
  return deviceKey(identity.deviceId, "vote", target);
}

export function commentOwnerKey(identity: Identity, commentId: string): string {
  return deviceKey(identity.deviceId, "comment", commentId);
}
