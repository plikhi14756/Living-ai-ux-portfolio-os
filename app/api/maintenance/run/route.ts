import { NextResponse } from "next/server";
import { runMaintenanceCheck } from "@/lib/ai/maintenance";
import { apiError } from "@/lib/api";
import {
  createMaintenanceReport,
  createNotification,
  getSetting,
  listStudies
} from "@/lib/data/store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const studies = await listStudies();
    const pdf = await getSetting<{ latestUrl?: string }>("pdf");
    const draft = await runMaintenanceCheck(studies, pdf?.latestUrl);
    const report = await createMaintenanceReport(draft);

    await createNotification({
      title: "Maintenance check complete",
      message:
        "The monthly maintenance report checked duplicates, confidentiality flags, PDF status, SEO, and mobile readiness.",
      type: "maintenance",
      read: false,
      related_study_id: null
    });

    return NextResponse.json({ report });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  return POST();
}
