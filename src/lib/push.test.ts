// src/lib/push.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const sendNotification = vi.fn();
vi.mock("web-push", () => ({ default: { setVapidDetails: vi.fn(), sendNotification } }));
const store = {
  listFollowers: vi.fn(),
  getReport: vi.fn(),
  removeSubscription: vi.fn(),
};
vi.mock("./store", () => ({ getStore: () => store }));

describe("notifyFollowers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    sendNotification.mockReset();
    store.removeSubscription.mockReset();
    store.listFollowers.mockResolvedValue([
      { endpoint: "https://push/a", p256dh: "k", auth: "a" },
      { endpoint: "https://push/gone", p256dh: "k", auth: "a" },
    ]);
    store.getReport.mockResolvedValue({
      id: "r1", institution: { name: "ABC School" }, classOrCourse: "Grade 1", academicYear: "2026-27",
      components: [], reportedTotal: 150000, hikePercent: null, flags: [],
    });
  });

  it("sends to every follower and drops expired subscriptions", async () => {
    sendNotification.mockImplementation(async (sub: { endpoint: string }) => {
      if (sub.endpoint.endsWith("gone")) throw Object.assign(new Error("gone"), { statusCode: 410 });
    });
    const { notifyFollowers } = await import("./push");
    await notifyFollowers("i1", "r1");
    expect(sendNotification).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(sendNotification.mock.calls[0][1]);
    expect(payload).toEqual({
      title: "New fee report: ABC School",
      body: "Grade 1, 2026-27 · first-year cost ₹1,50,000",
      url: "/report/r1",
    });
    expect(store.removeSubscription).toHaveBeenCalledWith("https://push/gone");
  });
});
