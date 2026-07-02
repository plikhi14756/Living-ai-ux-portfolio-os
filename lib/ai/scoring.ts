import type { ConfidentialityRisk, StudyClassification } from "@/lib/types";

export const PUBLIC_HIGHLIGHT_RECOMMENDATION = "Publish as portfolio highlight";
export const PUBLIC_ENTRY_RECOMMENDATION = "Publish as portfolio entry";
export const PUBLIC_SUPPORTING_RECOMMENDATION =
  "Publish as supporting portfolio entry";
export const PUBLIC_NO_HIGHLIGHT_RECOMMENDATION =
  "Do not publish as portfolio highlight";
export const LINKEDIN_NOT_RECOMMENDED = "LinkedIn Featured not recommended";

type ScoreInput = {
  platform?: string;
  title?: string;
  topic?: string;
  notes?: string;
  studyType?: string;
  duration?: string;
};

type RecommendationInput = ScoreInput & {
  confidentialityRisk?: ConfidentialityRisk;
  portfolioClassification?: StudyClassification;
  portfolioScore?: number;
  recommendedSection?: string;
  safePublicTitle?: string;
  safePublicDescription?: string;
  publicPublishRecommendation?: string;
  linkedinFeaturedTitle?: string;
  linkedinFeaturedDescription?: string;
};

function numberFromDuration(duration = "") {
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function containsAny(source: string, terms: string[]) {
  return terms.some((term) => source.includes(term));
}

const majorSignals = [
  "moderated",
  "live interview",
  "focus group",
  "group discussion",
  "prototype",
  "spoken feedback",
  "detailed feedback"
];

const aiSignals = [
  "ai",
  "artificial intelligence",
  "hci",
  "human-ai",
  "human ai",
  "chatbot",
  "assistant",
  "voice",
  "conversational",
  "llm",
  "agent",
  "machine learning",
  "model evaluation",
  "model response",
  "response rating",
  "ai-generated",
  "ai generated",
  "vlm",
  "image artifact"
];

const fintechSignals = [
  "fintech",
  "bank",
  "banking",
  "finance",
  "payment",
  "credit"
];

const multilingualSignals = [
  "multilingual",
  "language",
  "translation",
  "locale",
  "cultural",
  "hindi",
  "punjabi",
  "french"
];

const uxProductSignals = [
  "ux",
  "user experience",
  "usability",
  "product testing",
  "product feedback",
  "prototype",
  "app test",
  "website test",
  "user testing",
  "usertesting",
  "userlytics",
  "maze"
];

const genericSignals = [
  "career",
  "careers",
  "connections",
  "decision-making",
  "decision making",
  "demographic",
  "demographics",
  "opinion",
  "opinions",
  "politics",
  "political",
  "political survey",
  "consumer survey",
  "general social science",
  "social science scenario",
  "market research",
  "travel motivation",
  "event-driven travel",
  "fifa world cup"
];

const aiWorkflowSignals = [
  "living ai ux portfolio os",
  "portfolio automation",
  "ai workflow",
  "workflow project",
  "personal ai workflow",
  "human-in-the-loop",
  "human in the loop",
  "agentic workflow",
  "portfolio system",
  "portfolio website",
  "portfolio entries"
];

const unsafeSignals = [
  "rejected",
  "quality issue",
  "screen out",
  "unsafe to publish"
];

function hasPortfolioRelevance(source: string) {
  return containsAny(source, [
    ...aiSignals,
    ...fintechSignals,
    ...multilingualSignals,
    ...uxProductSignals,
    ...aiWorkflowSignals
  ]);
}

function isSurvey(source: string) {
  return containsAny(source, ["survey", "questionnaire", "study"]);
}

export function isGenericUnrelatedSurvey(source: string) {
  return isSurvey(source) && !hasPortfolioRelevance(source);
}

export function classificationForScore(
  score: number,
  unsafe = false
): StudyClassification {
  if (unsafe) return "Do not add";
  if (score <= 0) return "Record only";
  if (score < 30) return "Record only";
  if (score < 60) return "Supporting portfolio bullet";
  if (score < 80) return "Strong supporting entry";
  return "Major portfolio project";
}

export function publishRecommendationForScore(
  score: number,
  classification: StudyClassification,
  genericUnrelatedSurvey = false
) {
  if (
    genericUnrelatedSurvey ||
    classification === "Record only" ||
    classification === "Do not add"
  ) {
    return PUBLIC_NO_HIGHLIGHT_RECOMMENDATION;
  }

  if (classification === "Major portfolio project" && score >= 80) {
    return PUBLIC_HIGHLIGHT_RECOMMENDATION;
  }

  return score >= 30
    ? PUBLIC_SUPPORTING_RECOMMENDATION
    : PUBLIC_NO_HIGHLIGHT_RECOMMENDATION;
}

function boundedScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function recommendationSource(input: ScoreInput) {
  return [
    input.platform,
    input.title,
    input.topic,
    input.notes,
    input.studyType,
    input.duration
  ]
    .join(" ")
    .toLowerCase();
}

function hasAnyPortfolioRelevance(source: string) {
  return hasPortfolioRelevance(source);
}

function hasAiWorkflowRelevance(source: string) {
  return containsAny(source, aiWorkflowSignals);
}

function hasAiEvaluationRelevance(source: string) {
  return containsAny(source, [
    ...aiSignals,
    "model response rating",
    "model response evaluation",
    "chatbot evaluation",
    "voice ai",
    "ai voice",
    "conversational ai",
    "ai systems",
    "ai system",
    "human-ai interaction",
    "human ai interaction"
  ]);
}

function sectionForSource(
  source: string,
  classification: StudyClassification,
  genericUnrelatedSurvey: boolean
) {
  if (
    genericUnrelatedSurvey ||
    classification === "Record only" ||
    classification === "Do not add"
  ) {
    return "Research Participation Log";
  }

  if (hasAiWorkflowRelevance(source)) return "AI Workflow Projects";
  if (containsAny(source, fintechSignals)) return "Fintech & Banking UX";
  if (containsAny(source, multilingualSignals)) {
    return "Multilingual Product Evaluation";
  }
  if (
    containsAny(source, [
      "voice assistant",
      "conversational interface",
      "conversation interface",
      "assistant conversation"
    ])
  ) {
    return "Voice & Conversational AI";
  }
  if (hasAiEvaluationRelevance(source)) return "AI Evaluation Experience";
  if (containsAny(source, uxProductSignals)) {
    return "Usability Testing & Product Feedback";
  }
  if (classification === "Major portfolio project") return "Major AI UX Projects";
  return "Research Participation Log";
}

export function normalizeStudyRecommendation(input: RecommendationInput) {
  const source = recommendationSource(input);
  const unsafe = input.confidentialityRisk === "high";
  const genericUnrelatedSurvey = isGenericUnrelatedSurvey(source);
  const aiWorkflowProject = hasAiWorkflowRelevance(source);
  const clearlyPortfolioRelevant = hasAnyPortfolioRelevance(source);
  const existingScore = boundedScore(input.portfolioScore);

  let portfolio_score = existingScore;
  if (genericUnrelatedSurvey) portfolio_score = 10;
  if (aiWorkflowProject && portfolio_score < 80) portfolio_score = 88;
  if (unsafe) portfolio_score = 0;
  if (!clearlyPortfolioRelevant && portfolio_score >= 30 && portfolio_score < 60) {
    portfolio_score = 10;
  }

  let portfolio_classification = classificationForScore(
    portfolio_score,
    unsafe
  );
  if (genericUnrelatedSurvey) portfolio_classification = "Record only";
  if (unsafe) portfolio_classification = "Do not add";

  const publicWorthy =
    portfolio_score >= 30 &&
    clearlyPortfolioRelevant &&
    portfolio_classification !== "Record only" &&
    portfolio_classification !== "Do not add";
  const public_publish_recommendation = publicWorthy
    ? publishRecommendationForScore(portfolio_score, portfolio_classification)
    : PUBLIC_NO_HIGHLIGHT_RECOMMENDATION;
  const recommended_section = sectionForSource(
    source,
    portfolio_classification,
    genericUnrelatedSurvey
  );
  const linkedinRecommended =
    publicWorthy &&
    public_publish_recommendation !== PUBLIC_NO_HIGHLIGHT_RECOMMENDATION;

  return {
    genericUnrelatedSurvey,
    publicWorthy,
    portfolio_classification,
    portfolio_score,
    public_publish_recommendation,
    recommended_section,
    linkedin_featured_title: linkedinRecommended
      ? input.linkedinFeaturedTitle ||
        input.safePublicTitle ||
        input.title ||
        "Portfolio entry recommended for LinkedIn Featured"
      : LINKEDIN_NOT_RECOMMENDED,
    linkedin_featured_description: linkedinRecommended
      ? input.linkedinFeaturedDescription ||
        input.safePublicDescription ||
        "A public-worthy AI UX portfolio entry approved for the living portfolio."
      : LINKEDIN_NOT_RECOMMENDED
  };
}

export function classifyStudy(input: ScoreInput) {
  const source = recommendationSource(input);

  const duration = numberFromDuration(input.duration);
  const unsafe = containsAny(source, unsafeSignals);
  const genericUnrelatedSurvey = isGenericUnrelatedSurvey(source);
  const aiWorkflowProject = hasAiWorkflowRelevance(source);
  let score = genericUnrelatedSurvey ? 10 : aiWorkflowProject ? 82 : 42;

  if (containsAny(source, aiSignals)) score += 18;
  if (containsAny(source, fintechSignals)) score += 18;
  if (containsAny(source, multilingualSignals)) score += 12;
  if (containsAny(source, uxProductSignals)) score += 12;
  if (aiWorkflowProject) score += 12;
  if (containsAny(source, majorSignals)) score += 20;
  if (duration >= 45) score += 18;
  if (duration > 0 && duration < 10) score -= 8;
  if (containsAny(source, genericSignals)) score -= 18;
  if (unsafe) score = 0;
  if (genericUnrelatedSurvey) score = 10;

  score = Math.max(0, Math.min(100, score));

  const classification = classificationForScore(score, unsafe);

  const normalized = normalizeStudyRecommendation({
    ...input,
    confidentialityRisk: unsafe ? "high" : "unknown",
    portfolioClassification: classification,
    portfolioScore: score
  });

  return {
    classification: normalized.portfolio_classification,
    genericUnrelatedSurvey: normalized.genericUnrelatedSurvey,
    public_publish_recommendation: normalized.public_publish_recommendation,
    score: normalized.portfolio_score,
    recommended_section: normalized.recommended_section
  };
}
