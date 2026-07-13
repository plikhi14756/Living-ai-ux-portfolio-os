import type { DuplicateComparableStudy } from "@/lib/portfolio-operations/duplicates/normalize-study";
import { normalizeStudyForDuplicateComparison } from "@/lib/portfolio-operations/duplicates/normalize-study";

export type DuplicateClassification = "exact" | "probable" | "possible" | "clear";

export type DuplicateScore = {
  classification: DuplicateClassification;
  score: number;
  fieldComparison: {
    matchingFields: string[];
    differingFields: string[];
    missingFields: string[];
    perFieldScores: Record<string, number>;
    explanation: string;
  };
};

function tokenSimilarity(a: string, b: string) {
  if (!a || !b) return null;
  if (a === b) return 1;
  const aTokens = new Set(a.split(/\s+/).filter(Boolean));
  const bTokens = new Set(b.split(/\s+/).filter(Boolean));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union ? intersection / union : 0;
}

function closeness(a: number | null, b: number | null, tolerance: number) {
  if (a === null || b === null) return null;
  if (a === b) return 1;
  const diff = Math.abs(a - b);
  return Math.max(0, 1 - diff / tolerance);
}

function exactString(a: string, b: string) {
  if (!a || !b) return null;
  return a === b ? 1 : 0;
}

export function scoreDuplicateMatch(
  candidate: DuplicateComparableStudy,
  existing: DuplicateComparableStudy,
  exactFingerprintMatch = false
): DuplicateScore {
  const a = normalizeStudyForDuplicateComparison(candidate);
  const b = normalizeStudyForDuplicateComparison(existing);
  const scores = {
    title: tokenSimilarity(a.title, b.title),
    platform: exactString(a.platform, b.platform),
    date: exactString(a.date ?? "", b.date ?? ""),
    duration: closeness(a.durationMinutes, b.durationMinutes, 15),
    reward:
      a.rewardAmount !== null && b.rewardAmount !== null
        ? closeness(a.rewardAmount, b.rewardAmount, 10)
        : null,
    currency: exactString(a.currency ?? "", b.currency ?? "")
  };
  const weights = {
    title: 0.45,
    platform: 0.2,
    date: 0.15,
    duration: 0.1,
    reward: 0.07,
    currency: 0.03
  };
  const available = Object.entries(scores).filter(([, value]) => value !== null) as Array<
    [keyof typeof scores, number]
  >;
  const availableWeight = available.reduce((total, [key]) => total + weights[key], 0);
  const score = exactFingerprintMatch
    ? 1
    : available.reduce(
        (total, [key, value]) => total + value * (weights[key] / availableWeight),
        0
      );

  const classification =
    exactFingerprintMatch || score >= 0.98
      ? "exact"
      : score >= 0.85
        ? "probable"
        : score >= 0.72
          ? "possible"
          : "clear";
  const perFieldScores = Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [key, value ?? 0])
  );
  const matchingFields = Object.entries(scores)
    .filter(([, value]) => value !== null && value >= 0.88)
    .map(([key]) => key);
  const differingFields = Object.entries(scores)
    .filter(([, value]) => value !== null && value < 0.88)
    .map(([key]) => key);
  const missingFields = Object.entries(scores)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  return {
    classification,
    score: Number(score.toFixed(3)),
    fieldComparison: {
      matchingFields,
      differingFields,
      missingFields,
      perFieldScores,
      explanation:
        classification === "clear"
          ? "The available structured fields do not suggest a meaningful duplicate."
          : "The available structured fields are similar enough to require admin review."
    }
  };
}
