import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createNotification, listStudies } from "@/lib/data/store";
import { generateAndStorePortfolioPdf } from "@/lib/pdf/generate-portfolio-pdf";

export const runtime = "nodejs";

export async function POST() {
  try {
    const studies = await listStudies({ approvedOnly: true });
    const pdf = await generateAndStorePortfolioPdf(studies);

    await createNotification({
      title: "Living PDF portfolio updated.",
      message: `The latest Living AI UX Portfolio PDF was regenerated with ${pdf.includedEntryCount} approved public entries.`,
      type: "pdf_updated",
      read: false,
      related_study_id: null
    });

    return NextResponse.json({
      pdfUrl: pdf.publicUrl,
      includedEntryCount: pdf.includedEntryCount
    });
  } catch (error) {
    console.error("[api/admin/regenerate-pdf] Living PDF regeneration failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return apiError(error);
  }
}
