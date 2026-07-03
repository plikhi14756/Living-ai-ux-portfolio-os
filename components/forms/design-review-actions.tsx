"use client";

import { Check, Copy, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildCodexDesignReviewPrompt } from "@/lib/design-review-prompt";
import type { DesignReview } from "@/lib/types";

export function RunDesignReviewButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    await fetch("/api/design-review/run", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button className="btn-primary" type="button" onClick={run} disabled={loading}>
      <Play size={18} />
      {loading ? "Running..." : "Run design review"}
    </button>
  );
}

export function RunMaintenanceButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    await fetch("/api/maintenance/run", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button className="btn-secondary" type="button" onClick={run} disabled={loading}>
      <Play size={18} />
      {loading ? "Checking..." : "Run maintenance check"}
    </button>
  );
}

export function DesignReviewDecision({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function decide(action: "approve" | "reject") {
    setLoading(action);
    await fetch(`/api/design-review/${id}/${action}`, { method: "POST" });
    router.refresh();
    setLoading("");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="btn-primary"
        type="button"
        onClick={() => decide("approve")}
        disabled={Boolean(loading)}
      >
        <Check size={17} />
        {loading === "approve" ? "Approving..." : "Approve design refresh"}
      </button>
      <button
        className="btn-secondary"
        type="button"
        onClick={() => decide("reject")}
        disabled={Boolean(loading)}
      >
        <X size={17} />
        {loading === "reject" ? "Keeping..." : "Reject / keep current design"}
      </button>
    </div>
  );
}

export function CopyCodexImplementationPromptButton({
  review
}: {
  review: DesignReview;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copyPrompt() {
    const prompt = buildCodexDesignReviewPrompt(review);

    try {
      await copyText(prompt);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (error) {
      console.error("Unable to copy Codex implementation prompt", error);
      setStatus("error");
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        className="btn-secondary"
        type="button"
        onClick={copyPrompt}
        data-testid="copy-codex-implementation-prompt"
      >
        <Copy size={17} />
        {status === "copied"
          ? "Copied Codex prompt"
          : "Copy Codex Implementation Prompt"}
      </button>
      <p
        className="text-xs font-semibold text-ink/55 dark:text-paper/55"
        aria-live="polite"
      >
        {status === "copied"
          ? "Full safe implementation prompt copied."
          : status === "error"
            ? "Copy failed. Try again from a secure browser context."
            : "Includes review details and protected-scope instructions."}
      </p>
    </div>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard copy command was not accepted.");
  }
}
