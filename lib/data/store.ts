import type {
  AnalysisStatus,
  DesignReview,
  DuplicateAuditLog,
  MaintenanceIssue,
  MaintenanceIssueStatus,
  MaintenanceRun,
  MaintenanceReport,
  Notification,
  NotificationDelivery,
  NotificationPreferences,
  OperationsAuditLog,
  Release,
  ReleaseView,
  SiteSetting,
  Study,
  StudyInput,
  StudyUpdate
} from "@/lib/types";
import {
  normalizeStudyRecommendation
} from "@/lib/ai/scoring";
import { isProductionDeployment } from "@/lib/env";
import {
  isPublicPortfolioStudy,
  toPublicStudies,
  type PublicStudy
} from "@/lib/public-study";
import {
  getSupabaseAdmin,
  supabaseConfigurationError
} from "@/lib/supabase/server";
import {
  readLocalDb as readLocalDbUnsafe,
  writeLocalDb as writeLocalDbUnsafe
} from "@/lib/data/local-store";

const TABLES = {
  studies: "studies",
  designReviews: "design_reviews",
  maintenanceReports: "maintenance_reports",
  notifications: "notifications",
  publicStudies: "approved_portfolio_entries",
  siteSettings: "site_settings",
  duplicateAuditLog: "duplicate_audit_log",
  maintenanceRuns: "maintenance_runs",
  maintenanceIssues: "maintenance_issues",
  notificationPreferences: "notification_preferences",
  notificationDeliveries: "notification_deliveries",
  releases: "releases",
  releaseViews: "release_views",
  operationsAuditLog: "operations_audit_log"
} as const;

const PUBLIC_STUDY_COLUMNS = [
  "id",
  "platform",
  "estimated_duration",
  "study_type",
  "portfolio_classification",
  "recommended_section",
  "portfolio_score",
  "safe_public_title",
  "safe_public_description",
  "case_study_summary",
  "skills_demonstrated",
  "linkedin_featured_title",
  "linkedin_featured_description",
  "public_publish_recommendation",
  "created_at",
  "published_at"
].join(", ");

function timestamp() {
  return new Date().toISOString();
}

function sortNewest<T extends { created_at: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function normalizeAnalysisStatus(status: string | null | undefined): AnalysisStatus {
  if (status === "Manual analysis completed") return status;
  if (status === "OpenAI analyzed successfully") return status;
  if (status === "Re-analysis needed") return status;
  return "Fallback/manual extraction only";
}

function assertLocalFallbackAllowed() {
  if (isProductionDeployment()) {
    throw new Error(
      supabaseConfigurationError() ??
        "Supabase database is required in production. Local fallback storage is disabled for launch."
    );
  }
}

async function readLocalDb() {
  assertLocalFallbackAllowed();
  return readLocalDbUnsafe();
}

async function writeLocalDb(...args: Parameters<typeof writeLocalDbUnsafe>) {
  assertLocalFallbackAllowed();
  return writeLocalDbUnsafe(...args);
}

function normalizeStudyRecord(study: Study): Study {
  const visibleTopic =
    ["survey", "study", "questionnaire"].includes(
      String(study.visible_topic ?? "").trim().toLowerCase()
    ) && study.study_title.toLowerCase().includes("travel motivation")
      ? "international travel motivation"
      : study.visible_topic;
  const recommendation = normalizeStudyRecommendation({
    platform: study.platform,
    title: study.study_title,
    topic: visibleTopic,
    notes: [study.what_i_did, study.safe_public_title, study.safe_public_description].join(" "),
    studyType: study.study_type,
    duration: study.estimated_duration,
    confidentialityRisk: study.confidentiality_risk,
    portfolioClassification: study.portfolio_classification,
    portfolioScore: study.portfolio_score,
    recommendedSection: study.recommended_section,
    safePublicTitle: study.safe_public_title,
    safePublicDescription: study.safe_public_description,
    publicPublishRecommendation: study.public_publish_recommendation,
    linkedinFeaturedTitle: study.linkedin_featured_title,
    linkedinFeaturedDescription: study.linkedin_featured_description
  });
  const knownVisibleFields = [
    study.platform,
    study.study_title,
    study.visible_topic,
    study.estimated_duration,
    study.reward
  ].filter((value) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized && normalized !== "unknown" && normalized !== "ai analysis pending";
  }).length;
  const inferredAnalysisStatus =
    normalizeAnalysisStatus(study.analysis_status) ??
    (knownVisibleFields >= 3
      ? "OpenAI analyzed successfully"
      : "Re-analysis needed");
  const aiConfidence =
    inferredAnalysisStatus === "Re-analysis needed"
      ? 0
      : Math.max(
          Number(study.ai_confidence ?? 0),
          knownVisibleFields >= 5
            ? 82
            : knownVisibleFields >= 4
              ? 75
              : knownVisibleFields >= 3
                ? 65
                : 35
        );

  return {
    ...study,
    visible_topic: visibleTopic,
    portfolio_classification: recommendation.portfolio_classification,
    portfolio_score: recommendation.portfolio_score,
    recommended_section: recommendation.recommended_section,
    public_publish_recommendation: recommendation.public_publish_recommendation,
    analysis_status: inferredAnalysisStatus,
    ai_confidence: aiConfidence,
    linkedin_featured_title: recommendation.linkedin_featured_title,
    linkedin_featured_description: recommendation.linkedin_featured_description
  };
}

function normalizeStudy(input: StudyInput): Study {
  const now = timestamp();
  const recommendation = normalizeStudyRecommendation({
    platform: input.platform,
    title: input.study_title,
    topic: input.visible_topic,
    notes: [input.what_i_did, input.safe_public_title, input.safe_public_description].join(" "),
    studyType: input.study_type,
    duration: input.estimated_duration,
    confidentialityRisk: input.confidentiality_risk,
    portfolioClassification: input.portfolio_classification,
    portfolioScore: input.portfolio_score,
    recommendedSection: input.recommended_section,
    safePublicTitle: input.safe_public_title,
    safePublicDescription: input.safe_public_description,
    publicPublishRecommendation: input.public_publish_recommendation,
    linkedinFeaturedTitle: input.linkedin_featured_title,
    linkedinFeaturedDescription: input.linkedin_featured_description
  });

  return normalizeStudyRecord({
    id: input.id ?? crypto.randomUUID(),
    platform: input.platform || "unknown",
    study_title: input.study_title || "unknown",
    visible_topic: input.visible_topic || "unknown",
    estimated_duration: input.estimated_duration || "unknown",
    reward: input.reward || "unknown",
    study_type: input.study_type || "unknown",
    approval_status: input.approval_status || "unknown",
    what_i_did: input.what_i_did || "unknown",
    confidentiality_risk: input.confidentiality_risk || "unknown",
    portfolio_classification: recommendation.portfolio_classification,
    recommended_section: recommendation.recommended_section,
    portfolio_score: recommendation.portfolio_score,
    safe_public_title: input.safe_public_title || "Untitled research experience",
    safe_public_description:
      input.safe_public_description || "A safely summarized research experience.",
    case_study_summary: input.case_study_summary || "",
    skills_demonstrated: input.skills_demonstrated || [],
    linkedin_featured_title: recommendation.linkedin_featured_title,
    linkedin_featured_description: recommendation.linkedin_featured_description,
    public_publish_recommendation: recommendation.public_publish_recommendation,
    analysis_status: normalizeAnalysisStatus(input.analysis_status),
    source_type: input.source_type,
    status: input.status || "pending",
    screenshot_urls: input.screenshot_urls || [],
    ai_confidence: input.ai_confidence ?? 0,
    missing_questions: input.missing_questions || [],
    duplicate_fingerprint: input.duplicate_fingerprint ?? null,
    duplicate_status: input.duplicate_status ?? "clear",
    superseded_by: input.superseded_by ?? null,
    superseded_at: input.superseded_at ?? null,
    last_duplicate_check_at: input.last_duplicate_check_at ?? null,
    created_at: now,
    updated_at: now,
    published_at: input.published_at ?? null
  });
}

export async function listStudies(filters?: {
  status?: Study["status"];
  approvedOnly?: boolean;
}) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let query = supabase
      .from(TABLES.studies)
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.approvedOnly) {
      query = query.eq("status", "approved");
    }

    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Study[]).map(normalizeStudyRecord);
  }

  const db = await readLocalDb();
  let studies = db.studies;
  if (filters?.status) studies = studies.filter((item) => item.status === filters.status);
  if (filters?.approvedOnly) studies = studies.filter((item) => item.status === "approved");
  return sortNewest(studies.map(normalizeStudyRecord));
}

export async function listPublicStudies(): Promise<PublicStudy[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.publicStudies)
      .select(PUBLIC_STUDY_COLUMNS)
      .order("published_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as unknown as PublicStudy[]).filter(isPublicPortfolioStudy);
  }

  const db = await readLocalDb();
  return toPublicStudies(
    sortNewest(
      db.studies
        .filter((study) => study.status === "approved")
        .map(normalizeStudyRecord)
    )
  );
}

export async function getStudy(id: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.studies)
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return normalizeStudyRecord(data as Study);
  }

  const db = await readLocalDb();
  const study = db.studies.find((item) => item.id === id);
  return study ? normalizeStudyRecord(study) : null;
}

export async function createStudy(input: StudyInput) {
  const study = normalizeStudy(input);
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.studies)
      .insert(study)
      .select("*")
      .single();
    if (error) throw error;
    return normalizeStudyRecord(data as Study);
  }

  const db = await readLocalDb();
  db.studies.unshift(study);
  await writeLocalDb(db);
  return normalizeStudyRecord(study);
}

export async function updateStudy(id: string, update: StudyUpdate) {
  const updated_at = timestamp();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.studies)
      .update({ ...update, updated_at })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return normalizeStudyRecord(data as Study);
  }

  const db = await readLocalDb();
  const index = db.studies.findIndex((study) => study.id === id);
  if (index === -1) return null;
  db.studies[index] = {
    ...db.studies[index],
    ...update,
    updated_at
  };
  await writeLocalDb(db);
  return normalizeStudyRecord(db.studies[index]);
}

export async function listNotifications() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.notifications)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    return (data ?? []) as Notification[];
  }

  const db = await readLocalDb();
  return sortNewest(db.notifications).slice(0, 40);
}

export async function createNotification(input: Omit<Notification, "id" | "created_at">) {
  const notification: Notification = {
    ...input,
    id: crypto.randomUUID(),
    created_at: timestamp()
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.notifications)
      .insert(notification)
      .select("*")
      .single();
    if (error) throw error;
    return data as Notification;
  }

  const db = await readLocalDb();
  db.notifications.unshift(notification);
  await writeLocalDb(db);
  return notification;
}

export async function markNotificationsRead() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase
      .from(TABLES.notifications)
      .update({ read: true })
      .eq("read", false);
    if (error) throw error;
    return;
  }

  const db = await readLocalDb();
  db.notifications = db.notifications.map((notification) => ({
    ...notification,
    read: true
  }));
  await writeLocalDb(db);
}

export async function listDesignReviews() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.designReviews)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DesignReview[];
  }

  const db = await readLocalDb();
  return sortNewest(db.design_reviews);
}

export async function createDesignReview(
  input: Omit<DesignReview, "id" | "created_at" | "approved_at">
) {
  const review: DesignReview = {
    ...input,
    id: crypto.randomUUID(),
    created_at: timestamp(),
    approved_at: null
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.designReviews)
      .insert(review)
      .select("*")
      .single();
    if (error) throw error;
    return data as DesignReview;
  }

  const db = await readLocalDb();
  db.design_reviews.unshift(review);
  await writeLocalDb(db);
  return review;
}

export async function updateDesignReview(
  id: string,
  update: Partial<DesignReview>
) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.designReviews)
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as DesignReview;
  }

  const db = await readLocalDb();
  const index = db.design_reviews.findIndex((review) => review.id === id);
  if (index === -1) return null;
  db.design_reviews[index] = { ...db.design_reviews[index], ...update };
  await writeLocalDb(db);
  return db.design_reviews[index];
}

export async function listMaintenanceReports() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.maintenanceReports)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as MaintenanceReport[];
  }

  const db = await readLocalDb();
  return sortNewest(db.maintenance_reports);
}

export async function createMaintenanceReport(
  input: Omit<MaintenanceReport, "id" | "created_at">
) {
  const report: MaintenanceReport = {
    ...input,
    id: crypto.randomUUID(),
    created_at: timestamp()
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.maintenanceReports)
      .insert(report)
      .select("*")
      .single();
    if (error) throw error;
    return data as MaintenanceReport;
  }

  const db = await readLocalDb();
  db.maintenance_reports.unshift(report);
  await writeLocalDb(db);
  return report;
}

export async function getSetting<T = unknown>(key: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.siteSettings)
      .select("*")
      .eq("key", key)
      .single();
    if (error) return null;
    return (data as SiteSetting).value as T;
  }

  const db = await readLocalDb();
  return (db.site_settings.find((setting) => setting.key === key)?.value ??
    null) as T | null;
}

export async function setSetting(key: string, value: unknown) {
  const updated_at = timestamp();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.siteSettings)
      .upsert({ key, value, updated_at }, { onConflict: "key" })
      .select("*")
      .single();
    if (error) throw error;
    return data as SiteSetting;
  }

  const db = await readLocalDb();
  const existing = db.site_settings.findIndex((setting) => setting.key === key);
  const setting: SiteSetting = {
    id: existing >= 0 ? db.site_settings[existing].id : crypto.randomUUID(),
    key,
    value,
    updated_at
  };

  if (existing >= 0) {
    db.site_settings[existing] = setting;
  } else {
    db.site_settings.push(setting);
  }

  await writeLocalDb(db);
  return setting;
}

export async function listDuplicateAuditLogs() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.duplicateAuditLog)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DuplicateAuditLog[];
  }

  const db = await readLocalDb();
  return sortNewest(db.duplicate_audit_log);
}

export async function getDuplicateAuditLog(id: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.duplicateAuditLog)
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as DuplicateAuditLog;
  }

  const db = await readLocalDb();
  return db.duplicate_audit_log.find((log) => log.id === id) ?? null;
}

export async function createDuplicateAuditLog(
  input: Omit<DuplicateAuditLog, "id" | "created_at" | "updated_at">
) {
  const now = timestamp();
  const log: DuplicateAuditLog = {
    ...input,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now
  };
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.duplicateAuditLog)
      .insert(log)
      .select("*")
      .single();
    if (error) throw error;
    return data as DuplicateAuditLog;
  }

  const db = await readLocalDb();
  db.duplicate_audit_log.unshift(log);
  await writeLocalDb(db);
  return log;
}

export async function updateDuplicateAuditLog(
  id: string,
  update: Partial<DuplicateAuditLog>
) {
  const updated_at = timestamp();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.duplicateAuditLog)
      .update({ ...update, updated_at })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as DuplicateAuditLog;
  }

  const db = await readLocalDb();
  const index = db.duplicate_audit_log.findIndex((log) => log.id === id);
  if (index === -1) return null;
  db.duplicate_audit_log[index] = {
    ...db.duplicate_audit_log[index],
    ...update,
    updated_at
  };
  await writeLocalDb(db);
  return db.duplicate_audit_log[index];
}

export async function listMaintenanceRuns() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.maintenanceRuns)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as MaintenanceRun[];
  }

  const db = await readLocalDb();
  return sortNewest(db.maintenance_runs);
}

export async function createMaintenanceRun(
  input: Omit<MaintenanceRun, "id" | "created_at">
) {
  const run: MaintenanceRun = {
    ...input,
    id: crypto.randomUUID(),
    created_at: timestamp()
  };
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.maintenanceRuns)
      .insert(run)
      .select("*")
      .single();
    if (error) throw error;
    return data as MaintenanceRun;
  }

  const db = await readLocalDb();
  db.maintenance_runs.unshift(run);
  await writeLocalDb(db);
  return run;
}

export async function updateMaintenanceRun(id: string, update: Partial<MaintenanceRun>) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.maintenanceRuns)
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as MaintenanceRun;
  }

  const db = await readLocalDb();
  const index = db.maintenance_runs.findIndex((run) => run.id === id);
  if (index === -1) return null;
  db.maintenance_runs[index] = { ...db.maintenance_runs[index], ...update };
  await writeLocalDb(db);
  return db.maintenance_runs[index];
}

export async function listMaintenanceIssues(filters?: {
  status?: MaintenanceIssueStatus;
  runId?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let query = supabase
      .from(TABLES.maintenanceIssues)
      .select("*")
      .order("last_detected_at", { ascending: false });
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.runId) query = query.eq("maintenance_run_id", filters.runId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MaintenanceIssue[];
  }

  const db = await readLocalDb();
  let issues = db.maintenance_issues;
  if (filters?.status) issues = issues.filter((issue) => issue.status === filters.status);
  if (filters?.runId) {
    issues = issues.filter((issue) => issue.maintenance_run_id === filters.runId);
  }
  return [...issues].sort(
    (a, b) =>
      new Date(b.last_detected_at).getTime() - new Date(a.last_detected_at).getTime()
  );
}

export async function createMaintenanceIssue(
  input: Omit<MaintenanceIssue, "id" | "created_at" | "updated_at">
) {
  const now = timestamp();
  const issue: MaintenanceIssue = {
    ...input,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now
  };
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.maintenanceIssues)
      .insert(issue)
      .select("*")
      .single();
    if (error) throw error;
    return data as MaintenanceIssue;
  }

  const db = await readLocalDb();
  db.maintenance_issues.unshift(issue);
  await writeLocalDb(db);
  return issue;
}

export async function updateMaintenanceIssue(
  id: string,
  update: Partial<MaintenanceIssue>
) {
  const updated_at = timestamp();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.maintenanceIssues)
      .update({ ...update, updated_at })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as MaintenanceIssue;
  }

  const db = await readLocalDb();
  const index = db.maintenance_issues.findIndex((issue) => issue.id === id);
  if (index === -1) return null;
  db.maintenance_issues[index] = {
    ...db.maintenance_issues[index],
    ...update,
    updated_at
  };
  await writeLocalDb(db);
  return db.maintenance_issues[index];
}

export async function getNotificationPreferences() {
  const fallback: Omit<NotificationPreferences, "id" | "created_at" | "updated_at"> = {
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
    last_critical_email_at: null
  };
  const now = timestamp();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.notificationPreferences)
      .select("*")
      .eq("owner_key", "primary-owner")
      .single();

    if (!error && data) return data as NotificationPreferences;

    const { data: created, error: insertError } = await supabase
      .from(TABLES.notificationPreferences)
      .insert({ ...fallback, created_at: now, updated_at: now })
      .select("*")
      .single();
    if (insertError) throw insertError;
    return created as NotificationPreferences;
  }

  const db = await readLocalDb();
  let preferences = db.notification_preferences.find(
    (item) => item.owner_key === "primary-owner"
  );
  if (!preferences) {
    preferences = {
      ...fallback,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now
    };
    db.notification_preferences.push(preferences);
    await writeLocalDb(db);
  }
  return preferences;
}

export async function updateNotificationPreferences(
  update: Partial<NotificationPreferences>
) {
  const existing = await getNotificationPreferences();
  const updated_at = timestamp();
  const next = { ...existing, ...update, owner_key: "primary-owner", updated_at };
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.notificationPreferences)
      .upsert(next, { onConflict: "owner_key" })
      .select("*")
      .single();
    if (error) throw error;
    return data as NotificationPreferences;
  }

  const db = await readLocalDb();
  const index = db.notification_preferences.findIndex(
    (item) => item.owner_key === "primary-owner"
  );
  if (index >= 0) db.notification_preferences[index] = next;
  else db.notification_preferences.push(next);
  await writeLocalDb(db);
  return next;
}

export async function listNotificationDeliveries() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.notificationDeliveries)
      .select("*")
      .order("attempted_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as NotificationDelivery[];
  }

  const db = await readLocalDb();
  return [...db.notification_deliveries].sort(
    (a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
  );
}

export async function createNotificationDelivery(
  input: Omit<NotificationDelivery, "id" | "created_at">
) {
  const delivery: NotificationDelivery = {
    ...input,
    id: crypto.randomUUID(),
    created_at: timestamp()
  };
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.notificationDeliveries)
      .insert(delivery)
      .select("*")
      .single();
    if (error) throw error;
    return data as NotificationDelivery;
  }

  const db = await readLocalDb();
  db.notification_deliveries.unshift(delivery);
  await writeLocalDb(db);
  return delivery;
}

export async function listReleases() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.releases)
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Release[];
  }

  const db = await readLocalDb();
  return [...db.releases].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export async function upsertRelease(input: Omit<Release, "id" | "created_at" | "updated_at">) {
  const now = timestamp();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.releases)
      .upsert({ ...input, updated_at: now }, { onConflict: "version" })
      .select("*")
      .single();
    if (error) throw error;
    return data as Release;
  }

  const db = await readLocalDb();
  const index = db.releases.findIndex((release) => release.version === input.version);
  const release: Release = {
    ...input,
    id: index >= 0 ? db.releases[index].id : crypto.randomUUID(),
    created_at: index >= 0 ? db.releases[index].created_at : now,
    updated_at: now
  };
  if (index >= 0) db.releases[index] = release;
  else db.releases.unshift(release);
  await writeLocalDb(db);
  return release;
}

export async function listReleaseViews(viewerKey = "primary-admin") {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.releaseViews)
      .select("*")
      .eq("viewer_key", viewerKey);
    if (error) throw error;
    return (data ?? []) as ReleaseView[];
  }

  const db = await readLocalDb();
  return db.release_views.filter((view) => view.viewer_key === viewerKey);
}

export async function upsertReleaseView(
  releaseId: string,
  viewerKey: string,
  update: Partial<ReleaseView>
) {
  const now = timestamp();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: existing } = await supabase
      .from(TABLES.releaseViews)
      .select("*")
      .eq("release_id", releaseId)
      .eq("viewer_key", viewerKey)
      .single();
    const row = {
      ...(existing ?? {}),
      release_id: releaseId,
      viewer_key: viewerKey,
      first_viewed_at: existing?.first_viewed_at ?? now,
      last_viewed_at: now,
      created_at: existing?.created_at ?? now,
      ...update
    };
    const { data, error } = await supabase
      .from(TABLES.releaseViews)
      .upsert(row, { onConflict: "release_id,viewer_key" })
      .select("*")
      .single();
    if (error) throw error;
    return data as ReleaseView;
  }

  const db = await readLocalDb();
  const index = db.release_views.findIndex(
    (view) => view.release_id === releaseId && view.viewer_key === viewerKey
  );
  const existing = index >= 0 ? db.release_views[index] : null;
  const row: ReleaseView = {
    id: existing?.id ?? crypto.randomUUID(),
    release_id: releaseId,
    viewer_key: viewerKey,
    first_viewed_at: existing?.first_viewed_at ?? now,
    last_viewed_at: now,
    dismissed_at: existing?.dismissed_at ?? null,
    created_at: existing?.created_at ?? now,
    ...update
  };
  if (index >= 0) db.release_views[index] = row;
  else db.release_views.push(row);
  await writeLocalDb(db);
  return row;
}

export async function createOperationsAuditLog(
  input: Omit<OperationsAuditLog, "id" | "created_at">
) {
  const audit: OperationsAuditLog = {
    ...input,
    id: crypto.randomUUID(),
    created_at: timestamp()
  };
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.operationsAuditLog)
      .insert(audit)
      .select("*")
      .single();
    if (error) throw error;
    return data as OperationsAuditLog;
  }

  const db = await readLocalDb();
  db.operations_audit_log.unshift(audit);
  await writeLocalDb(db);
  return audit;
}

export async function listOperationsAuditLogs() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLES.operationsAuditLog)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) throw error;
    return (data ?? []) as OperationsAuditLog[];
  }

  const db = await readLocalDb();
  return sortNewest(db.operations_audit_log).slice(0, 80);
}

export async function listAllOperationsData() {
  const [
    duplicateLogs,
    maintenanceRuns,
    maintenanceIssues,
    notificationPreferences,
    notificationDeliveries,
    releases,
    releaseViews,
    operationsAuditLogs
  ] = await Promise.all([
    listDuplicateAuditLogs(),
    listMaintenanceRuns(),
    listMaintenanceIssues(),
    getNotificationPreferences(),
    listNotificationDeliveries(),
    listReleases(),
    listReleaseViews(),
    listOperationsAuditLogs()
  ]);

  return {
    duplicateLogs,
    maintenanceRuns,
    maintenanceIssues,
    notificationPreferences,
    notificationDeliveries,
    releases,
    releaseViews,
    operationsAuditLogs
  };
}
