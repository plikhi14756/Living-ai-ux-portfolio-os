import { NextResponse, type NextRequest } from "next/server";
import { runMonthlyDesignReview } from "@/lib/ai/design-review";
import { runMaintenanceCheck } from "@/lib/ai/maintenance";
import { apiError, requireCronSecret } from "@/lib/api";
import {
  createDesignReview,
  createMaintenanceReport,
  createNotification,
  getSetting,
  listStudies
} from "@/lib/data/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (!requireCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }

    const studies = await listStudies();
    const approved = studies.filter((study) => study.status === "approved");
    const pdf = await getSetting<{ latestUrl?: string }>("pdf");

    const designReview = await createDesignReview(
      await runMonthlyDesignReview(approved)
    );
    const maintenanceReport = await createMaintenanceReport(
      await runMaintenanceCheck(studies, pdf?.latestUrl)
    );

    await createNotification({
      title: "Monthly review cycle complete",
      message:
        "A pending design review and maintenance report were created for approval and follow-up.",
      type: "monthly_review",
      read: false,
      related_study_id: null
    });

    return NextResponse.json({ designReview, maintenanceReport });
  } catch (error) {
    return apiError(error);
  }
}
