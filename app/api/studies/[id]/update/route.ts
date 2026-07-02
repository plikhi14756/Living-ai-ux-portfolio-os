import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import {
  createNotification,
  getStudy,
  listStudies,
  updateStudy
} from "@/lib/data/store";
import { generateAndStorePortfolioPdf } from "@/lib/pdf/generate-portfolio-pdf";
import type { StudyUpdate } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as StudyUpdate;
    const existing = await getStudy(id);
    if (!existing) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    const merged = { ...existing, ...body };
    if (
      merged.status === "approved" &&
      (Number(merged.portfolio_score) < 30 ||
        merged.portfolio_classification === "Record only" ||
        merged.portfolio_classification === "Do not add")
    ) {
      return NextResponse.json(
        {
          error:
            "Record-only, do-not-add, and sub-30 studies stay private by default. Raise the score/classification before publishing."
        },
        { status: 400 }
      );
    }

    const study = await updateStudy(id, body);
    if (!study) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    let pdfUrl = "";
    if (study.status === "approved") {
      const studies = await listStudies({ approvedOnly: true });
      const pdf = await generateAndStorePortfolioPdf(studies);
      pdfUrl = pdf.publicUrl;
    }

    await createNotification({
      title: "Study updated",
      message: `${study.safe_public_title} was updated${pdfUrl ? " and the PDF was refreshed" : ""}.`,
      type: "updated",
      read: false,
      related_study_id: study.id
    });

    return NextResponse.json({ study, pdfUrl });
  } catch (error) {
    return apiError(error);
  }
}
