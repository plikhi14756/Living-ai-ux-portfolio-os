import type {
  DuplicateAuditLog,
  MaintenanceIssue,
  MaintenanceRun,
  NotificationPreferences,
  Release,
  Study
} from "@/lib/types";
import type { MaintenanceCheckContext } from "@/lib/portfolio-operations/maintenance/registry";

export function study(overrides: Partial<Study> = {}): Study {
  const now = "2026-07-13T10:00:00.000Z";
  return {
    id: "study-1",
    platform: "Prolific",
    study_title: "AI Assistant Prototype Feedback",
    visible_topic: "AI assistant usability",
    estimated_duration: "30 mins",
    reward: "$5.00",
    study_type: "Prototype test",
    approval_status: "approved",
    what_i_did: "Gave product feedback",
    confidentiality_risk: "low",
    portfolio_classification: "Supporting portfolio bullet",
    recommended_section: "AI Evaluation Experience",
    portfolio_score: 55,
    safe_public_title: "AI Assistant Prototype Feedback",
    safe_public_description: "Confidential AI assistant evaluation summarized safely.",
    case_study_summary: "",
    skills_demonstrated: ["AI evaluation"],
    linkedin_featured_title: "AI UX Evaluation",
    linkedin_featured_description: "Safe summary",
    public_publish_recommendation: "Can publish as portfolio entry",
    analysis_status: "OpenAI analyzed successfully",
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 85,
    missing_questions: [],
    duplicate_fingerprint: null,
    duplicate_status: "clear",
    superseded_by: null,
    superseded_at: null,
    last_duplicate_check_at: null,
    created_at: now,
    updated_at: now,
    published_at: now,
    ...overrides
  };
}

export function duplicateLog(overrides: Partial<DuplicateAuditLog> = {}): DuplicateAuditLog {
  const now = "2026-07-13T10:00:00.000Z";
  return {
    id: "dup-1",
    candidate_entry_id: "study-2",
    matched_entry_id: "study-1",
    detected_at: now,
    resolved_at: null,
    detection_type: "probable",
    similarity_score: 0.9,
    field_comparison: {},
    resolution: "pending",
    winning_entry_id: null,
    losing_entry_id: null,
    resolution_note: "",
    created_by: "admin",
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

export function notificationPreferences(
  overrides: Partial<NotificationPreferences> = {}
): NotificationPreferences {
  const now = "2026-07-13T10:00:00.000Z";
  return {
    id: "prefs-1",
    owner_key: "primary-owner",
    notification_email: null,
    timezone: "America/Halifax",
    weekly_maintenance_enabled: true,
    monthly_design_review_enabled: true,
    critical_alerts_enabled: true,
    weekly_day_of_week: 1,
    monthly_day_of_month: 1,
    preferred_local_hour: 10,
    last_weekly_email_at: null,
    last_monthly_email_at: null,
    last_critical_email_at: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

export function maintenanceRun(overrides: Partial<MaintenanceRun> = {}): MaintenanceRun {
  const now = "2026-07-13T10:00:00.000Z";
  return {
    id: "run-1",
    run_type: "manual",
    status: "completed",
    started_at: now,
    completed_at: now,
    overall_status: "healthy",
    summary: {},
    issue_count: 0,
    critical_count: 0,
    warning_count: 0,
    info_count: 0,
    initiated_by: "admin",
    error_message: null,
    idempotency_key: null,
    created_at: now,
    ...overrides
  };
}

export function maintenanceIssue(overrides: Partial<MaintenanceIssue> = {}): MaintenanceIssue {
  const now = "2026-07-13T10:00:00.000Z";
  return {
    id: "issue-1",
    maintenance_run_id: "run-1",
    check_key: "privacy",
    category: "privacy",
    severity: "critical",
    title: "Privacy finding",
    human_summary: "Public copy contains a sensitive term.",
    technical_details: {},
    affected_record_type: "study",
    affected_record_id: "study-1",
    suggested_action: "Rewrite public copy.",
    codex_repair_prompt: "Repair prompt",
    status: "open",
    fingerprint: "privacy:study:study-1",
    first_detected_at: now,
    last_detected_at: now,
    resolved_at: null,
    resolution_note: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

export function release(overrides: Partial<Release> = {}): Release {
  const now = "2026-07-13T10:00:00.000Z";
  return {
    id: "release-1",
    version: "0.2.0",
    title: "Portfolio Operations",
    summary: "Operations release",
    change_items: [],
    release_type: "minor",
    published_at: now,
    deployment_reference: "portfolio-operations-system",
    is_active: true,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

export function maintenanceContext(
  overrides: Partial<MaintenanceCheckContext> = {}
): MaintenanceCheckContext {
  return {
    studies: [],
    publicStudyIds: new Set(),
    duplicateLogs: [],
    maintenanceRuns: [],
    notificationPreferences: notificationPreferences(),
    notificationDeliveries: [],
    releases: [release()],
    latestPdfUrl: "/api/pdf/latest",
    ...overrides
  };
}
