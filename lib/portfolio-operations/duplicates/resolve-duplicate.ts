import {
  createOperationsAuditLog,
  getDuplicateAuditLog,
  getStudy,
  updateDuplicateAuditLog,
  updateStudy
} from "@/lib/data/store";
import { safeStudySnapshot } from "@/lib/portfolio-operations/duplicates/find-duplicates";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DuplicateResolution } from "@/lib/types";

export async function resolveDuplicateAuditLog({
  auditId,
  note,
  resolution
}: {
  auditId: string;
  note: string;
  resolution: Exclude<DuplicateResolution, "pending">;
}) {
  const log = await getDuplicateAuditLog(auditId);
  if (!log) throw new Error("Duplicate audit record was not found.");

  const candidate = log.candidate_entry_id
    ? await getStudy(log.candidate_entry_id)
    : null;
  const matched = log.matched_entry_id ? await getStudy(log.matched_entry_id) : null;
  const resolvedAt = new Date().toISOString();
  let winning_entry_id: string | null = null;
  let losing_entry_id: string | null = null;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase.rpc("resolve_duplicate_decision", {
      p_audit_id: auditId,
      p_resolution: resolution,
      p_note: note
    });
    if (error) throw error;

    await createOperationsAuditLog({
      action: `duplicate_${resolution}`,
      entity_type: "duplicate_audit_log",
      entity_id: auditId,
      actor: "admin",
      before_state: {
        audit: log,
        candidate: candidate ? safeStudySnapshot(candidate) : null,
        matched: matched ? safeStudySnapshot(matched) : null
      },
      after_state: data,
      metadata: { note, transactional: true }
    });

    return data;
  }

  if (resolution === "replaced_existing") {
    if (!candidate || !matched) throw new Error("Both duplicate records are required.");
    winning_entry_id = candidate.id;
    losing_entry_id = matched.id;
    await updateStudy(matched.id, {
      duplicate_status: "superseded",
      superseded_by: candidate.id,
      superseded_at: resolvedAt,
      status: matched.status === "approved" ? "record_only" : matched.status
    });
    await updateStudy(candidate.id, {
      duplicate_status: "clear",
      superseded_by: null,
      superseded_at: null
    });
  }

  if (resolution === "kept_new") {
    if (!candidate || !matched) throw new Error("Both duplicate records are required.");
    winning_entry_id = candidate.id;
    losing_entry_id = matched.id;
    await updateStudy(matched.id, {
      duplicate_status: "superseded",
      superseded_by: candidate.id,
      superseded_at: resolvedAt
    });
    await updateStudy(candidate.id, { duplicate_status: "clear" });
  }

  if (resolution === "kept_both") {
    if (candidate) await updateStudy(candidate.id, { duplicate_status: "intentionally_kept" });
    if (matched) await updateStudy(matched.id, { duplicate_status: "intentionally_kept" });
  }

  if (resolution === "cancelled") {
    if (candidate) await updateStudy(candidate.id, { status: "rejected", duplicate_status: "clear" });
    winning_entry_id = matched?.id ?? null;
    losing_entry_id = candidate?.id ?? null;
  }

  if (resolution === "false_positive") {
    if (candidate) await updateStudy(candidate.id, { duplicate_status: "clear" });
    if (matched) await updateStudy(matched.id, { duplicate_status: "clear" });
  }

  const updated = await updateDuplicateAuditLog(auditId, {
    resolution,
    resolved_at: resolvedAt,
    winning_entry_id,
    losing_entry_id,
    resolution_note: note
  });

  await createOperationsAuditLog({
    action: `duplicate_${resolution}`,
    entity_type: "duplicate_audit_log",
    entity_id: auditId,
    actor: "admin",
    before_state: {
      audit: log,
      candidate: candidate ? safeStudySnapshot(candidate) : null,
      matched: matched ? safeStudySnapshot(matched) : null
    },
    after_state: updated,
    metadata: { note }
  });

  return updated;
}
