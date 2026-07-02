import { NextResponse, type NextRequest } from "next/server";
import {
  analysisToStudyInput,
  analyzeStudyEvidence,
  manualStudyFieldsToNote,
  normalizeManualStudyFields
} from "@/lib/ai/analyze-study";
import { apiError } from "@/lib/api";
import { createNotification, createStudy } from "@/lib/data/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const selectedPlatform = String(body.platform ?? "");
    const manualFields = normalizeManualStudyFields({
      platform: selectedPlatform,
      study_title: body.study_title,
      estimated_duration: body.estimated_duration,
      reward: body.reward,
      what_i_did: body.what_i_did
    });
    const notes = [String(body.notes ?? "").trim(), manualStudyFieldsToNote(manualFields)]
      .filter(Boolean)
      .join("\n\n");

    if (!notes.trim()) {
      return NextResponse.json(
        { error: "Add at least one manual detail before analyzing." },
        { status: 400 }
      );
    }

    const analysis = await analyzeStudyEvidence({
      notes,
      selectedPlatform,
      manualFields,
      sourceType: "manual"
    });

    const study = await createStudy(
      analysisToStudyInput(analysis, {
        sourceType: "manual",
        screenshotUrls: []
      })
    );

    await createNotification({
      title: "Manual experience analyzed",
      message: `${study.safe_public_title} is ready for review.`,
      type: "manual_ready",
      read: false,
      related_study_id: study.id
    });

    return NextResponse.json({
      studyId: study.id,
      reviewUrl: `/admin/review/${study.id}`,
      analysis
    });
  } catch (error) {
    return apiError(error);
  }
}
