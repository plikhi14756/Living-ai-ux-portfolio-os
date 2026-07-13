import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireCronBearerSecret } from "@/lib/api";
import { sendOperationalEmail } from "@/lib/portfolio-operations/email/send-email";
import {
  criticalAlertEmail,
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
