import type { Study } from "@/lib/types";

export type PublicStudy = Pick<
  Study,
  | "id"
  | "platform"
  | "estimated_duration"
  | "study_type"
  | "portfolio_classification"
  | "recommended_section"
  | "portfolio_score"
  | "safe_public_title"
  | "safe_public_description"
  | "case_study_summary"
  | "skills_demonstrated"
  | "linkedin_featured_title"
  | "linkedin_featured_description"
  | "public_publish_recommendation"
  | "created_at"
  | "published_at"
>;

export function toPublicStudy(study: Study): PublicStudy {
  return {
    id: study.id,
    platform: study.platform,
    estimated_duration: study.estimated_duration,
    study_type: study.study_type,
    portfolio_classification: study.portfolio_classification,
    recommended_section: study.recommended_section,
    portfolio_score: study.portfolio_score,
    safe_public_title: study.safe_public_title,
    safe_public_description: study.safe_public_description,
    case_study_summary: study.case_study_summary,
    skills_demonstrated: study.skills_demonstrated,
    linkedin_featured_title: study.linkedin_featured_title,
    linkedin_featured_description: study.linkedin_featured_description,
    public_publish_recommendation: study.public_publish_recommendation,
    created_at: study.created_at,
    published_at: study.published_at
  };
}

export function isPublicPortfolioStudy(
  study: Pick<Study, "portfolio_classification" | "portfolio_score">
) {
  return (
    study.portfolio_score >= 30 &&
    study.portfolio_classification !== "Record only" &&
    study.portfolio_classification !== "Do not add"
  );
}

export function toPublicStudies(studies: Study[]) {
  return studies.filter(isPublicPortfolioStudy).map(toPublicStudy);
}
