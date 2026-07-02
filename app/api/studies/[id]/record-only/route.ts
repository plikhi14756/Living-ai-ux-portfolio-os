import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { createNotification, updateStudy } from "@/lib/data/store";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const study = await updateStudy(id, {
      status: "record_only",
      portfolio_classification: "Record only"
    });
    if (!study) {
      return NextResponse.json({ error: "Study not found." }, { status: 404 });
    }

    await createNotification({
      title: "Study saved as record only",
      message: `${study.safe_public_title} is stored internally and will not publish publicly.`,
      type: "record_only",
      read: false,
      related_study_id: study.id
    });

    return NextResponse.json({ study });
  } catch (error) {
    return apiError(error);
  }
}
