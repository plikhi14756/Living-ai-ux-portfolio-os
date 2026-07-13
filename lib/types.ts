export type StudyStatus = "pending" | "approved" | "rejected" | "record_only";

export type StudyClassification =
  | "Major portfolio project"
  | "Strong supporting entry"
  | "Supporting portfolio bullet"
  | "Record only"
  | "Do not add";

export type ConfidentialityRisk = "low" | "medium" | "high" | "unknown";

export type AnalysisStatus =
  | "OpenAI analyzed successfully"
  | "Manual analysis completed"
  | "Fallback/manual extraction only"
  | "Re-analysis needed";

export type Study = {
  id: string;
  platform: string;
  study_title: string;
  visible_topic: string;
  estimated_duration: string;
  reward: string;
  study_type: string;
  approval_status: string;
  what_i_did: string;
  confidentiality_risk: ConfidentialityRisk;
  portfolio_classification: StudyClassification;
  recommended_section: string;
  portfolio_score: number;
  safe_public_title: string;
  safe_public_description: string;
  case_study_summary: string;
  skills_demonstrated: string[];
  linkedin_featured_title: string;
  linkedin_featured_description: string;
  public_publish_recommendation: string;
  analysis_status: AnalysisStatus;
  source_type: "screenshot" | "manual";
  status: StudyStatus;
  screenshot_urls: string[];
  ai_confidence: number;
  missing_questions: string[];
  duplicate_fingerprint?: string | null;
  duplicate_status?:
    | "clear"
    | "possible_duplicate"
    | "probable_duplicate"
    | "confirmed_duplicate"
    | "intentionally_kept"
    | "superseded"
    | null;
  superseded_by?: string | null;
  superseded_at?: string | null;
  last_duplicate_check_at?: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type StudyInput = Omit<
  Study,
  "id" | "created_at" | "updated_at" | "published_at"
> & {
  id?: string;
  published_at?: string | null;
};

export type StudyUpdate = Partial<
  Omit<Study, "id" | "created_at" | "updated_at">
>;

export type DesignReview = {
  id: string;
  review_month: string;
  overall_score: number;
  recommendation_type: "keep current design" | "small refresh" | "major refresh";
  recommendations: unknown;
  preview_changes: unknown;
  status: "pending" | "approved" | "rejected" | "kept_current";
  created_at: string;
  approved_at: string | null;
};

export type MaintenanceReport = {
  id: string;
  report_month: string;
  broken_links: unknown;
  duplicate_entries: unknown;
  confidentiality_flags: unknown;
  pdf_status: string;
  seo_status: string;
  mobile_status: string;
  recommendations: unknown;
  created_at: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  related_study_id: string | null;
  created_at: string;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
};

export type DuplicateDetectionType = "exact" | "probable" | "possible";

export type DuplicateResolution =
  | "pending"
  | "replaced_existing"
  | "kept_new"
  | "kept_both"
  | "cancelled"
  | "false_positive";

export type DuplicateAuditLog = {
  id: string;
  candidate_entry_id: string | null;
  matched_entry_id: string | null;
  detected_at: string;
  resolved_at: string | null;
  detection_type: DuplicateDetectionType;
  similarity_score: number;
  field_comparison: unknown;
  resolution: DuplicateResolution;
  winning_entry_id: string | null;
  losing_entry_id: string | null;
  resolution_note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type MaintenanceRun = {
  id: string;
  run_type: "manual" | "weekly" | "monthly_design_review" | "scheduled_dispatch";
  status: "running" | "completed" | "partially_failed" | "failed";
  started_at: string;
  completed_at: string | null;
  overall_status: "healthy" | "attention" | "critical";
  summary: unknown;
  issue_count: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  initiated_by: string;
  error_message: string | null;
  idempotency_key: string | null;
  created_at: string;
};

export type MaintenanceSeverity = "critical" | "warning" | "info";

export type MaintenanceIssueStatus = "open" | "acknowledged" | "resolved" | "ignored";

export type MaintenanceIssue = {
  id: string;
  maintenance_run_id: string | null;
  check_key: string;
  category: string;
  severity: MaintenanceSeverity;
  title: string;
  human_summary: string;
  technical_details: unknown;
  affected_record_type: string | null;
  affected_record_id: string | null;
  suggested_action: string;
  codex_repair_prompt: string;
  status: MaintenanceIssueStatus;
  fingerprint: string;
  first_detected_at: string;
  last_detected_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationPreferences = {
  id: string;
  owner_key: string;
  notification_email: string | null;
  timezone: string;
  weekly_maintenance_enabled: boolean;
  monthly_design_review_enabled: boolean;
  critical_alerts_enabled: boolean;
  weekly_day_of_week: number;
  monthly_day_of_month: number;
  preferred_local_hour: number;
  last_weekly_email_at: string | null;
  last_monthly_email_at: string | null;
  last_critical_email_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationDelivery = {
  id: string;
  notification_type: string;
  maintenance_run_id: string | null;
  maintenance_issue_id: string | null;
  recipient: string | null;
  provider: string;
  provider_message_id: string | null;
  status: "queued" | "sent" | "failed" | "skipped";
  subject: string;
  failure_reason: string | null;
  idempotency_key: string | null;
  attempted_at: string;
  sent_at: string | null;
  metadata: unknown;
  created_at: string;
};

export type Release = {
  id: string;
  version: string;
  title: string;
  summary: string;
  change_items: unknown;
  release_type: "major" | "minor" | "patch" | "maintenance";
  published_at: string;
  deployment_reference: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ReleaseView = {
  id: string;
  release_id: string;
  viewer_key: string;
  first_viewed_at: string;
  last_viewed_at: string;
  dismissed_at: string | null;
  created_at: string;
};

export type OperationsAuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor: string;
  before_state: unknown;
  after_state: unknown;
  metadata: unknown;
  created_at: string;
};
