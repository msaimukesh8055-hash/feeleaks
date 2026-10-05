// src/lib/push.ts
// Browser push notifications for people following an institution (standard Web Push,
// signed with our own VAPID keys — no third-party service).

import "server-only";
import webpush from "web-push";
import { formatRupees, yearOneCost } from "./fees";
import { siteUrl } from "./site";
import { getStore } from "./store";

export function vapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export function pushEnabled(): boolean {
  return Boolean(vapidPublicKey() && process.env.VAPID_PRIVATE_KEY);
}

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || `${siteUrl()}/about`,
    vapidPublicKey()!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export async function notifyFollowers(institutionId: string, reportId: string): Promise<void> {
  if (!pushEnabled()) return;
  const store = getStore();
  const followers = await store.listFollowers(institutionId);
  if (followers.length === 0) return;
  const report = await store.getReport(reportId);
  if (!report) return;

  configure();
  const total = yearOneCost(report);
  const what = [report.classOrCourse, report.academicYear].filter(Boolean).join(", ");
  const payload = JSON.stringify({
    title: `New fee report: ${report.institution.name}`,
    body: [what, total !== null ? `first-year cost ${formatRupees(total)}` : null].filter(Boolean).join(" · "),
    url: `/report/${report.id}`,
  });

  await Promise.all(
    followers.map(async (follower) => {
      try {
        await webpush.sendNotification(
          { endpoint: follower.endpoint, keys: { p256dh: follower.p256dh, auth: follower.auth } },
          payload,
          { TTL: 24 * 60 * 60 },
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // The browser unsubscribed or the subscription expired.
        if (status === 404 || status === 410) await store.removeSubscription(follower.endpoint);
        else console.error("Push failed", status);
      }
    }),
  );
}
