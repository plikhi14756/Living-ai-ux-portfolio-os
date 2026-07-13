import {
  createMaintenanceIssue,
  createMaintenanceRun,
  createOperationsAuditLog,
  getNotificationPreferences,
  getSetting,
  listDuplicateAuditLogs,
  listMaintenanceIssues,
  listMaintenanceRuns,
  listNotificationDeliveries,
  listPublicStudies,
  listReleases,
  listStudies,
  updateMaintenanceRun
} from "@/lib/data/store";
import {
  runMaintenanceChecks,
  toMaintenanceIssueInput
} from "@/lib/portfolio-operations/maintenance/registry";
import type { MaintenanceRun } from "@/lib/types";

export async function runPortfolioMaintenance({
  initiatedBy,
  idempotencyKey,
  runType
}: {
  initiatedBy: string;
  idempotencyKey?: string;
  runType: MaintenanceRun["run_type"];
}) {
  const startedAt = new Date().toISOString();
  if (idempotencyKey) {
    const existingRuns = await listMaintenanceRuns();
    const existingRun = existingRuns.find(
      (run) => run.idempotency_key === idempotencyKey
    );
    if (existingRun) {
      return {
        run: existingRun,
        issues: await listMaintenanceIssues({ runId: existingRun.id })
      };
    }
  }

  const run = await createMaintenanceRun({
    run_type: runType,
    status: "running",
    started_at: startedAt,
    completed_at: null,
    overall_status: "healthy",
    summary: {},
    issue_count: 0,
    critical_count: 0,
    warning_count: 0,
    info_count: 0,
    initiated_by: initiatedBy,
    error_message: null,
    idempotency_key: idempotencyKey ?? null
  });

  try {
    const [
      studies,
      publicStudies,
      duplicateLogs,
      maintenanceRuns,
      notificationPreferences,
      notificationDeliveries,
      releases,
      pdf
    ] = await Promise.all([
      listStudies(),
      listPublicStudies(),
      listDuplicateAuditLogs(),
      listMaintenanceRuns(),
      getNotificationPreferences(),
      listNotificationDeliveries(),
      listReleases(),
      getSetting<{ latestUrl?: string }>("pdf")
    ]);

    const results = await runMaintenanceChecks({
      studies,
      publicStudyIds: new Set(publicStudies.map((study) => study.id)),
      duplicateLogs,
      maintenanceRuns,
      notificationPreferences,
      notificationDeliveries,
      releases,
      latestPdfUrl: pdf?.latestUrl
    });
    const detectedAt = new Date().toISOString();
    const issues = [];
    for (const result of results) {
      issues.push(
        await createMaintenanceIssue(toMaintenanceIssueInput(result, run.id, detectedAt))
      );
    }

    const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
    const warningCount = issues.filter((issue) => issue.severity === "warning").length;
    const infoCount = issues.filter((issue) => issue.severity === "info").length;
    const overallStatus =
      criticalCount > 0 ? "critical" : warningCount > 0 ? "attention" : "healthy";
    const completedRun = await updateMaintenanceRun(run.id, {
      status: "completed",
      completed_at: detectedAt,
      overall_status: overallStatus,
      issue_count: issues.length,
      critical_count: criticalCount,
      warning_count: warningCount,
      info_count: infoCount,
      summary: {
        issueCount: issues.length,
        criticalCount,
        warningCount,
        infoCount,
        overallStatus
      }
    });

    await createOperationsAuditLog({
      action: "manual_maintenance_run",
      entity_type: "maintenance_run",
      entity_id: run.id,
      actor: initiatedBy,
      before_state: null,
      after_state: completedRun,
      metadata: { issueCount: issues.length, runType }
    });

    return { run: completedRun ?? run, issues };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown maintenance error";
    const failedRun = await updateMaintenanceRun(run.id, {
      status: "failed",
      completed_at: new Date().toISOString(),
      overall_status: "critical",
      error_message: message
    });
    return { run: failedRun ?? run, issues: [] };
  }
}
