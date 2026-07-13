import {
  createDuplicateAuditLog,
  listDuplicateAuditLogs,
  listStudies,
  updateStudy
} from "@/lib/data/store";
import { calculateDuplicateFingerprint } from "@/lib/portfolio-operations/duplicates/calculate-fingerprint";
import { scoreDuplicateMatch, type DuplicateScore } from "@/lib/portfolio-operations/duplicates/score-duplicate";
import type { DuplicateAuditLog, Study } from "@/lib/types";

export type DuplicateMatch = DuplicateScore & {
  existingStudy: Study;
  auditLog?: DuplicateAuditLog;
};

function duplicateStatusFor(classification: DuplicateScore["classification"]) {
  if (classification === "exact") return "confirmed_duplicate";
  if (classification === "probable") return "probable_duplicate";
  if (classification === "possible") return "possible_duplicate";
  return "clear";
}

function detectionTypeFor(classification: DuplicateScore["classification"]) {
  if (classification === "exact") return "exact";
  if (classification === "probable") return "probable";
  return "possible";
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

export async function findDuplicateMatches(candidate: Study) {
  const studies = await listStudies();
  const logs = await listDuplicateAuditLogs();
  const resolvedPairs = new Set(
    logs
      .filter((log) => ["kept_both", "false_positive"].includes(log.resolution))
      .map((log) => pairKey(log.candidate_entry_id ?? "", log.matched_entry_id ?? ""))
  );
  const fingerprint = calculateDuplicateFingerprint(candidate);

  const matches = studies
    .filter((study) => study.id !== candidate.id)
    .filter((study) => !resolvedPairs.has(pairKey(candidate.id, study.id)))
    .map((study) => {
      const exactFingerprintMatch =
        Boolean(study.duplicate_fingerprint) &&
        study.duplicate_fingerprint === fingerprint.fingerprint;
      return {
        existingStudy: study,
        ...scoreDuplicateMatch(candidate, study, exactFingerprintMatch)
      };
    })
    .filter((match) => match.classification !== "clear")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    fingerprint,
    matches
  };
}

export async function runDuplicateCheckForStudy(study: Study) {
  const checkedAt = new Date().toISOString();
  const result = await findDuplicateMatches(study);
  const strongest = result.matches[0];
  const duplicate_status = strongest
    ? duplicateStatusFor(strongest.classification)
    : "clear";

  await updateStudy(study.id, {
    duplicate_fingerprint: result.fingerprint.fingerprint,
    duplicate_status,
    last_duplicate_check_at: checkedAt
  });

  if (!strongest) {
    return {
      duplicateFound: false,
      duplicateAuditId: null,
      duplicateReviewUrl: null,
      matches: []
    };
  }

  const log = await createDuplicateAuditLog({
    candidate_entry_id: study.id,
    matched_entry_id: strongest.existingStudy.id,
    detected_at: checkedAt,
    resolved_at: null,
    detection_type: detectionTypeFor(strongest.classification),
    similarity_score: strongest.score,
    field_comparison: {
      ...strongest.fieldComparison,
      candidate: safeStudySnapshot(study),
      existing: safeStudySnapshot(strongest.existingStudy)
    },
    resolution: "pending",
    winning_entry_id: null,
    losing_entry_id: null,
    resolution_note: "",
    created_by: "admin"
  });

  return {
    duplicateFound: true,
    duplicateAuditId: log.id,
    duplicateReviewUrl: `/admin/operations/duplicates?audit=${log.id}`,
    matches: [{ ...strongest, auditLog: log }]
  };
}

export function safeStudySnapshot(study: Study) {
  return {
    id: study.id,
    title: study.study_title,
    platform: study.platform,
    duration: study.estimated_duration,
    reward: study.reward,
    studyType: study.study_type,
    category: study.recommended_section,
    score: study.portfolio_score,
    status: study.status,
    classification: study.portfolio_classification,
    sourceType: study.source_type,
    createdAt: study.created_at,
    updatedAt: study.updated_at
  };
}
