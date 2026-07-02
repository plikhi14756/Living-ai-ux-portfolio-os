"use client";

import Link from "next/link";
import { CheckCircle2, FileArchive, Pencil, RefreshCw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewActions({
  canPublish,
  studyId
}: {
  canPublish: boolean;
  studyId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function run(action: "approve" | "record-only" | "reject") {
    setLoading(action);
    setError("");

    try {
      const response = await fetch(`/api/studies/${studyId}/${action}`, {
        method: "POST"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Action failed.");
      router.push(action === "approve" ? "/portfolio" : "/admin");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setLoading("");
    }
  }

  async function reanalyze() {
    setLoading("reanalyze");
    setError("");

    try {
      const response = await fetch(`/api/studies/${studyId}/reanalyze`, {
        method: "POST"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Re-analysis failed.");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Re-analysis failed.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="card space-y-4">
      <button
        className="btn-secondary w-full"
        type="button"
        disabled={Boolean(loading)}
        onClick={reanalyze}
      >
        <RefreshCw size={18} />
        {loading === "reanalyze" ? "Re-analyzing..." : "Re-analyze screenshot"}
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {canPublish ? (
          <button
            className="btn-primary"
            type="button"
            disabled={Boolean(loading)}
            onClick={() => run("approve")}
          >
            <CheckCircle2 size={18} />
            {loading === "approve" ? "Publishing..." : "Approve and publish"}
          </button>
        ) : (
          <div className="rounded-lg border border-ink/10 bg-white/60 p-3 text-sm font-semibold text-ink/68 dark:border-white/10 dark:bg-white/5 dark:text-paper/68">
            Low-score or record-only entries stay private by default.
          </div>
        )}
        <Link className="btn-secondary" href={`/admin/edit/${studyId}`}>
          <Pencil size={18} />
          Manual fill/edit details
        </Link>
        <button
          className={canPublish ? "btn-secondary" : "btn-primary"}
          type="button"
          disabled={Boolean(loading)}
          onClick={() => run("record-only")}
        >
          <FileArchive size={18} />
          {loading === "record-only" ? "Saving..." : "Save as record only"}
        </button>
        <button
          className="btn-danger"
          type="button"
          disabled={Boolean(loading)}
          onClick={() => run("reject")}
        >
          <XCircle size={18} />
          {loading === "reject" ? "Rejecting..." : "Reject"}
        </button>
      </div>
      {error ? (
        <p className="rounded-lg bg-ember/10 p-3 text-sm font-semibold text-ember">
          {error}
        </p>
      ) : null}
    </div>
  );
}
