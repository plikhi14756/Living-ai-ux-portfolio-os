import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createOperationsAuditLog } from "@/lib/data/store";
import { sendOperationalEmail } from "@/lib/portfolio-operations/email/send-email";
import { testEmailTemplate } from "@/lib/portfolio-operations/email/templates";

export const runtime = "nodejs";

export async function POST() {
  try {
    const template = testEmailTemplate();
    const delivery = await sendOperationalEmail({
      ...template,
      notificationType: "test_email",
      idempotencyKey: `test-email:${new Date().toISOString().slice(0, 13)}`
    });

    await createOperationsAuditLog({
      action: "test_email_request",
      entity_type: "notification_delivery",
      entity_id: delivery.id,
      actor: "admin",
      before_state: null,
      after_state: { status: delivery.status, provider: delivery.provider },
      metadata: {}
    });

    return NextResponse.json({
      status: delivery.status,
      message:
        delivery.status === "sent"
          ? "Test email sent."
          : delivery.failure_reason ?? "Test email was not sent."
    });
  } catch (error) {
    return apiError(error);
  }
}
