import { createHash, randomUUID } from "node:crypto";
import { listNotificationDeliveries } from "@/lib/data/store";
import { resolveNotificationRecipient } from "@/lib/portfolio-operations/email/resolve-recipient";
import { sendOperationalEmail } from "@/lib/portfolio-operations/email/send-email";
import { testEmailTemplate } from "@/lib/portfolio-operations/email/templates";

export const MANUAL_TEST_EMAIL_COOLDOWN_MS = 60_000;

function recipientHash(recipient: string | null) {
  return createHash("sha256")
    .update(recipient ?? "missing-recipient")
    .digest("hex")
    .slice(0, 16);
}

function isManualTestDelivery(metadata: unknown) {
  return (
    metadata !== null &&
    typeof metadata === "object" &&
    "manualTest" in metadata &&
    (metadata as { manualTest?: unknown }).manualTest === true
  );
}

export async function sendManualTestEmail(now = new Date()) {
  const { recipient, source } = await resolveNotificationRecipient();
  const deliveries = await listNotificationDeliveries();
  const latestManualAttempt = deliveries.find(
    (delivery) =>
      delivery.notification_type === "test_email" &&
      isManualTestDelivery(delivery.metadata)
  );

  if (
    latestManualAttempt &&
    now.getTime() - new Date(latestManualAttempt.attempted_at).getTime() <
      MANUAL_TEST_EMAIL_COOLDOWN_MS
  ) {
    return {
      delivery: null,
      rateLimited: true,
      message: "Please wait before sending another test email."
    };
  }

  const template = testEmailTemplate(now);
  const idempotencyKey = `manual-test/${recipientHash(recipient)}/${randomUUID()}`;
  const delivery = await sendOperationalEmail({
    ...template,
    notificationType: "test_email",
    idempotencyKey,
    metadata: {
      manualTest: true,
      recipientSource: source
    }
  });
  const sentWithProviderId =
    delivery.status === "sent" && Boolean(delivery.provider_message_id);

  return {
    delivery,
    rateLimited: false,
    message: sentWithProviderId
      ? "Test email sent."
      : delivery.failure_reason ?? "Test email was not sent."
  };
}
