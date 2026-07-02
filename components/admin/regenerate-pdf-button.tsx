"use client";

import { FileText, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegeneratePdfButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function regenerate() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/regenerate-pdf", {
        method: "POST"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "PDF regeneration failed.");
      setMessage(
        `Living PDF portfolio updated with ${result.includedEntryCount ?? 0} entries.`
      );
      router.refresh();
    } catch (regenerateError) {
      setError(
        regenerateError instanceof Error
          ? regenerateError.message
          : "PDF regeneration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3 text-moss dark:text-cyan">
        <FileText size={20} />
        <p className="font-bold text-ink dark:text-paper">Living PDF portfolio</p>
      </div>
      <p className="text-sm leading-6 text-ink/66 dark:text-paper/66">
        Regenerate the latest public PDF from approved portfolio-worthy entries.
      </p>
      <button
        className="btn-primary w-full"
        type="button"
        disabled={loading}
        onClick={regenerate}
      >
        <RefreshCw size={18} />
        {loading ? "Regenerating..." : "Regenerate Living PDF"}
      </button>
      {message ? (
        <p className="rounded-lg bg-moss/10 p-3 text-sm font-semibold text-moss dark:text-cyan">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-ember/10 p-3 text-sm font-semibold text-ember">
          {error}
        </p>
      ) : null}
    </div>
  );
}
