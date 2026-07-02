import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { createNotification, updateDesignReview } from "@/lib/data/store";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const review = await updateDesignReview(id, {
      status: "approved",
      approved_at: new Date().toISOString()
    });
    if (!review) {
      return NextResponse.json({ error: "Design review not found." }, { status: 404 });
    }

    await createNotification({
      title: "Design refresh approved",
      message:
        "The design proposal was approved for implementation. No public design changes were applied automatically.",
      type: "design_approved",
      read: false,
      related_study_id: null
    });

    return NextResponse.json({ review });
  } catch (error) {
    return apiError(error);
  }
}
