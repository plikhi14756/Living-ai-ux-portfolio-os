import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createNotification } from "@/lib/data/store";
import { runPortfolioMaintenance } from "@/lib/portfolio-operations/maintenance/run-maintenance";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await runPortfolioMaintenance({
      initiatedBy: "admin",
      runType: "manual",
      idempotencyKey: `manual:${new Date().toISOString().slice(0, 16)}`
    });

    await createNotification({
      title: "Portfolio health check complete",
      message: `${result.issues.length} operational issue(s) were recorded.`,
      type: "portfolio_operations",
      read: false,
      related_study_id: null
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
