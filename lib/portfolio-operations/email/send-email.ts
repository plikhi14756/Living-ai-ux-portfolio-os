import {
  createNotificationDelivery,
  listNotificationDeliveries
} from "@/lib/data/store";
import { resolveNotificationRecipient } from "@/lib/portfolio-operations/email/resolve-recipient";

export async function sendOperationalEmail({
  html,
  idempotencyKey,
  maintenanceIssueId,
  maintenanceRunId,
  notificationType,
  subject,
  text
}: {
  html: string;
  idempotencyKey: string;
  maintenanceIssueId?: string | null;
  maintenanceRunId?: string | null;
  notificationType: string;
  subject: string;
  text: string;
}) {
  const attemptedAt = new Date().toISOString();
  const existing = (await listNotificationDeliveries()).find(
    (delivery) =>
      delivery.idempotency_key === idempotencyKey &&
      ["sent", "skipped", "queued"].includes(delivery.status)
  );
  if (existing) return existing;

  const { recipient, source } = await resolveNotificationRecipient();
  const providerConfigured =
    Boolean(process.env.RESEND_API_KEY?.trim()) && Boolean(process.env.EMAIL_FROM?.trim());

  if (!recipient) {
    return createNotificationDelivery({
      notification_type: notificationType,
      maintenance_run_id: maintenanceRunId ?? null,
      maintenance_issue_id: maintenanceIssueId ?? null,
      recipient: null,
      provider: "resend",
      provider_message_id: null,
      status: "skipped",
      subject,
      failure_reason: "No notification recipient configured",
      idempotency_key: idempotencyKey,
      attempted_at: attemptedAt,
      sent_at: null,
      metadata: { recipientSource: source }
    });
  }

  if (!providerConfigured) {
    return createNotificationDelivery({
      notification_type: notificationType,
      maintenance_run_id: maintenanceRunId ?? null,
      maintenance_issue_id: maintenanceIssueId ?? null,
      recipient,
      provider: "resend",
      provider_message_id: null,
      status: "skipped",
      subject,
      failure_reason: "Email provider is not configured",
      idempotency_key: idempotencyKey,
      attempted_at: attemptedAt,
      sent_at: null,
      metadata: { recipientSource: source }
    });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: recipient,
        subject,
        html,
        text
      })
    });
    const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!response.ok) {
      return createNotificationDelivery({
        notification_type: notificationType,
        maintenance_run_id: maintenanceRunId ?? null,
        maintenance_issue_id: maintenanceIssueId ?? null,
        recipient,
        provider: "resend",
        provider_message_id: null,
        status: "failed",
        subject,
        failure_reason: payload.message ?? `Resend returned HTTP ${response.status}`,
        idempotency_key: idempotencyKey,
        attempted_at: attemptedAt,
        sent_at: null,
        metadata: { recipientSource: source, status: response.status }
      });
    }

    return createNotificationDelivery({
      notification_type: notificationType,
      maintenance_run_id: maintenanceRunId ?? null,
      maintenance_issue_id: maintenanceIssueId ?? null,
      recipient,
      provider: "resend",
      provider_message_id: payload.id ?? null,
      status: "sent",
      subject,
      failure_reason: null,
      idempotency_key: idempotencyKey,
      attempted_at: attemptedAt,
      sent_at: new Date().toISOString(),
      metadata: { recipientSource: source }
    });
  } catch {
    return createNotificationDelivery({
      notification_type: notificationType,
      maintenance_run_id: maintenanceRunId ?? null,
      maintenance_issue_id: maintenanceIssueId ?? null,
      recipient,
      provider: "resend",
      provider_message_id: null,
      status: "failed",
      subject,
      failure_reason: "Email delivery request failed",
      idempotency_key: idempotencyKey,
      attempted_at: attemptedAt,
      sent_at: null,
      metadata: { recipientSource: source }
    });
  }
}
