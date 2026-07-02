import { NextResponse } from "next/server";
import { runMonthlyDesignReview } from "@/lib/ai/design-review";
import { apiError } from "@/lib/api";
import {
  createDesignReview,
  createNotification,
  listStudies
} from "@/lib/data/store";

export const runtime = "nodejs";

export async function POST() {
  try {
    const studies = await listStudies({ approvedOnly: true });
    const draft = await runMonthlyDesignReview(studies);
    const review = await createDesignReview(draft);

    await createNotification({
      title: "Monthly design review ready",
      message: `Design review score: ${review.overall_score}/100. Recommendation: ${review.recommendation_type}.`,
      type: "design_review",
      read: false,
      related_study_id: null
    });

    return NextResponse.json({ review });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  return POST();
}
