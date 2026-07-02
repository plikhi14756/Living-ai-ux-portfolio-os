import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import {
  createNotification,
  getStudy,
  listStudies,
  updateStudy
} from "@/lib/data/store";
import { generateAndStorePortfolioPdf } from "@/lib/pdf/generate-portfolio-pdf";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const current = await getStudy(id);
    if (!current) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    if (
      current.portfolio_score < 30 ||
      current.portfolio_classification === "Record only" ||
      current.portfolio_classification === "Do not add"
    ) {
      return NextResponse.json(
        {
          error:
            "This study is record-only or below the public portfolio threshold. Save it as record only or edit the score/classification before publishing."
        },
        { status: 400 }
      );
    }

    const study = await updateStudy(id, {
      status: "approved",
      published_at: new Date().toISOString()
    });

    if (!study) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    const studies = await listStudies({ approvedOnly: true });
    const pdf = await generateAndStorePortfolioPdf(studies);

    await createNotification({
      title: "Approved study published",
      message: `${study.safe_public_title} is live on the public portfolio. PDF portfolio updated.`,
      type: "published",
      read: false,
      related_study_id: study.id
    });

    return NextResponse.json({ study, pdfUrl: pdf.publicUrl });
  } catch (error) {
    return apiError(error);
  }
}
