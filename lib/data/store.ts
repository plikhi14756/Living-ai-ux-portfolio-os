import type {
  AnalysisStatus,
  DesignReview,
  MaintenanceReport,
  Notification,
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
  siteSettings: "site_settings"
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
