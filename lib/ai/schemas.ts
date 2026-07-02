import { z } from "zod";

export const StudyAnalysisSchema = z.object({
  platform: z.string(),
  study_title: z.string(),
  visible_topic: z.string(),
  estimated_duration: z.string(),
  reward: z.string(),
  study_type: z.string(),
  approval_status: z.string(),
  what_i_did_guess: z.string(),
  confidentiality_risk: z.enum(["low", "medium", "high", "unknown"]),
  portfolio_classification: z.enum([
    "Major portfolio project",
    "Strong supporting entry",
    "Supporting portfolio bullet",
    "Record only",
    "Do not add"
  ]),
  recommended_section: z.string(),
  portfolio_score: z.number().min(0).max(100),
  safe_public_title: z.string(),
  safe_public_description: z.string(),
  case_study_summary: z.string(),
  skills_demonstrated: z.array(z.string()),
  linkedin_featured_title: z.string(),
  linkedin_featured_description: z.string(),
  public_publish_recommendation: z.string(),
  analysis_status: z.enum([
    "OpenAI analyzed successfully",
    "Manual/fallback extraction only",
    "Re-analysis needed"
  ]),
  ai_confidence: z.number().min(0).max(100),
  missing_questions: z.array(z.string())
});

export type StudyAnalysis = z.infer<typeof StudyAnalysisSchema>;

export const DesignReviewSchema = z.object({
  overall_score: z.number().min(0).max(100),
  recommendation_type: z.enum([
    "keep current design",
    "small refresh",
    "major refresh"
  ]),
  recommendations: z.array(z.string()),
  preview_changes: z.array(z.string()),
  risk_level: z.enum(["low", "medium", "high"]),
  reason: z.string()
});

export type DesignReviewAnalysis = z.infer<typeof DesignReviewSchema>;

export const MaintenanceReportSchema = z.object({
  broken_links: z.array(z.string()),
  duplicate_entries: z.array(z.string()),
  confidentiality_flags: z.array(z.string()),
  pdf_status: z.string(),
  seo_status: z.string(),
  mobile_status: z.string(),
  recommendations: z.array(z.string())
});

export type MaintenanceReportAnalysis = z.infer<typeof MaintenanceReportSchema>;
