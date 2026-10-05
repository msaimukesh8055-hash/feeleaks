// src/components/follow-button.tsx
// "Follow": get a browser notification when someone reports on this institution.
// No email or phone number — just this browser's push subscription.

"use client";

import { useEffect, useState, useTransition } from "react";
import { follow, unfollow } from "@/app/institution/actions";
import { secondaryButton } from "./ui";

const STORAGE_KEY = "fl_follows";

function readFollows(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeFollows(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode); the follow still works on the server.
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type Support = "unknown" | "supported" | "unsupported" | "ios-install";

function detectSupport(): Support {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  if (isIOS && !standalone) return "ios-install";
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    ? "supported"
    : "unsupported";
}

export function FollowButton({ institutionId, vapidPublicKey }: { institutionId: string; vapidPublicKey: string }) {
  const [support, setSupport] = useState<Support>("unknown");
  const [following, setFollowing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(function syncWithBrowser() {
    // Browser-only facts (push support, follows saved on this device) are read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupport(detectSupport());
    setFollowing(readFollows().includes(institutionId));
  }, [institutionId]);

  async function subscribe(): Promise<PushSubscription> {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    return (
      existing ??
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
    );
  }

  function handleFollow() {
    setMessage(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setMessage("Notifications are blocked for this site. Allow them in your browser settings to follow.");
          return;
        }
        const subscription = await subscribe();
        const result = await follow(institutionId, subscription.toJSON());
        if (!result.ok) {
          setMessage(result.error ?? "Couldn't follow. Please try again.");
          return;
        }
        writeFollows([...new Set([...readFollows(), institutionId])]);
        setFollowing(true);
        setMessage("You'll get a notification on this device when someone reports on this institution.");
      } catch {
        setMessage("Couldn't turn on notifications in this browser.");
      }
    });
  }

  function handleUnfollow() {
    setMessage(null);
    startTransition(async () => {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) await unfollow(institutionId, subscription.endpoint);
      const remaining = readFollows().filter((id) => id !== institutionId);
      writeFollows(remaining);
      if (remaining.length === 0) await subscription?.unsubscribe();
      setFollowing(false);
    });
  }

  if (support === "unknown") return null;
  if (support === "unsupported") {
    return <p className="text-xs text-muted">This browser can&apos;t show notifications, so following isn&apos;t available here.</p>;
  }
  if (support === "ios-install") {
    return (
      <p className="text-xs text-muted">
        To follow on iPhone or iPad, first tap Share → &quot;Add to Home Screen&quot;, then open FeeLeaks from your home screen.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={following ? handleUnfollow : handleFollow}
        disabled={pending}
        className={secondaryButton}
        aria-pressed={following}
      >
        {pending ? "…" : following ? "✓ Following" : "Follow — notify me of new reports"}
      </button>
      {message && <p className="mt-1 text-xs text-muted">{message}</p>}
    </div>
  );
}
