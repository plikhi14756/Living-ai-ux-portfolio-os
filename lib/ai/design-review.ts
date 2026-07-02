import type { DesignReviewAnalysis } from "@/lib/ai/schemas";
import { DesignReviewSchema } from "@/lib/ai/schemas";
import type { Study } from "@/lib/types";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function extractJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

async function callOpenAIDesignReview(studies: Study[]) {
  if (!process.env.OPENAI_API_KEY) return null;

  const publicSnapshot = studies.slice(0, 20).map((study) => ({
    title: study.safe_public_title,
    category: study.recommended_section,
    score: study.portfolio_score,
    classification: study.portfolio_classification,
    created_at: study.created_at
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a monthly design review agent for a recruiter-readable AI UX portfolio. Return only JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            checks: [
              "homepage clarity",
              "visual hierarchy",
              "mobile responsiveness",
              "AI UX/HCI branding",
              "latest strong experiences visible",
              "modern professional design",
              "crowding",
              "section order",
              "typography, spacing, cards",
              "animation usefulness"
            ],
            required_schema: {
              overall_score: "0-100 number",
              recommendation_type:
                "keep current design | small refresh | major refresh",
              recommendations: "string[]",
              preview_changes: "string[]",
              risk_level: "low | medium | high",
              reason: "string"
            },
            publicSnapshot
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI design review failed: ${await response.text()}`);
  }

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty design review.");
  return DesignReviewSchema.parse(extractJson(text));
}

function fallbackDesignReview(studies: Study[]): DesignReviewAnalysis {
  const latestStrong = studies.filter((study) => study.portfolio_score >= 75).length;
  const score = Math.min(94, 74 + Math.min(12, latestStrong * 3));

  return {
    overall_score: score,
    recommendation_type: latestStrong >= 3 ? "keep current design" : "small refresh",
    recommendations: [
      "Keep the hero focused on AI UX Research and Human-AI Interaction.",
      "Feature the highest-scoring approved studies before the chronological log.",
      "Review mobile spacing after each batch of new approved entries.",
      "Keep screenshots private and use only safe public summaries."
    ],
    preview_changes: [
      "Top featured highlights remain score-driven.",
      "Document links stay visible on the public documents page.",
      "Admin dashboard continues surfacing pending reviews and maintenance status."
    ],
    risk_level: "low",
    reason:
      "The first version uses a restrained visual system with clear categories, cards, timeline entries, and safe portfolio copy."
  };
}

export async function runMonthlyDesignReview(studies: Study[]) {
  let analysis: DesignReviewAnalysis | null = null;
  try {
    analysis = await callOpenAIDesignReview(studies);
  } catch (error) {
    console.error(error);
  }

  const review = analysis ?? fallbackDesignReview(studies);
  return {
    review_month: currentMonth(),
    overall_score: Math.round(review.overall_score),
    recommendation_type: review.recommendation_type,
    recommendations: review.recommendations,
    preview_changes: {
      changes: review.preview_changes,
      risk_level: review.risk_level,
      reason: review.reason
    },
    status: "pending" as const
  };
}
