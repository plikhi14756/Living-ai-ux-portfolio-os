import { PORTFOLIO_CATEGORIES } from "@/lib/constants";
import { confidentialityGuard, normalizeUnknown } from "@/lib/ai/confidentiality";
import {
  PUBLIC_NO_HIGHLIGHT_RECOMMENDATION,
  classifyStudy,
  normalizeStudyRecommendation
} from "@/lib/ai/scoring";
import { StudyAnalysisSchema, type StudyAnalysis } from "@/lib/ai/schemas";
import { isProductionDeployment } from "@/lib/env";
import type { StudyInput } from "@/lib/types";

type AnalyzeStudyInput = {
  screenshotInputs?: string[];
  screenshotUrls?: string[];
  notes?: string;
  selectedPlatform?: string;
  manualFields?: ManualStudyFields;
  sourceType: "screenshot" | "manual";
};

export type ManualStudyFields = {
  platform?: string;
  study_title?: string;
  estimated_duration?: string;
  reward?: string;
  what_i_did?: string;
};

export const OPENAI_QUOTA_MESSAGE =
  "OpenAI API quota or billing is not active. Your screenshot was saved, but AI analysis could not run. Add API credits or billing in OpenAI Platform, then click Re-analyze.";

export class OpenAIQuotaError extends Error {
  constructor(message = OPENAI_QUOTA_MESSAGE) {
    super(message);
    this.name = "OpenAIQuotaError";
  }
}

function cleanManualField(value: unknown) {
  const text = String(value ?? "").trim();
  const lowerText = text.toLowerCase();
  if (
    !text ||
    lowerText === "unknown" ||
    lowerText === "ai analysis pending" ||
    lowerText.startsWith("screenshot saved; ai analysis is pending")
  ) {
    return "";
  }
  return text;
}

export function normalizeManualStudyFields(
  fields?: ManualStudyFields
): ManualStudyFields {
  return {
    platform: cleanManualField(fields?.platform),
    study_title: cleanManualField(fields?.study_title),
    estimated_duration: cleanManualField(fields?.estimated_duration),
    reward: cleanManualField(fields?.reward),
    what_i_did: cleanManualField(fields?.what_i_did)
  };
}

function hasManualStudyFields(fields?: ManualStudyFields) {
  const normalized = normalizeManualStudyFields(fields);
  return Object.values(normalized).some(Boolean);
}

export function manualStudyFieldsToNote(fields?: ManualStudyFields) {
  const normalized = normalizeManualStudyFields(fields);
  return [
    normalized.platform ? `Platform: ${normalized.platform}` : "",
    normalized.study_title ? `Study title: ${normalized.study_title}` : "",
    normalized.estimated_duration
      ? `Duration: ${normalized.estimated_duration}`
      : "",
    normalized.reward ? `Reward/payment: ${normalized.reward}` : "",
    normalized.what_i_did ? `What I did: ${normalized.what_i_did}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function applyManualStudyFields(
  analysis: StudyAnalysis,
  fields?: ManualStudyFields
) {
  const normalized = normalizeManualStudyFields(fields);
  if (!hasManualStudyFields(normalized)) return analysis;

  const ai_confidence =
    analysis.analysis_status === "Re-analysis needed"
      ? 0
      : Math.max(
          Math.round(analysis.ai_confidence),
          extractionConfidenceFloor(analysis)
        );

  return StudyAnalysisSchema.parse({
    ...analysis,
    platform: normalized.platform || analysis.platform,
    study_title: normalized.study_title || analysis.study_title,
    estimated_duration:
      normalized.estimated_duration || analysis.estimated_duration,
    reward: normalized.reward || analysis.reward,
    what_i_did_guess: normalized.what_i_did
      ? confidentialityGuard(normalized.what_i_did)
      : analysis.what_i_did_guess,
    missing_questions: analysis.missing_questions.filter((question) => {
      const lower = question.toLowerCase();
      if (normalized.estimated_duration && lower.includes("duration")) {
        return false;
      }
      if (normalized.what_i_did && lower.includes("task type")) return false;
      return true;
    })
  });
}

function statusForSourceType(input: AnalyzeStudyInput) {
  return input.sourceType === "manual"
    ? "Manual analysis completed"
    : "OpenAI analyzed successfully";
}

function known(value: string) {
  const normalized = normalizeUnknown(value);
  return normalized !== "unknown" && normalized !== "ai analysis pending";
}

function normalizeVisibleTopic(topic: string, title: string) {
  const normalizedTopic = normalizeUnknown(topic);
  const lowerTitle = title.toLowerCase();

  if (
    ["survey", "study", "questionnaire"].includes(
      normalizedTopic.toLowerCase()
    ) &&
    lowerTitle.includes("travel motivation")
  ) {
    return "international travel motivation";
  }

  return normalizedTopic;
}

function extractionConfidenceFloor(analysis: StudyAnalysis) {
  const knownVisibleFields = [
    analysis.platform,
    analysis.study_title,
    analysis.visible_topic,
    analysis.estimated_duration,
    analysis.reward
  ].filter(known).length;

  if (analysis.analysis_status === "Re-analysis needed") return 0;
  if (knownVisibleFields >= 5) return 82;
  if (knownVisibleFields >= 4) return 75;
  if (knownVisibleFields >= 3) return 65;
  if (knownVisibleFields >= 2) return 50;
  return analysis.analysis_status === "OpenAI analyzed successfully" ? 35 : 25;
}

function finalizePortfolioScoring(analysis: StudyAnalysis) {
  const recommendation = normalizeStudyRecommendation({
    platform: analysis.platform,
    title: analysis.study_title,
    topic: analysis.visible_topic,
    notes: [
      analysis.what_i_did_guess,
      analysis.safe_public_title,
      analysis.safe_public_description
    ].join(" "),
    studyType: analysis.study_type,
    duration: analysis.estimated_duration,
    confidentialityRisk: analysis.confidentiality_risk,
    portfolioClassification: analysis.portfolio_classification,
    portfolioScore: analysis.portfolio_score,
    recommendedSection: analysis.recommended_section,
    safePublicTitle: analysis.safe_public_title,
    safePublicDescription: analysis.safe_public_description,
    publicPublishRecommendation: analysis.public_publish_recommendation,
    linkedinFeaturedTitle: analysis.linkedin_featured_title,
    linkedinFeaturedDescription: analysis.linkedin_featured_description
  });
  const ai_confidence =
    analysis.analysis_status === "Re-analysis needed"
      ? 0
      : Math.max(
          Math.round(analysis.ai_confidence),
          extractionConfidenceFloor(analysis)
        );

  return StudyAnalysisSchema.parse({
    ...analysis,
    portfolio_score: recommendation.portfolio_score,
    portfolio_classification: recommendation.portfolio_classification,
    recommended_section: recommendation.recommended_section,
    public_publish_recommendation: recommendation.public_publish_recommendation,
    linkedin_featured_title: recommendation.linkedin_featured_title,
    linkedin_featured_description: recommendation.linkedin_featured_description,
    ai_confidence
  });
}

const studyAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "platform",
    "study_title",
    "visible_topic",
    "estimated_duration",
    "reward",
    "study_type",
    "approval_status",
    "what_i_did_guess",
    "confidentiality_risk",
    "portfolio_classification",
    "recommended_section",
    "portfolio_score",
    "safe_public_title",
    "safe_public_description",
    "case_study_summary",
    "skills_demonstrated",
    "linkedin_featured_title",
    "linkedin_featured_description",
    "public_publish_recommendation",
    "analysis_status",
    "ai_confidence",
    "missing_questions"
  ],
  properties: {
    platform: { type: "string" },
    study_title: { type: "string" },
    visible_topic: { type: "string" },
    estimated_duration: { type: "string" },
    reward: { type: "string" },
    study_type: { type: "string" },
    approval_status: { type: "string" },
    what_i_did_guess: { type: "string" },
    confidentiality_risk: {
      type: "string",
      enum: ["low", "medium", "high", "unknown"]
    },
    portfolio_classification: {
      type: "string",
      enum: [
        "Major portfolio project",
        "Strong supporting entry",
        "Supporting portfolio bullet",
        "Record only",
        "Do not add"
      ]
    },
    recommended_section: {
      type: "string",
      enum: PORTFOLIO_CATEGORIES
    },
    portfolio_score: { type: "number", minimum: 0, maximum: 100 },
    safe_public_title: { type: "string" },
    safe_public_description: { type: "string" },
    case_study_summary: { type: "string" },
    skills_demonstrated: {
      type: "array",
      items: { type: "string" }
    },
    linkedin_featured_title: { type: "string" },
    linkedin_featured_description: { type: "string" },
    public_publish_recommendation: { type: "string" },
	    analysis_status: {
	      type: "string",
	      enum: [
	        "OpenAI analyzed successfully",
	        "Manual analysis completed",
	        "Fallback/manual extraction only",
	        "Re-analysis needed"
	      ]
	    },
    ai_confidence: { type: "number", minimum: 0, maximum: 100 },
    missing_questions: {
      type: "array",
      items: { type: "string" }
    }
  }
};

function getPrompt(input: AnalyzeStudyInput) {
  const manualFieldText = manualStudyFieldsToNote(input.manualFields) || "none";

  return [
    "You are the Living AI UX Portfolio OS analysis agent for Pranav Likhi.",
    "Carefully read every visible word in the uploaded study screenshot evidence before writing the JSON.",
    "Extract only what is visible in screenshots or clearly stated in notes. Do not invent details.",
    "Use the literal string unknown only when a field is genuinely not visible in the screenshot and not stated in notes.",
    "You are commonly analyzing screenshots from Prolific, UserTesting, Userlytics, TELUS, and similar AI evaluation or UX research platforms.",
    "Pay close attention to study cards, dashboard rows, modal text, task instructions, status labels, payout/reward fields, duration estimates, platform chrome, and device requirements.",
    "Extract these visible details when present: platform, study title, topic/category, reward/payment amount, duration, approval/payment status, task type, likely study method, device requirement, and portfolio relevance.",
    "If a researcher, client, company, or requester is visible, use that only as private internal evidence for task context and do not include it in any public title, public description, LinkedIn text, or case-study summary.",
    "The schema does not have a dedicated researcher/client field; if mentioning visible requester context internally, keep it high-level inside what_i_did_guess and avoid confidential names unless absolutely necessary for private admin review.",
    "For Prolific screenshots, look for labels such as Reward, Average reward per hour, Time, Places, Status, Completion, Approved, Awaiting review, Returned, Timed out, and study title.",
    "For UserTesting/Userlytics screenshots, look for test title, device, duration, payment, moderated/unmoderated labels, scenario text, and completion/payment state.",
    "For TELUS or AI evaluation screenshots, look for locale/language, query or response evaluation, voice/audio, rating, annotation, search relevance, safety, and task status signals.",
    "Classify portfolio value using these rules:",
    "Major portfolio project: moderated/live interview, focus group, 45+ minutes, AI/HCI, fintech/banking UX, voice AI, conversational AI, prototype testing, detailed spoken/written feedback, group discussion, or strong human-AI interaction relevance.",
    "Supporting portfolio bullet: short AI rating task, chatbot survey, voice response evaluation, product feedback, language assessment, app/web usability test, or short relevant AI/product study.",
    "Record only: generic survey, weak UX/AI connection, mostly demographic, or too small to show publicly.",
    "Do not add: unsafe confidential details, rejected for quality issues, unrelated topic, or no meaningful skill demonstrated.",
    "Portfolio_score measures portfolio value only, not extraction confidence.",
    "Ai_confidence measures only how confident you are that visible screenshot information was extracted correctly.",
    "Use score bands exactly: 0-29 Record only or Do not add; 30-59 Supporting portfolio bullet; 60-79 Strong supporting entry; 80-100 Major portfolio project.",
    "If portfolio_score is below 30, never classify as Supporting portfolio bullet.",
    "If portfolio_score is 0, classify as Record only unless unsafe, then classify as Do not add.",
    "For generic surveys unrelated to AI UX, HCI, product testing, usability testing, AI evaluation, fintech UX, voice AI, conversational AI, or multilingual product evaluation, classify as Record only, score around 10, recommended_section Research Participation Log, public_publish_recommendation Do not publish as portfolio highlight, and do not recommend LinkedIn Featured.",
    "If platform, title, topic, duration, and reward are visible and extracted, ai_confidence should usually be above 70 even when portfolio_score is low.",
    "Set analysis_status to OpenAI analyzed successfully when using screenshot evidence, or Manual analysis completed when analyzing a manual entry.",
    "Public text must protect confidentiality. Never reveal company names unless clearly public and safe, researcher names, study IDs, completion codes, private prototype details, unreleased product details, exact confidential tasks, or screenshots.",
    "Use wording like confidential fintech AI assistant evaluation instead of private names.",
    `Selected platform if supplied: ${input.selectedPlatform || "unknown"}.`,
    `Admin-entered manual fields, if any. Treat these as user-provided facts for private/internal fields and use them to reduce unknowns: ${manualFieldText}.`,
    `Optional notes: ${input.notes || "none"}.`,
    "Generate LinkedIn Featured title and description, but do not suggest automating LinkedIn."
  ].join("\n");
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

function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function isInsufficientQuotaDetail(detail: string) {
  const lowerDetail = detail.toLowerCase();
  if (
    lowerDetail.includes("insufficient_quota") ||
    lowerDetail.includes("billing")
  ) {
    return true;
  }

  try {
    const parsed = JSON.parse(detail) as {
      error?: {
        code?: string | null;
        type?: string | null;
        message?: string | null;
      };
    };
    return (
      parsed.error?.code === "insufficient_quota" ||
      parsed.error?.type === "insufficient_quota" ||
      Boolean(parsed.error?.message?.toLowerCase().includes("quota")) ||
      Boolean(parsed.error?.message?.toLowerCase().includes("billing"))
    );
  } catch {
    return lowerDetail.includes("quota") || lowerDetail.includes("billing");
  }
}

export function isOpenAIQuotaError(error: unknown) {
  return (
    error instanceof OpenAIQuotaError ||
    (error instanceof Error &&
      (error.name === "OpenAIQuotaError" ||
        error.message.includes("insufficient_quota") ||
        error.message === OPENAI_QUOTA_MESSAGE))
  );
}

async function callOpenAI(input: AnalyzeStudyInput) {
  const keyExists = hasOpenAIKey();
  console.info("[analyze-study] OpenAI key exists", { exists: keyExists });

  if (!keyExists) return null;

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" } }
  > = [{ type: "text", text: getPrompt(input) }];

  for (const image of input.screenshotInputs ?? []) {
    content.push({ type: "image_url", image_url: { url: image, detail: "high" } });
  }

  console.info("[analyze-study] Sending OpenAI study analysis request", {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    imageCount: input.screenshotInputs?.length ?? 0,
    hasNotes: Boolean(input.notes?.trim()),
    selectedPlatform: input.selectedPlatform || "unknown"
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "study_analysis",
          strict: true,
          schema: studyAnalysisJsonSchema
        }
      },
      messages: [
        {
          role: "system",
          content:
            "You analyze UX research and AI evaluation study evidence for a confidential public portfolio workflow."
        },
        {
          role: "user",
          content
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[analyze-study] OpenAI response failure", {
      status: response.status,
      detail: detail.slice(0, 800)
    });
    if (isInsufficientQuotaDetail(detail)) {
      console.error("[analyze-study] OpenAI insufficient quota detected");
      throw new OpenAIQuotaError();
    }
    throw new Error(`OpenAI study analysis failed: ${detail}`);
  }

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty study analysis.");
  console.info("[analyze-study] OpenAI response success", {
    choiceCount: payload.choices?.length ?? 0
  });
  return StudyAnalysisSchema.parse(extractJson(text));
}

function fallbackAnalysis(input: AnalyzeStudyInput): StudyAnalysis {
  const notes = normalizeUnknown(input.notes);
  const duration = extractDuration(notes);
  const scoring = classifyStudy({
    platform: input.selectedPlatform,
    notes,
    duration
  });

  const platform = normalizeUnknown(input.selectedPlatform);
  const title = inferSafeTitle(notes, scoring.classification);

  const safeDescription =
    scoring.classification === "Do not add"
      ? "This entry should stay private until confidentiality and relevance are confirmed."
      : inferSafeDescription(notes);

  return {
    platform,
    study_title: notes === "unknown" ? "unknown" : notes.slice(0, 96),
    visible_topic: notes === "unknown" ? "unknown" : confidentialityGuard(notes).slice(0, 120),
    estimated_duration: duration,
    reward: "unknown",
    study_type: input.sourceType === "manual" ? "manual entry" : "screenshot evidence",
    approval_status: "unknown",
    what_i_did_guess: notes,
    confidentiality_risk: "unknown",
    portfolio_classification: scoring.classification,
    recommended_section: scoring.recommended_section,
    portfolio_score: scoring.score,
    safe_public_title: title,
    safe_public_description: safeDescription,
    case_study_summary:
      scoring.classification === "Major portfolio project"
        ? "A high-level case-study candidate that should be edited with the exact safe task framing before publication."
        : "",
    skills_demonstrated: [
      "AI evaluation",
      "UX research participation",
      "Product feedback"
    ],
    linkedin_featured_title: title,
    linkedin_featured_description: safeDescription,
    public_publish_recommendation: scoring.public_publish_recommendation,
    analysis_status: "Fallback/manual extraction only",
    ai_confidence: process.env.OPENAI_API_KEY ? 35 : 25,
    missing_questions: [
      ...(duration === "unknown" ? ["What was the approximate duration?"] : []),
      "What task type did you complete?",
      "Were there any confidentiality restrictions or unreleased product details?"
    ]
  };
}

function extractDuration(notes: string) {
  const match = notes.match(/\b(\d{1,3})\s*(minute|minutes|min|mins|hour|hours|hr|hrs)\b/i);
  if (!match) return "unknown";

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("hour") || unit.startsWith("hr")) {
    return amount === 1 ? "1 hour" : `${amount} hours`;
  }

  return amount === 1 ? "1 minute" : `${amount} minutes`;
}

function inferSafeTitle(notes: string, classification: StudyAnalysis["portfolio_classification"]) {
  const source = notes.toLowerCase();
  if (source.includes("fintech") || source.includes("bank")) {
    return "Confidential Fintech UX Evaluation";
  }
  if (source.includes("voice")) {
    return "Confidential Voice AI Evaluation";
  }
  if (source.includes("chatbot") || source.includes("conversational")) {
    return "Confidential Conversational AI Evaluation";
  }
  if (source.includes("assistant") || source.includes("prototype")) {
    return "Confidential AI Assistant Prototype Evaluation";
  }
  if (source.includes("multilingual") || source.includes("language")) {
    return "Multilingual AI Product Evaluation";
  }
  return classification === "Major portfolio project"
    ? "Confidential AI UX Research Experience"
    : "Confidential UX Research Participation";
}

function inferSafeDescription(notes: string) {
  const source = notes.toLowerCase();
  if (source.includes("moderated") || source.includes("spoken")) {
    return "Participated in a confidential moderated AI or UX research session, providing structured feedback on clarity, trust, task flow, and user confidence.";
  }
  if (source.includes("fintech") || source.includes("bank")) {
    return "Provided safe high-level feedback on a confidential fintech product experience, focusing on comprehension, trust signals, and task friction.";
  }
  if (source.includes("multilingual") || source.includes("language")) {
    return "Evaluated multilingual product or AI response quality with attention to clarity, tone, cultural fit, and user-centered communication.";
  }
  return "A safely summarized AI evaluation or UX research participation entry based on the provided note or screenshot evidence.";
}

export async function analyzeStudyEvidence(input: AnalyzeStudyInput) {
  const isScreenshotAnalysis = input.sourceType === "screenshot";
  const imageCount = input.screenshotInputs?.length ?? 0;

  if (isScreenshotAnalysis && imageCount === 0) {
    throw new Error("At least one uploaded screenshot is required for screenshot analysis.");
  }

  if (!hasOpenAIKey() && (isScreenshotAnalysis || isProductionDeployment())) {
    console.error("[analyze-study] OpenAI API key missing for AI analysis", {
      sourceType: input.sourceType,
      imageCount
    });
    throw new Error(
      isScreenshotAnalysis
        ? "OpenAI API key is missing. Screenshot analysis cannot run."
        : "OpenAI API key is missing. AI analysis cannot run."
    );
  }

  try {
    const modelAnalysis = await callOpenAI(input);
    if (modelAnalysis) {
      return sanitizeAnalysis(
        applyManualStudyFields(
          {
            ...modelAnalysis,
            analysis_status: statusForSourceType(input)
          },
          input.manualFields
        )
      );
    }
  } catch (error) {
    console.error("[analyze-study] Study analysis failed", error);
    if (isOpenAIQuotaError(error)) throw error;
    if (isScreenshotAnalysis) throw error;
  }

  return sanitizeAnalysis(
    applyManualStudyFields(fallbackAnalysis(input), input.manualFields)
  );
}

export function createPendingQuotaStudyInput(options: {
  manualFields?: ManualStudyFields;
  notes?: string;
  selectedPlatform?: string;
  screenshotUrls: string[];
}): StudyInput {
  const manualFields = normalizeManualStudyFields(options.manualFields);
  const notes = normalizeUnknown(options.notes);
  const privateNote =
    manualFields.what_i_did
      ? confidentialityGuard(manualFields.what_i_did)
      : notes === "unknown"
      ? "Screenshot saved; AI analysis is pending until OpenAI API billing or quota is active."
      : confidentialityGuard(notes);

  return {
    platform: normalizeUnknown(manualFields.platform || options.selectedPlatform),
    study_title: manualFields.study_title || "AI analysis pending",
    visible_topic: "AI analysis pending",
    estimated_duration: manualFields.estimated_duration || "unknown",
    reward: manualFields.reward || "unknown",
    study_type: "screenshot evidence",
    approval_status: OPENAI_QUOTA_MESSAGE,
    what_i_did: privateNote,
    confidentiality_risk: "unknown",
    portfolio_classification: "Record only",
    recommended_section: "Research Participation Log",
    portfolio_score: 0,
    safe_public_title: "Screenshot Saved - AI Analysis Pending",
    safe_public_description:
      "This screenshot evidence has been saved privately and needs AI analysis before publication.",
    case_study_summary: "",
    skills_demonstrated: [],
    linkedin_featured_title: "",
    linkedin_featured_description: "",
    public_publish_recommendation: PUBLIC_NO_HIGHLIGHT_RECOMMENDATION,
    analysis_status: "Re-analysis needed",
    source_type: "screenshot",
    status: "pending",
    screenshot_urls: options.screenshotUrls,
    ai_confidence: 0,
    missing_questions: [OPENAI_QUOTA_MESSAGE]
  };
}

export function sanitizeAnalysis(analysis: StudyAnalysis): StudyAnalysis {
  const safe = {
    ...analysis,
    platform: normalizeUnknown(analysis.platform),
    study_title: normalizeUnknown(analysis.study_title),
    visible_topic: normalizeVisibleTopic(
      analysis.visible_topic,
      analysis.study_title
    ),
    estimated_duration: normalizeUnknown(analysis.estimated_duration),
    reward: normalizeUnknown(analysis.reward),
    study_type: normalizeUnknown(analysis.study_type),
    approval_status: normalizeUnknown(analysis.approval_status),
    what_i_did_guess: normalizeUnknown(analysis.what_i_did_guess),
    recommended_section:
      PORTFOLIO_CATEGORIES.find(
        (category) => category === analysis.recommended_section
      ) ?? "Research Participation Log",
    safe_public_title: confidentialityGuard(analysis.safe_public_title),
    safe_public_description: confidentialityGuard(
      analysis.safe_public_description
    ),
    case_study_summary: confidentialityGuard(analysis.case_study_summary),
    skills_demonstrated: analysis.skills_demonstrated.map(confidentialityGuard),
    linkedin_featured_title: confidentialityGuard(
      analysis.linkedin_featured_title
    ),
    linkedin_featured_description: confidentialityGuard(
      analysis.linkedin_featured_description
    ),
    public_publish_recommendation: confidentialityGuard(
      analysis.public_publish_recommendation
    ),
    missing_questions: analysis.missing_questions.map(confidentialityGuard)
  };

  const parsed = StudyAnalysisSchema.parse(safe);
  return finalizePortfolioScoring(parsed);
}

export function analysisToStudyInput(
  analysis: StudyAnalysis,
  options: {
    sourceType: "screenshot" | "manual";
    screenshotUrls?: string[];
  }
): StudyInput {
  return {
    platform: analysis.platform,
    study_title: analysis.study_title,
    visible_topic: analysis.visible_topic,
    estimated_duration: analysis.estimated_duration,
    reward: analysis.reward,
    study_type: analysis.study_type,
    approval_status: analysis.approval_status,
    what_i_did: analysis.what_i_did_guess,
    confidentiality_risk: analysis.confidentiality_risk,
    portfolio_classification: analysis.portfolio_classification,
    recommended_section: analysis.recommended_section,
    portfolio_score: Math.round(analysis.portfolio_score),
    safe_public_title: analysis.safe_public_title,
    safe_public_description: analysis.safe_public_description,
    case_study_summary: analysis.case_study_summary,
    skills_demonstrated: analysis.skills_demonstrated,
    linkedin_featured_title: analysis.linkedin_featured_title,
    linkedin_featured_description: analysis.linkedin_featured_description,
    public_publish_recommendation: analysis.public_publish_recommendation,
    analysis_status: analysis.analysis_status,
    source_type: options.sourceType,
    status:
      analysis.portfolio_classification === "Do not add"
        ? "pending"
        : "pending",
    screenshot_urls: options.screenshotUrls ?? [],
    ai_confidence: Math.round(analysis.ai_confidence),
    missing_questions: analysis.missing_questions
  };
}
