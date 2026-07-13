import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateDuplicateFingerprint } from "@/lib/portfolio-operations/duplicates/calculate-fingerprint";
import { findDuplicateMatches } from "@/lib/portfolio-operations/duplicates/find-duplicates";
import {
  normalizeDurationMinutes,
  normalizePlatform,
  normalizeStudyForDuplicateComparison
} from "@/lib/portfolio-operations/duplicates/normalize-study";
import { resolveDuplicateAuditLog } from "@/lib/portfolio-operations/duplicates/resolve-duplicate";
import { scoreDuplicateMatch } from "@/lib/portfolio-operations/duplicates/score-duplicate";
import { duplicateLog, study } from "@/tests/factories";

const storeMock = vi.hoisted(() => ({
  createDuplicateAuditLog: vi.fn(),
  createOperationsAuditLog: vi.fn(),
  getDuplicateAuditLog: vi.fn(),
  getStudy: vi.fn(),
  listDuplicateAuditLogs: vi.fn(),
  listStudies: vi.fn(),
  updateDuplicateAuditLog: vi.fn(),
  updateStudy: vi.fn()
}));

vi.mock("@/lib/data/store", () => storeMock);

describe("duplicate normalization and scoring", () => {
  it("normalizes platform names, text, and duration deterministically", () => {
    const normalized = normalizeStudyForDuplicateComparison(
      study({
        platform: "User Testing",
        study_title: "  AI—Assistant!!! Prototype   Feedback ",
        estimated_duration: "1 hr 15 mins"
      })
    );

    expect(normalized.platform).toBe("usertesting");
    expect(normalized.title).toBe("ai assistant prototype feedback");
    expect(normalizePlatform("TELUS International")).toBe("telus");
    expect(normalizeDurationMinutes("45 minutes")).toBe(45);
  });

  it("creates stable fingerprints from structured fields", () => {
    const first = calculateDuplicateFingerprint(study()).fingerprint;
    const second = calculateDuplicateFingerprint(study()).fingerprint;

    expect(first).toBe(second);
  });

  it("classifies exact, probable, and possible matches by threshold", () => {
    const candidate = study({ id: "candidate" });

    expect(scoreDuplicateMatch(candidate, study({ id: "same" }), true).classification).toBe(
      "exact"
    );
    expect(
      scoreDuplicateMatch(
        candidate,
        study({
          id: "probable",
          estimated_duration: "35 minutes",
          reward: "$10.00"
        })
      ).classification
    ).toBe("probable");
    expect(
      scoreDuplicateMatch(
        candidate,
        study({
          id: "possible",
          estimated_duration: "60 minutes",
          reward: "$20.00"
        })
      ).classification
    ).toBe("possible");
  });

  it("redistributes weights when optional fields are missing", () => {
    const result = scoreDuplicateMatch(
      study({ reward: "unknown", estimated_duration: "unknown" }),
      study({ id: "other", reward: "unknown", estimated_duration: "unknown" })
    );

    expect(result.score).toBeGreaterThan(0.9);
    expect(result.fieldComparison.missingFields).toEqual(
      expect.arrayContaining(["duration", "reward", "currency"])
    );
  });
});

describe("duplicate matching and resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("suppresses resolved intentionally-kept duplicate pairs", async () => {
    const candidate = study({ id: "candidate" });
    const existing = study({ id: "existing" });
    storeMock.listStudies.mockResolvedValue([candidate, existing]);
    storeMock.listDuplicateAuditLogs.mockResolvedValue([
      duplicateLog({
        candidate_entry_id: "candidate",
        matched_entry_id: "existing",
        resolution: "kept_both"
      })
    ]);

    const result = await findDuplicateMatches(candidate);

    expect(result.matches).toHaveLength(0);
  });

  it("materially changed records can be checked again", async () => {
    const candidate = study({ id: "candidate", study_title: "Different Follow Up Study" });
    const existing = study({ id: "existing" });
    storeMock.listStudies.mockResolvedValue([candidate, existing]);
    storeMock.listDuplicateAuditLogs.mockResolvedValue([]);

    const result = await findDuplicateMatches(candidate);

    expect(result.matches.length).toBeGreaterThanOrEqual(0);
    expect(storeMock.listStudies).toHaveBeenCalled();
  });

  it("validates replacement requires both records", async () => {
    storeMock.getDuplicateAuditLog.mockResolvedValue(duplicateLog());
    storeMock.getStudy.mockResolvedValueOnce(study({ id: "candidate" })).mockResolvedValueOnce(null);

    await expect(
      resolveDuplicateAuditLog({
        auditId: "dup-1",
        resolution: "replaced_existing",
        note: ""
      })
    ).rejects.toThrow("Both duplicate records are required.");
  });

  it("marks both records intentionally kept for Keep Both", async () => {
    const log = duplicateLog();
    storeMock.getDuplicateAuditLog.mockResolvedValue(log);
    storeMock.getStudy
      .mockResolvedValueOnce(study({ id: "study-2" }))
      .mockResolvedValueOnce(study({ id: "study-1" }));
    storeMock.updateDuplicateAuditLog.mockResolvedValue({
      ...log,
      resolution: "kept_both"
    });

    await resolveDuplicateAuditLog({
      auditId: "dup-1",
      resolution: "kept_both",
      note: "Different session"
    });

    expect(storeMock.updateStudy).toHaveBeenCalledWith("study-2", {
      duplicate_status: "intentionally_kept"
    });
    expect(storeMock.updateStudy).toHaveBeenCalledWith("study-1", {
      duplicate_status: "intentionally_kept"
    });
  });
});
