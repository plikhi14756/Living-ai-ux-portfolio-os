import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createOperationsAuditLog } from "@/lib/data/store";
import { sendManualTestEmail } from "@/lib/portfolio-operations/email/manual-test-email";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await sendManualTestEmail();
    const delivery = result.delivery;

    await createOperationsAuditLog({
      action: result.rateLimited ? "test_email_rate_limited" : "test_email_request",
      entity_type: "notification_delivery",
      entity_id: delivery?.id ?? null,
      actor: "admin",
      before_state: null,
      after_state: delivery
        ? { status: delivery.status, provider: delivery.provider }
        : null,
      metadata: { rateLimited: result.rateLimited }
    });

    return NextResponse.json({
      status: delivery?.status ?? "rate_limited",
      message: result.message
    }, { status: result.rateLimited ? 429 : 200 });
  } catch (error) {
    return apiError(error);
  }
}
