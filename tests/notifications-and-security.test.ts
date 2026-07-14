import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireCronBearerSecret } from "@/lib/api";
import type { NotificationDelivery } from "@/lib/types";
import {
  MANUAL_TEST_EMAIL_COOLDOWN_MS,
  sendManualTestEmail
} from "@/lib/portfolio-operations/email/manual-test-email";
import { sendOperationalEmail } from "@/lib/portfolio-operations/email/send-email";
import {
  criticalAlertEmail,
  testEmailTemplate,
  weeklyMaintenanceEmail
} from "@/lib/portfolio-operations/email/templates";
import { resolveNotificationRecipient } from "@/lib/portfolio-operations/email/resolve-recipient";
import { maintenanceIssue, maintenanceRun, notificationPreferences } from "@/tests/factories";

const storeMock = vi.hoisted(() => ({
  createNotificationDelivery: vi.fn((input) =>
    Promise.resolve({ id: "delivery-1", created_at: "2026-07-13T10:00:00.000Z", ...input })
  ),
  getNotificationPreferences: vi.fn(),
  listNotificationDeliveries: vi.fn()
}));

vi.mock("@/lib/data/store", () => storeMock);

describe("notification recipient resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("uses saved notification preference before environment fallback", async () => {
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "pranavlikhi@gmail.com");
    storeMock.getNotificationPreferences.mockResolvedValue(
      notificationPreferences({ notification_email: "saved@example.com" })
    );

    await expect(resolveNotificationRecipient()).resolves.toMatchObject({
      recipient: "saved@example.com",
      source: "saved_preference"
    });
  });

  it("uses ADMIN_NOTIFICATION_EMAIL fallback including pranavlikhi@gmail.com", async () => {
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "pranavlikhi@gmail.com");
    storeMock.getNotificationPreferences.mockResolvedValue(
      notificationPreferences({ notification_email: null })
    );

    await expect(resolveNotificationRecipient()).resolves.toMatchObject({
      recipient: "pranavlikhi@gmail.com",
      source: "environment_fallback"
    });
  });

  it("skips delivery when no recipient exists", async () => {
    storeMock.getNotificationPreferences.mockResolvedValue(
      notificationPreferences({ notification_email: null })
    );
    storeMock.listNotificationDeliveries.mockResolvedValue([]);

    const delivery = await sendOperationalEmail({
      html: "<p>Test</p>",
      text: "Test",
      subject: "Test",
      notificationType: "test",
      idempotencyKey: "test:no-recipient"
    });

    expect(delivery.status).toBe("skipped");
    expect(delivery.failure_reason).toBe("No notification recipient configured");
  });

  it("safely logs skipped delivery when provider is missing", async () => {
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "pranavlikhi@gmail.com");
    storeMock.getNotificationPreferences.mockResolvedValue(notificationPreferences());
    storeMock.listNotificationDeliveries.mockResolvedValue([]);

    const delivery = await sendOperationalEmail({
      html: "<p>Test</p>",
      text: "Test",
      subject: "Test",
      notificationType: "test",
      idempotencyKey: "test:provider-missing"
    });

    expect(delivery.status).toBe("skipped");
    expect(delivery.failure_reason).toBe("Email provider is not configured");
  });

  it("prevents duplicate sends by idempotency key", async () => {
    storeMock.listNotificationDeliveries.mockResolvedValue([
      {
        id: "existing",
        status: "sent",
        idempotency_key: "same-key"
      }
    ]);

    const delivery = await sendOperationalEmail({
      html: "<p>Test</p>",
      text: "Test",
      subject: "Test",
      notificationType: "test",
      idempotencyKey: "same-key"
    });

    expect(delivery.id).toBe("existing");
    expect(storeMock.createNotificationDelivery).not.toHaveBeenCalled();
  });

  it.each(["weekly:2026-07-14", "monthly-design:2026-07-01", "critical:privacy:study:study-1"])(
    "keeps scheduled idempotency deterministic for %s",
    async (idempotencyKey) => {
      storeMock.listNotificationDeliveries.mockResolvedValue([
        {
          id: `existing-${idempotencyKey}`,
          status: "sent",
          idempotency_key: idempotencyKey
        }
      ]);

      const delivery = await sendOperationalEmail({
        html: "<p>Scheduled</p>",
        text: "Scheduled",
        subject: "Scheduled",
        notificationType: "scheduled",
        idempotencyKey
      });

      expect(delivery.id).toBe(`existing-${idempotencyKey}`);
      expect(storeMock.createNotificationDelivery).not.toHaveBeenCalled();
    }
  );

  it("formats manual test email subjects in America/Halifax local time with timezone abbreviation", () => {
    const subject = testEmailTemplate(
      new Date("2026-07-14T02:05:00.000Z"),
      "America/Halifax"
    ).subject;

    expect(subject).toBe("Portfolio Operations test - Jul 13, 2026, 11:05 PM ADT");
  });

  it("formats manual test email subjects in Asia/Kolkata local time with explicit timezone", () => {
    const subject = testEmailTemplate(
      new Date("2026-07-14T02:05:00.000Z"),
      "Asia/Kolkata"
    ).subject;

    expect(subject).toBe("Portfolio Operations test - Jul 14, 2026, 7:35 AM GMT+5:30");
  });

  it("falls back to America/Halifax when a saved notification timezone is invalid", () => {
    const subject = testEmailTemplate(
      new Date("2026-07-14T02:05:00.000Z"),
      "Not/AZone"
    ).subject;

    expect(subject).toBe("Portfolio Operations test - Jul 13, 2026, 11:05 PM ADT");
  });

  it("sends two manual test emails after cooldown with unique idempotency keys and provider IDs", async () => {
    vi.useFakeTimers();
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "pranavlikhi@gmail.com");
    vi.stubEnv("RESEND_API_KEY", "resend-key");
    vi.stubEnv("EMAIL_FROM", "Portfolio <ops@example.com>");
    storeMock.getNotificationPreferences.mockResolvedValue(
      notificationPreferences({ notification_email: null })
    );

    const deliveries: NotificationDelivery[] = [];
    storeMock.listNotificationDeliveries.mockImplementation(() => Promise.resolve([...deliveries]));
    storeMock.createNotificationDelivery.mockImplementation((input) => {
      const delivery = {
        id: `delivery-${deliveries.length + 1}`,
        created_at: new Date().toISOString(),
        ...input
      } as NotificationDelivery;
      deliveries.unshift(delivery);
      return Promise.resolve(delivery);
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "resend-message-1" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "resend-message-2" }), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    vi.setSystemTime(new Date("2026-07-14T04:45:00.000Z"));
    const first = await sendManualTestEmail(new Date());
    vi.setSystemTime(new Date("2026-07-14T04:46:01.000Z"));
    const second = await sendManualTestEmail(new Date());

    expect(first.message).toBe("Test email sent.");
    expect(second.message).toBe("Test email sent.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.delivery?.provider_message_id).toBe("resend-message-1");
    expect(second.delivery?.provider_message_id).toBe("resend-message-2");
    expect(first.delivery?.idempotency_key).toMatch(/^manual-test\/[a-f0-9]{16}\//);
    expect(second.delivery?.idempotency_key).toMatch(/^manual-test\/[a-f0-9]{16}\//);
    expect(first.delivery?.idempotency_key).not.toBe(second.delivery?.idempotency_key);
    expect(first.delivery?.idempotency_key).not.toContain("pranavlikhi@gmail.com");
    expect(second.delivery?.idempotency_key).not.toContain("resend-key");
    expect(first.delivery?.subject).toContain("Portfolio Operations test - Jul 14, 2026");
    expect(second.delivery?.subject).toContain("Portfolio Operations test - Jul 14, 2026");
  });

  it("rate-limits rapid manual test email clicks without reporting a new send", async () => {
    vi.useFakeTimers();
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "pranavlikhi@gmail.com");
    vi.stubEnv("RESEND_API_KEY", "resend-key");
    vi.stubEnv("EMAIL_FROM", "Portfolio <ops@example.com>");
    storeMock.getNotificationPreferences.mockResolvedValue(
      notificationPreferences({ notification_email: null })
    );

    const deliveries: NotificationDelivery[] = [];
    storeMock.listNotificationDeliveries.mockImplementation(() => Promise.resolve([...deliveries]));
    storeMock.createNotificationDelivery.mockImplementation((input) => {
      const delivery = {
        id: `delivery-${deliveries.length + 1}`,
        created_at: new Date().toISOString(),
        ...input
      } as NotificationDelivery;
      deliveries.unshift(delivery);
      return Promise.resolve(delivery);
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "resend-message-1" }), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    vi.setSystemTime(new Date("2026-07-14T04:45:00.000Z"));
    const first = await sendManualTestEmail(new Date());
    vi.setSystemTime(
      new Date("2026-07-14T04:45:00.000Z").getTime() + MANUAL_TEST_EMAIL_COOLDOWN_MS - 1
    );
    const second = await sendManualTestEmail(new Date());

    expect(first.message).toBe("Test email sent.");
    expect(second).toMatchObject({
      delivery: null,
      rateLimited: true,
      message: "Please wait before sending another test email."
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(deliveries).toHaveLength(1);
  });

  it("does not reuse a previous successful manual test delivery as a new success", async () => {
    vi.useFakeTimers();
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "pranavlikhi@gmail.com");
    vi.stubEnv("RESEND_API_KEY", "resend-key");
    vi.stubEnv("EMAIL_FROM", "Portfolio <ops@example.com>");
    storeMock.getNotificationPreferences.mockResolvedValue(
      notificationPreferences({ notification_email: null })
    );

    const deliveries: NotificationDelivery[] = [
      {
        id: "old-delivery",
        notification_type: "test_email",
        maintenance_run_id: null,
        maintenance_issue_id: null,
        recipient: "pranavlikhi@gmail.com",
        provider: "resend",
        provider_message_id: "old-message",
        status: "sent",
        subject: "Portfolio Operations test - old",
        failure_reason: null,
        idempotency_key: "manual-test/old/old",
        attempted_at: "2026-07-14T04:40:00.000Z",
        sent_at: "2026-07-14T04:40:00.000Z",
        metadata: { manualTest: true },
        created_at: "2026-07-14T04:40:00.000Z"
      }
    ];
    storeMock.listNotificationDeliveries.mockImplementation(() => Promise.resolve([...deliveries]));
    storeMock.createNotificationDelivery.mockImplementation((input) => {
      const delivery = {
        id: `delivery-${deliveries.length + 1}`,
        created_at: new Date().toISOString(),
        ...input
      } as NotificationDelivery;
      deliveries.unshift(delivery);
      return Promise.resolve(delivery);
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "new-message" }), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    vi.setSystemTime(new Date("2026-07-14T04:42:00.000Z"));
    const result = await sendManualTestEmail(new Date());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.message).toBe("Test email sent.");
    expect(result.delivery?.id).not.toBe("old-delivery");
    expect(result.delivery?.provider_message_id).toBe("new-message");
    expect(result.delivery?.idempotency_key).not.toBe("manual-test/old/old");
  });

  it("does not report manual test success when Resend returns no fresh provider ID", async () => {
    vi.useFakeTimers();
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "pranavlikhi@gmail.com");
    vi.stubEnv("RESEND_API_KEY", "resend-key");
    vi.stubEnv("EMAIL_FROM", "Portfolio <ops@example.com>");
    storeMock.getNotificationPreferences.mockResolvedValue(
      notificationPreferences({ notification_email: null })
    );
    storeMock.listNotificationDeliveries.mockResolvedValue([]);
    storeMock.createNotificationDelivery.mockImplementation((input) =>
      Promise.resolve({
        id: "delivery-without-provider-id",
        created_at: new Date().toISOString(),
        ...input
      } as NotificationDelivery)
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    );

    vi.setSystemTime(new Date("2026-07-14T04:45:00.000Z"));
    const result = await sendManualTestEmail(new Date());

    expect(result.message).toBe("Resend did not return a provider message ID");
    expect(result.delivery?.status).toBe("failed");
    expect(result.delivery?.provider_message_id).toBeNull();
  });

  it("uses the saved notification timezone for manual test email delivery subjects", async () => {
    vi.useFakeTimers();
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "pranavlikhi@gmail.com");
    vi.stubEnv("RESEND_API_KEY", "resend-key");
    vi.stubEnv("EMAIL_FROM", "Portfolio <ops@example.com>");
    storeMock.getNotificationPreferences.mockResolvedValue(
      notificationPreferences({ notification_email: null, timezone: "Asia/Kolkata" })
    );
    storeMock.listNotificationDeliveries.mockResolvedValue([]);
    storeMock.createNotificationDelivery.mockImplementation((input) =>
      Promise.resolve({
        id: "delivery-kolkata",
        created_at: new Date().toISOString(),
        ...input
      } as NotificationDelivery)
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "resend-kolkata" }), { status: 200 })
      )
    );

    vi.setSystemTime(new Date("2026-07-14T02:05:00.000Z"));
    const result = await sendManualTestEmail(new Date());

    expect(result.delivery?.subject).toBe(
      "Portfolio Operations test - Jul 14, 2026, 7:35 AM GMT+5:30"
    );
  });

  it("email links never include admin or cron secrets", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portfolio.example");
    vi.stubEnv("ADMIN_ACCESS_TOKEN", "admin-secret");
    vi.stubEnv("CRON_SECRET", "cron-secret");

    const weekly = weeklyMaintenanceEmail(maintenanceRun(), []);
    const critical = criticalAlertEmail(maintenanceIssue());
    const combined = `${weekly.html}${weekly.text}${critical.html}${critical.text}`;

    expect(combined).not.toContain("admin-secret");
    expect(combined).not.toContain("cron-secret");
    expect(combined).toContain("/admin/operations");
  });
});

describe("cron Bearer authorization", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("CRON_SECRET", "cron-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects missing and invalid Bearer tokens", () => {
    expect(requireCronBearerSecret(new Request("https://example.com/api/cron/portfolio-operations"))).toBe(
      false
    );
    expect(
      requireCronBearerSecret(
        new Request("https://example.com/api/cron/portfolio-operations", {
          headers: { authorization: "Bearer wrong" }
        })
      )
    ).toBe(false);
  });

  it("rejects query-parameter cron secrets", () => {
    expect(
      requireCronBearerSecret(
        new Request("https://example.com/api/cron/portfolio-operations?secret=cron-secret")
      )
    ).toBe(false);
  });

  it("accepts a valid Bearer token", () => {
    expect(
      requireCronBearerSecret(
        new Request("https://example.com/api/cron/portfolio-operations", {
          headers: { authorization: "Bearer cron-secret" }
        })
      )
    ).toBe(true);
  });
});
