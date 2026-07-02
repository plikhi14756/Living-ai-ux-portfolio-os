import { PORTFOLIO_CATEGORIES } from "@/lib/constants";
import type { StudyClassification } from "@/lib/types";

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
  "chatbot",
  "assistant",
  "voice",
  "conversational",
  "llm",
  "agent",
  "machine learning",
  "model evaluation",
  "response rating"
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
  "cultural"
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
  "demographic",
  "political survey",
  "consumer survey",
  "market research",
  "travel motivation",
  "event-driven travel",
  "fifa world cup"
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
    ...uxProductSignals
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

  return score >= 60
    ? PUBLIC_ENTRY_RECOMMENDATION
    : PUBLIC_SUPPORTING_RECOMMENDATION;
}

export function classifyStudy(input: ScoreInput) {
  const source = [
    input.platform,
    input.title,
    input.topic,
    input.notes,
    input.studyType,
    input.duration
  ]
    .join(" ")
    .toLowerCase();

  const duration = numberFromDuration(input.duration);
  const unsafe = containsAny(source, unsafeSignals);
  const genericUnrelatedSurvey = isGenericUnrelatedSurvey(source);
  let score = genericUnrelatedSurvey ? 10 : 42;

  if (containsAny(source, aiSignals)) score += 18;
  if (containsAny(source, fintechSignals)) score += 18;
  if (containsAny(source, multilingualSignals)) score += 12;
  if (containsAny(source, uxProductSignals)) score += 12;
  if (containsAny(source, majorSignals)) score += 20;
  if (duration >= 45) score += 18;
  if (duration > 0 && duration < 10) score -= 8;
  if (containsAny(source, genericSignals)) score -= 18;
  if (unsafe) score = 0;
  if (genericUnrelatedSurvey) score = 10;

  score = Math.max(0, Math.min(100, score));

  const classification = classificationForScore(score, unsafe);

  let recommended_section: string = PORTFOLIO_CATEGORIES[6];
  if (genericUnrelatedSurvey) {
    recommended_section = PORTFOLIO_CATEGORIES[6];
  } else if (classification === "Major portfolio project") {
    recommended_section = PORTFOLIO_CATEGORIES[0];
  } else if (containsAny(source, fintechSignals)) {
    recommended_section = PORTFOLIO_CATEGORIES[2];
  } else if (containsAny(source, ["voice", "chatbot", "conversational", "assistant"])) {
    recommended_section = PORTFOLIO_CATEGORIES[3];
  } else if (containsAny(source, multilingualSignals)) {
    recommended_section = PORTFOLIO_CATEGORIES[4];
  } else if (containsAny(source, aiSignals)) {
    recommended_section = PORTFOLIO_CATEGORIES[1];
  } else if (containsAny(source, ["usability", "prototype", "product feedback"])) {
    recommended_section = PORTFOLIO_CATEGORIES[5];
  }

  return {
    classification,
    genericUnrelatedSurvey,
    public_publish_recommendation: publishRecommendationForScore(
      score,
      classification,
      genericUnrelatedSurvey
    ),
    score,
    recommended_section
  };
}
