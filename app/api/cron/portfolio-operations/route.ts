import { NextResponse, type NextRequest } from "next/server";
import { runMonthlyDesignReview } from "@/lib/ai/design-review";
import { apiError, requireCronBearerSecret } from "@/lib/api";
import {
  createDesignReview,
  createNotification,
  getNotificationPreferences,
  listMaintenanceIssues,
  listStudies,
  updateNotificationPreferences
} from "@/lib/data/store";
import { sendOperationalEmail } from "@/lib/portfolio-operations/email/send-email";
import {
  criticalAlertEmail,
  monthlyDesignReviewEmail,
  weeklyMaintenanceEmail
} from "@/lib/portfolio-operations/email/templates";
import { runPortfolioMaintenance } from "@/lib/portfolio-operations/maintenance/run-maintenance";
import { ensureCurrentRelease } from "@/lib/portfolio-operations/releases";

export const runtime = "nodejs";

function localParts(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    map.weekday
  );
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    day: Number(map.day),
    hour: Number(map.hour),
    weekday
  };
}

function isDue(lastSent: string | null, currentDate: string) {
  return !lastSent || !lastSent.startsWith(currentDate);
}

export async function GET(request: NextRequest) {
  try {
    if (!requireCronBearerSecret(request)) {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }

    await ensureCurrentRelease();
    const preferences = await getNotificationPreferences();
    const local = localParts(preferences.timezone);
    const dueWeekly =
      preferences.weekly_maintenance_enabled &&
      local.weekday === preferences.weekly_day_of_week &&
      local.hour >= preferences.preferred_local_hour &&
      isDue(preferences.last_weekly_email_at, local.date);
    const dueMonthly =
      preferences.monthly_design_review_enabled &&
      local.day === preferences.monthly_day_of_month &&
      local.hour >= preferences.preferred_local_hour &&
      isDue(preferences.last_monthly_email_at, local.date);
    const results: Record<string, unknown> = {
      localDate: local.date,
      dueWeekly,
      dueMonthly
    };

    if (dueWeekly || dueMonthly) {
      const maintenance = await runPortfolioMaintenance({
        initiatedBy: "cron",
        runType: dueMonthly ? "monthly_design_review" : "weekly",
        idempotencyKey: `portfolio-operations:${local.date}:${dueMonthly ? "monthly" : "weekly"}`
      });
      results.maintenanceRunId = maintenance.run.id;
      results.issueCount = maintenance.issues.length;

      if (dueWeekly) {
        const email = weeklyMaintenanceEmail(maintenance.run, maintenance.issues);
        const delivery = await sendOperationalEmail({
          ...email,
          notificationType: "weekly_maintenance",
          maintenanceRunId: maintenance.run.id,
          idempotencyKey: `weekly:${local.date}`
        });
        results.weeklyDeliveryStatus = delivery.status;
        if (delivery.status === "sent") {
          await updateNotificationPreferences({
            last_weekly_email_at: new Date().toISOString()
          });
        }
      }

      if (dueMonthly) {
        const approved = (await listStudies()).filter((study) => study.status === "approved");
        const designReview = await createDesignReview(
          await runMonthlyDesignReview(approved)
        );
        const email = monthlyDesignReviewEmail(designReview, maintenance.run);
        const delivery = await sendOperationalEmail({
          ...email,
          notificationType: "monthly_design_review",
          maintenanceRunId: maintenance.run.id,
          idempotencyKey: `monthly-design:${local.date}`
        });
        results.designReviewId = designReview.id;
        results.monthlyDeliveryStatus = delivery.status;
        if (delivery.status === "sent") {
          await updateNotificationPreferences({
            last_monthly_email_at: new Date().toISOString()
          });
        }
      }
    }

    const criticalIssues = (await listMaintenanceIssues({ status: "open" })).filter(
      (issue) => issue.severity === "critical"
    );
    if (preferences.critical_alerts_enabled && criticalIssues.length) {
      const issue = criticalIssues[0];
      const email = criticalAlertEmail(issue);
      const delivery = await sendOperationalEmail({
        ...email,
        notificationType: "critical_alert",
        maintenanceIssueId: issue.id,
        idempotencyKey: `critical:${issue.fingerprint}`
      });
      results.criticalAlertStatus = delivery.status;
      if (delivery.status === "sent") {
        await updateNotificationPreferences({
          last_critical_email_at: new Date().toISOString()
        });
      }
    }

    await createNotification({
      title: "Portfolio operations dispatcher complete",
      message: "The secure daily portfolio-operations dispatcher finished.",
      type: "portfolio_operations_cron",
      read: false,
      related_study_id: null
    });

    return NextResponse.json(results);
  } catch (error) {
    return apiError(error);
  }
}
