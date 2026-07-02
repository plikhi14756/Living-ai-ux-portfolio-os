import { NextResponse } from "next/server";
import { ORIGINAL_PORTFOLIO_STUDIES } from "@/lib/data/original-portfolio";
import { apiError } from "@/lib/api";
import { createNotification, createStudy, getStudy } from "@/lib/data/store";
import type { StudyInput } from "@/lib/types";

export const runtime = "nodejs";

function toStudyInput(study: (typeof ORIGINAL_PORTFOLIO_STUDIES)[number]): StudyInput {
  return {
    id: study.id,
    platform: study.platform,
    study_title: study.study_title,
    visible_topic: study.visible_topic,
    estimated_duration: study.estimated_duration,
    reward: study.reward,
    study_type: study.study_type,
    approval_status: study.approval_status,
    what_i_did: study.what_i_did,
    confidentiality_risk: study.confidentiality_risk,
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
    analysis_status: study.analysis_status,
    source_type: "manual",
    status: "approved",
    screenshot_urls: [],
    ai_confidence: 100,
    missing_questions: [],
    published_at: study.published_at
  };
}

export async function POST() {
  try {
    let imported = 0;
    let skipped = 0;

    for (const study of ORIGINAL_PORTFOLIO_STUDIES) {
      const existing = await getStudy(study.id);
      if (existing) {
        skipped += 1;
        continue;
      }

      await createStudy(toStudyInput(study));
      imported += 1;
    }

    await createNotification({
      title: "Original portfolio imported",
      message: `${imported} original portfolio entries imported, ${skipped} already present.`,
      type: "original_portfolio_import",
      read: false,
      related_study_id: null
    });

    return NextResponse.json({ imported, skipped });
  } catch (error) {
    return apiError(error);
  }
}
