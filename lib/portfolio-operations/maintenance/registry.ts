import { isProductionDeployment } from "@/lib/env";
import { isPublicPortfolioStudy } from "@/lib/public-study";
import type {
  DuplicateAuditLog,
  MaintenanceIssue,
  MaintenanceSeverity,
  MaintenanceRun,
  NotificationDelivery,
  NotificationPreferences,
  Release,
  Study
} from "@/lib/types";
import { buildCodexRepairPrompt } from "@/lib/portfolio-operations/maintenance/build-repair-prompt";

export type MaintenanceCheckContext = {
  studies: Study[];
  publicStudyIds: Set<string>;
  duplicateLogs: DuplicateAuditLog[];
  maintenanceRuns: MaintenanceRun[];
  notificationPreferences: NotificationPreferences;
  notificationDeliveries: NotificationDelivery[];
  releases: Release[];
  latestPdfUrl?: string;
};

export type MaintenanceCheckResult = {
  key: string;
  category: string;
  severity: MaintenanceSeverity;
  title: string;
  humanSummary: string;
  technicalDetails: unknown;
  affectedRecordType?: string;
  affectedRecordId?: string;
  suggestedAction: string;
};

export type MaintenanceCheck = (
  context: MaintenanceCheckContext
) => Promise<MaintenanceCheckResult[]> | MaintenanceCheckResult[];

function issue(input: MaintenanceCheckResult): MaintenanceCheckResult {
  return input;
}

function missingEnv(names: string[]) {
  return names.filter((name) => !process.env[name]?.trim());
}

function hasPrivateLeak(text: string) {
  return [
    "completion code",
    "study id",
    "researcher name",
    "private prototype",
    "unreleased",
    "screenshot",
    "admin_access_token",
    "supabase_service_role_key",
    "openai_api_key"
  ].some((term) => text.toLowerCase().includes(term));
}

export async function runIsolatedMaintenanceChecks(
  context: MaintenanceCheckContext,
  checks: MaintenanceCheck[]
): Promise<MaintenanceCheckResult[]> {
  const results: MaintenanceCheckResult[] = [];

  for (const check of checks) {
    try {
      results.push(...(await check(context)));
    } catch (error) {
      results.push(
        issue({
          key: `maintenance-check-failed-${check.name || "anonymous"}`,
          category: "maintenance",
          severity: "warning",
          title: "Maintenance check failed",
          humanSummary:
            error instanceof Error
              ? error.message
              : "A maintenance check failed without a readable error.",
          technicalDetails: { check: check.name || "anonymous" },
          suggestedAction:
            "Inspect the failing maintenance check and keep remaining checks running independently."
        })
      );
    }
  }

  return results;
}

async function collectBuiltInMaintenanceChecks(
  context: MaintenanceCheckContext
): Promise<MaintenanceCheckResult[]> {
  const results: MaintenanceCheckResult[] = [];
  const productionMissing = missingEnv([
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "CRON_SECRET",
    "ADMIN_ACCESS_TOKEN"
  ]);
  if (isProductionDeployment() && productionMissing.length) {
    results.push(
      issue({
        key: "environment-required-production",
        category: "environment",
        severity: "critical",
        title: "Required production environment variables are missing",
        humanSummary: `Missing production variables: ${productionMissing.join(", ")}.`,
        technicalDetails: { missing: productionMissing },
        suggestedAction: "Add the missing variables in Vercel Project Settings and redeploy."
      })
    );
  }

  const optionalEmailMissing = missingEnv(["RESEND_API_KEY", "EMAIL_FROM"]);
  if (optionalEmailMissing.length) {
    results.push(
      issue({
        key: "email-provider-configuration",
        category: "notifications",
        severity: "info",
        title: "Email provider is not fully configured",
        humanSummary: `Missing optional email variables: ${optionalEmailMissing.join(", ")}.`,
        technicalDetails: { missing: optionalEmailMissing },
        suggestedAction: "Configure RESEND_API_KEY and EMAIL_FROM to enable email delivery."
      })
    );
  }

  if (!context.notificationPreferences.notification_email && !process.env.ADMIN_NOTIFICATION_EMAIL) {
    results.push(
      issue({
        key: "notification-recipient-missing",
        category: "notifications",
        severity: "warning",
        title: "Notification recipient is not configured",
        humanSummary: "No saved notification email or ADMIN_NOTIFICATION_EMAIL fallback is configured.",
        technicalDetails: { ownerKey: context.notificationPreferences.owner_key },
        suggestedAction: "Add a recipient in Notification Preferences or set ADMIN_NOTIFICATION_EMAIL."
      })
    );
  }

  const publicStudies = context.studies.filter((study) => context.publicStudyIds.has(study.id));
  const privatePublicLeaks = publicStudies.filter((study) => !isPublicPortfolioStudy(study));
  if (privatePublicLeaks.length) {
    results.push(
      issue({
        key: "private-record-public-query",
        category: "privacy",
        severity: "critical",
        title: "Private or low-score records appear in public query results",
        humanSummary: `${privatePublicLeaks.length} public query result does not satisfy publication rules.`,
        technicalDetails: { ids: privatePublicLeaks.map((study) => study.id) },
        suggestedAction: "Repair the public portfolio query/view so only approved portfolio-worthy entries are returned."
      })
    );
  }

  for (const study of publicStudies) {
    const publicText = `${study.safe_public_title} ${study.safe_public_description}`;
    if (hasPrivateLeak(publicText)) {
      results.push(
        issue({
          key: `privacy-public-copy-${study.id}`,
          category: "privacy",
          severity: "critical",
          title: "Possible confidential term in public copy",
          humanSummary: `Public copy for "${study.safe_public_title}" contains a privacy-sensitive term.`,
          technicalDetails: { studyId: study.id },
          affectedRecordType: "study",
          affectedRecordId: study.id,
          suggestedAction: "Rewrite the public title/description using confidentiality-safe wording."
        })
      );
    }
  }

  const unresolvedDuplicates = context.duplicateLogs.filter(
    (log) => log.resolution === "pending"
  );
  for (const log of unresolvedDuplicates) {
    results.push(
      issue({
        key: `duplicate-${log.id}`,
        category: "duplicates",
        severity: log.detection_type === "exact" ? "warning" : "info",
        title: `Unresolved ${log.detection_type} duplicate alert`,
        humanSummary: `A ${Math.round(log.similarity_score * 100)}% duplicate match needs admin review.`,
        technicalDetails: {
          auditId: log.id,
          candidateEntryId: log.candidate_entry_id,
          matchedEntryId: log.matched_entry_id
        },
        affectedRecordType: "duplicate_audit_log",
        affectedRecordId: log.id,
        suggestedAction: "Open duplicate management and choose Replace Existing, Keep New, Keep Both, Cancel, or false positive."
      })
    );
  }

  for (const study of context.studies) {
    if (study.portfolio_score < 0 || study.portfolio_score > 100) {
      results.push(
        issue({
          key: `score-range-${study.id}`,
          category: "data-quality",
          severity: "warning",
          title: "Invalid portfolio score range",
          humanSummary: `${study.safe_public_title} has score ${study.portfolio_score}.`,
          technicalDetails: { studyId: study.id, score: study.portfolio_score },
          affectedRecordType: "study",
          affectedRecordId: study.id,
          suggestedAction: "Clamp portfolio scores between 0 and 100 and re-run scoring."
        })
      );
    }

    if (study.status === "approved" && study.analysis_status === "Re-analysis needed") {
      results.push(
        issue({
          key: `approved-reanalysis-needed-${study.id}`,
          category: "ai-analysis",
          severity: "warning",
          title: "Approved entry still needs re-analysis",
          humanSummary: `${study.safe_public_title} is approved but marked as needing re-analysis.`,
          technicalDetails: { studyId: study.id, analysisStatus: study.analysis_status },
          affectedRecordType: "study",
          affectedRecordId: study.id,
          suggestedAction: "Re-analyze or manually complete extraction before keeping it approved."
        })
      );
    }

    if (study.duplicate_status === "superseded" && context.publicStudyIds.has(study.id)) {
      results.push(
        issue({
          key: `superseded-public-${study.id}`,
          category: "publication-integrity",
          severity: "critical",
          title: "Superseded record appears publicly",
          humanSummary: `${study.safe_public_title} is superseded but included in public entries.`,
          technicalDetails: { studyId: study.id },
          affectedRecordType: "study",
          affectedRecordId: study.id,
          suggestedAction: "Exclude superseded entries from the public portfolio view."
        })
      );
    }
  }

  if (!context.latestPdfUrl) {
    results.push(
      issue({
        key: "living-pdf-missing",
        category: "documents",
        severity: "warning",
        title: "Living PDF export is missing",
        humanSummary: "No latest living PDF URL is configured.",
        technicalDetails: {},
        suggestedAction: "Regenerate the living portfolio PDF from the admin dashboard."
      })
    );
  }

  if (!context.releases.some((release) => release.is_active)) {
    results.push(
      issue({
        key: "active-release-missing",
        category: "releases",
        severity: "info",
        title: "No active release record found",
        humanSummary: "The What's New system does not have an active synchronized release yet.",
        technicalDetails: {},
        suggestedAction: "Run release synchronization from the operations dashboard."
      })
    );
  }

  const staleRunningRuns = context.maintenanceRuns.filter((run) => {
    if (run.status !== "running") return false;
    return Date.now() - new Date(run.started_at).getTime() > 1000 * 60 * 60;
  });
  if (staleRunningRuns.length) {
    results.push(
      issue({
        key: "maintenance-runs-stuck",
        category: "maintenance",
        severity: "warning",
        title: "Maintenance runs appear stuck",
        humanSummary: `${staleRunningRuns.length} maintenance run has been running for over one hour.`,
        technicalDetails: { runIds: staleRunningRuns.map((run) => run.id) },
        suggestedAction: "Mark stale runs as failed or investigate server errors."
      })
    );
  }

  return results.map((result) => ({
    ...result,
    suggestedAction: result.suggestedAction,
    technicalDetails: result.technicalDetails,
    humanSummary: result.humanSummary
  }));
}

export async function runMaintenanceChecks(
  context: MaintenanceCheckContext
): Promise<MaintenanceCheckResult[]> {
  return runIsolatedMaintenanceChecks(context, [collectBuiltInMaintenanceChecks]);
}

export function toMaintenanceIssueInput(
  result: MaintenanceCheckResult,
  runId: string,
  detectedAt: string
): Omit<MaintenanceIssue, "id" | "created_at" | "updated_at"> {
  const fingerprint = `${result.key}:${result.affectedRecordType ?? "system"}:${result.affectedRecordId ?? "global"}`;
  return {
    maintenance_run_id: runId,
    check_key: result.key,
    category: result.category,
    severity: result.severity,
    title: result.title,
    human_summary: result.humanSummary,
    technical_details: result.technicalDetails,
    affected_record_type: result.affectedRecordType ?? null,
    affected_record_id: result.affectedRecordId ?? null,
    suggested_action: result.suggestedAction,
    codex_repair_prompt: buildCodexRepairPrompt({
      title: result.title,
      severity: result.severity,
      category: result.category,
      affected: [result.affectedRecordType, result.affectedRecordId].filter(Boolean).join(":"),
      evidence: result.humanSummary,
      expected: result.suggestedAction,
      suggestedAction: result.suggestedAction
    }),
    status: "open",
    fingerprint,
    first_detected_at: detectedAt,
    last_detected_at: detectedAt,
    resolved_at: null,
    resolution_note: null
  };
}
