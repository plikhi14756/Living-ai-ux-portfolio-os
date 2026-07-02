"use client";

import { Check, Play, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
