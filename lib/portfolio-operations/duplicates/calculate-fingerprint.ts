import { createHash } from "node:crypto";
import type { DuplicateComparableStudy } from "@/lib/portfolio-operations/duplicates/normalize-study";
import { normalizeStudyForDuplicateComparison } from "@/lib/portfolio-operations/duplicates/normalize-study";

export function calculateDuplicateFingerprint(study: DuplicateComparableStudy) {
  const fields = normalizeStudyForDuplicateComparison(study);
  const parts = [
    fields.platform ? `platform:${fields.platform}` : "",
    fields.title ? `title:${fields.title}` : "",
    fields.date ? `date:${fields.date}` : "",
    fields.durationMinutes !== null ? `duration:${fields.durationMinutes}` : ""
  ].filter(Boolean);

  const source = parts.length ? parts.join("|") : `title:${fields.title || "unknown"}`;
  return {
    fingerprint: createHash("sha256").update(source).digest("hex"),
    contributedFields: parts.map((part) => part.split(":")[0]),
    normalized: fields
  };
}
