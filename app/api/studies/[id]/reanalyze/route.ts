import { NextResponse, type NextRequest } from "next/server";
import {
  analysisToStudyInput,
  analyzeStudyEvidence,
  isOpenAIQuotaError,
  OPENAI_QUOTA_MESSAGE
} from "@/lib/ai/analyze-study";
import { apiError } from "@/lib/api";
import {
  createNotification,
  getStudy,
  updateStudy
} from "@/lib/data/store";
import { loadStoredScreenshotsForAnalysis } from "@/lib/data/storage";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const study = await getStudy(id);

    if (!study) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    if (!study.screenshot_urls.length) {
      return NextResponse.json(
        { error: "This study does not have stored screenshots to re-analyze." },
        { status: 400 }
      );
    }

    console.info("[api/studies/reanalyze] Re-analysis requested", {
      studyId: id,
      openAIKeyExists: Boolean(process.env.OPENAI_API_KEY?.trim()),
      storedScreenshotCount: study.screenshot_urls.length
    });

    const screenshotInputs = await loadStoredScreenshotsForAnalysis(
      study.screenshot_urls
    );

    if (!screenshotInputs.length) {
      return NextResponse.json(
        { error: "Stored screenshots could not be loaded for re-analysis." },
        { status: 400 }
      );
    }

    const analysis = await analyzeStudyEvidence({
      screenshotInputs,
      screenshotUrls: study.screenshot_urls,
      notes: study.what_i_did === "unknown" ? "" : study.what_i_did,
      selectedPlatform: study.platform,
      manualFields: {
        platform: study.platform,
        study_title: study.study_title,
        estimated_duration: study.estimated_duration,
        reward: study.reward,
        what_i_did: study.what_i_did
      },
      sourceType: "screenshot"
    });

    const updatedStudy = await updateStudy(
      id,
      {
        ...analysisToStudyInput(analysis, {
          sourceType: "screenshot",
          screenshotUrls: study.screenshot_urls
        }),
        status: "pending",
        published_at: null
      }
    );

    if (!updatedStudy) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    await createNotification({
      title: "Study re-analyzed",
      message: `${updatedStudy.safe_public_title} was re-analyzed from the stored screenshot evidence.`,
      type: "study_reanalyzed",
      read: false,
      related_study_id: updatedStudy.id
    });

    return NextResponse.json({
      study: updatedStudy,
      reviewUrl: `/admin/review/${updatedStudy.id}`,
      analysis
    });
  } catch (error) {
    if (isOpenAIQuotaError(error)) {
      return NextResponse.json(
        { error: OPENAI_QUOTA_MESSAGE },
        { status: 402 }
      );
    }

    return apiError(error);
  }
}
