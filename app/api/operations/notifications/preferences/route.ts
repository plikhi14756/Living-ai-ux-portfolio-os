import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import {
  createOperationsAuditLog,
  getNotificationPreferences,
  updateNotificationPreferences
} from "@/lib/data/store";
import { isValidEmail } from "@/lib/portfolio-operations/email/resolve-recipient";

const BodySchema = z.object({
  notification_email: z.string().trim().optional().nullable(),
  timezone: z.string().min(1),
  weekly_maintenance_enabled: z.boolean(),
  monthly_design_review_enabled: z.boolean(),
  critical_alerts_enabled: z.boolean(),
  weekly_day_of_week: z.number().int().min(0).max(6),
  monthly_day_of_month: z.number().int().min(1).max(28),
  preferred_local_hour: z.number().int().min(0).max(23)
});

function assertValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error("Enter a valid IANA timezone, such as America/Halifax or Asia/Kolkata.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const before = await getNotificationPreferences();
    const body = BodySchema.parse(await request.json());
    assertValidTimezone(body.timezone);
    const email = body.notification_email?.trim() || null;
    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid notification email." }, { status: 400 });
    }

    const preferences = await updateNotificationPreferences({
      ...body,
      notification_email: email
    });

    await createOperationsAuditLog({
      action: "notification_preferences_update",
      entity_type: "notification_preferences",
      entity_id: preferences.id,
      actor: "admin",
      before_state: before,
      after_state: preferences,
      metadata: {}
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    return apiError(error);
  }
}
