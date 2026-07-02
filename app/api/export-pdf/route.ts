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
      title: "PDF portfolio updated",
      message: "The living portfolio PDF was regenerated from approved entries.",
      type: "pdf_updated",
      read: false,
      related_study_id: null
    });
    return NextResponse.json({ pdfUrl: pdf.publicUrl });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  return POST();
}
