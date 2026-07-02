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
  | "Manual/fallback extraction only"
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
