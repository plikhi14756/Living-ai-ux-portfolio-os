import { NextResponse, type NextRequest } from "next/server";
import {
  analysisToStudyInput,
  analyzeStudyEvidence,
  createPendingQuotaStudyInput,
  isOpenAIQuotaError,
  OPENAI_QUOTA_MESSAGE
} from "@/lib/ai/analyze-study";
import { apiError } from "@/lib/api";
import { createNotification, createStudy } from "@/lib/data/store";
import { saveStudyScreenshots } from "@/lib/data/storage";
import { runDuplicateCheckForStudy } from "@/lib/portfolio-operations/duplicates/find-duplicates";

export const runtime = "nodejs";

function filesFromForm(formData: FormData) {
  return formData
    .getAll("screenshots")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function validateUploadedFiles(files: File[]) {
  if (!files.length) {
    throw new Error("Upload at least one screenshot before running screenshot analysis.");
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`Unsupported screenshot file type: ${file.type || "unknown"}. Upload a PNG or JPEG image.`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Screenshot analysis requires multipart/form-data file uploads." },
        { status: 415 }
      );
    }

    const formData = await request.formData();
    const notes = String(formData.get("notes") ?? "");
    const selectedPlatform = String(formData.get("platform") ?? "");
    const manualFields = {
      platform: selectedPlatform,
      study_title: String(formData.get("study_title") ?? ""),
      estimated_duration: String(formData.get("estimated_duration") ?? ""),
      reward: String(formData.get("reward") ?? ""),
      what_i_did: String(formData.get("what_i_did") ?? "")
    };
    const files = filesFromForm(formData);

    console.info("[api/analyze-study] Incoming screenshot analysis request", {
      openAIKeyExists: Boolean(process.env.OPENAI_API_KEY?.trim()),
      uploadedFileCount: files.length,
      selectedPlatform: selectedPlatform || "unknown",
      hasNotes: Boolean(notes.trim()),
      hasManualFields: Object.values(manualFields).some((value) =>
        Boolean(value.trim())
      )
    });

    files.forEach((file, index) => {
      console.info("[api/analyze-study] Uploaded screenshot file", {
        index,
        name: file.name || "unnamed",
        type: file.type || "unknown",
        size: file.size
      });
    });

    validateUploadedFiles(files);

    const stored = await saveStudyScreenshots(files);
    const screenshotUrls = stored.map((item) => item.publicUrl);
    const screenshotInputs = stored.map((item) => item.dataUrl);

    console.info("[api/analyze-study] Screenshot inputs prepared", {
      storedUrlCount: screenshotUrls.length,
      base64InputCount: screenshotInputs.length,
      storageUrls: screenshotUrls
    });

    let analysis;
    try {
      analysis = await analyzeStudyEvidence({
        screenshotInputs,
        screenshotUrls,
        notes,
        selectedPlatform,
        manualFields,
        sourceType: "screenshot"
      });
    } catch (error) {
      if (!isOpenAIQuotaError(error)) throw error;

      const study = await createStudy(
        createPendingQuotaStudyInput({
          notes,
          selectedPlatform,
          manualFields,
          screenshotUrls
        })
      );
      const duplicateCheck = await runDuplicateCheckForStudy(study);

      await createNotification({
        title: "Screenshot saved, AI analysis paused",
        message: OPENAI_QUOTA_MESSAGE,
        type: "openai_quota",
        read: false,
        related_study_id: study.id
      });

      return NextResponse.json({
        studyId: study.id,
        reviewUrl: duplicateCheck.duplicateReviewUrl ?? `/admin/review/${study.id}`,
        duplicateCheck,
        warning: OPENAI_QUOTA_MESSAGE
      });
    }

    const study = await createStudy(
      analysisToStudyInput(analysis, {
        sourceType: "screenshot",
        screenshotUrls
      })
    );
    const duplicateCheck = await runDuplicateCheckForStudy(study);

    await createNotification({
      title: duplicateCheck.duplicateFound ? "Possible duplicate detected" : "Study ready for review",
      message: duplicateCheck.duplicateFound
        ? `${study.safe_public_title} needs duplicate review before normal approval.`
        : `${study.safe_public_title} was analyzed and saved as a pending portfolio record.`,
      type: duplicateCheck.duplicateFound ? "duplicate_alert" : "study_ready",
      read: false,
      related_study_id: study.id
    });

    return NextResponse.json({
      studyId: study.id,
      reviewUrl: duplicateCheck.duplicateReviewUrl ?? `/admin/review/${study.id}`,
      duplicateCheck,
      analysis
    });
  } catch (error) {
    return apiError(error);
  }
}
