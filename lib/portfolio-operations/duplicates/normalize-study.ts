import type { Study, StudyInput } from "@/lib/types";

export type DuplicateComparableStudy = {
  id?: string;
  platform: Study["platform"] | StudyInput["platform"];
  study_title: Study["study_title"] | StudyInput["study_title"];
  estimated_duration: Study["estimated_duration"] | StudyInput["estimated_duration"];
  reward: Study["reward"] | StudyInput["reward"];
  study_type: Study["study_type"] | StudyInput["study_type"];
  recommended_section: Study["recommended_section"] | StudyInput["recommended_section"];
  source_type: Study["source_type"] | StudyInput["source_type"];
  created_at?: string;
  visible_topic?: string;
};

export type NormalizedStudyFields = {
  platform: string;
  title: string;
  topic: string;
  durationMinutes: number | null;
  rewardAmount: number | null;
  currency: string | null;
  studyType: string;
  category: string;
  sourceType: string;
  date: string | null;
};

const PLATFORM_ALIASES: Record<string, string> = {
  prolific: "prolific",
  usertesting: "usertesting",
  "user testing": "usertesting",
  userlytics: "userlytics",
  telus: "telus",
  "telus international": "telus"
};

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}$€£₹.\s-]/gu, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePlatform(value: unknown) {
  const normalized = normalizeText(value);
  if (!normalized || normalized === "unknown") return "";
  return PLATFORM_ALIASES[normalized] ?? normalized;
}

export function normalizeDurationMinutes(value: unknown) {
  const text = normalizeText(value);
  if (!text || text === "unknown") return null;
  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/);
  const bareNumber = text.match(/^(\d+(?:\.\d+)?)$/);

  if (hours || minutes) {
    return Math.round(
      (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0)
    );
  }

  return bareNumber ? Math.round(Number(bareNumber[1])) : null;
}

export function normalizeReward(value: unknown) {
  const text = normalizeText(value);
  if (!text || text === "unknown") return { amount: null, currency: null };
  const currency = text.includes("$")
    ? "USD"
    : text.includes("£")
      ? "GBP"
      : text.includes("€")
        ? "EUR"
        : text.includes("₹")
          ? "INR"
          : null;
  const amount = text.match(/(\d+(?:\.\d+)?)/);
  return {
    amount: amount ? Number(amount[1]) : null,
    currency
  };
}

export function normalizeStudyDate(value: unknown) {
  const text = String(value ?? "");
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function normalizeStudyForDuplicateComparison(
  study: DuplicateComparableStudy
): NormalizedStudyFields {
  const reward = normalizeReward(study.reward);
  return {
    platform: normalizePlatform(study.platform),
    title: normalizeText(study.study_title),
    topic: normalizeText(study.visible_topic),
    durationMinutes: normalizeDurationMinutes(study.estimated_duration),
    rewardAmount: reward.amount,
    currency: reward.currency,
    studyType: normalizeText(study.study_type),
    category: normalizeText(study.recommended_section),
    sourceType: normalizeText(study.source_type),
    date: normalizeStudyDate(study.created_at)
  };
}
