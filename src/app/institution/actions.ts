// src/app/institution/actions.ts
// Server actions for following an institution with browser push notifications.

"use server";

import { z } from "zod";
import { requireIdentity } from "@/lib/identity/session";
import { pushEnabled } from "@/lib/push";
import { allow } from "@/lib/rate-limit";
import { getStore } from "@/lib/store";

const subscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
});

export async function follow(institutionId: string, subscription: unknown): Promise<{ ok: boolean; error?: string }> {
  const identity = await requireIdentity();
  if (!pushEnabled()) return { ok: false, error: "Notifications aren't set up yet." };
  if (!allow(`follow:${identity.deviceId}`, 30, 60 * 60 * 1000)) return { ok: false, error: "Please slow down." };
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { ok: false, error: "This browser's notification details weren't valid." };
  const store = getStore();
  if (!(await store.getInstitution(String(institutionId)))) return { ok: false, error: "Institution not found." };
  await store.followInstitution(String(institutionId), {
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
  });
  return { ok: true };
}

export async function unfollow(institutionId: string, endpoint: string): Promise<{ ok: boolean }> {
  await requireIdentity();
  await getStore().unfollowInstitution(String(institutionId), String(endpoint));
  return { ok: true };
}
