"use client";

import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLATFORM_OPTIONS } from "@/lib/constants";

export function ManualExperienceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/manual-experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formData.get("platform"),
          study_title: formData.get("study_title"),
          estimated_duration: formData.get("estimated_duration"),
          reward: formData.get("reward"),
          what_i_did: formData.get("what_i_did"),
          notes: formData.get("notes")
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Manual entry failed.");
      router.push(result.reviewUrl);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Manual entry failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <label className="block space-y-2">
        <span className="label">Platform if known</span>
        <select name="platform" className="field" defaultValue="Unknown">
          {PLATFORM_OPTIONS.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="study_title" label="Title if known" />
        <TextField name="estimated_duration" label="Duration if known" />
        <TextField name="reward" label="Reward/payment if known" />
      </div>
      <label className="block space-y-2">
        <span className="label">What I did</span>
        <textarea
          name="what_i_did"
          className="field min-h-36"
          placeholder="Example: Rated AI responses, tested a prototype, completed a moderated interview, or gave product feedback."
        />
      </label>
      <label className="block space-y-2">
        <span className="label">Additional memory or note</span>
        <textarea
          name="notes"
          className="field min-h-56"
          placeholder="Describe the platform, topic, duration, what you did, task type, feedback style, confidentiality limits, and anything visible from memory."
        />
      </label>
      {error ? (
        <p className="rounded-lg bg-ember/10 p-3 text-sm font-semibold text-ember">
          {error}
        </p>
      ) : null}
      <button className="btn-primary" type="submit" disabled={loading}>
        <PenLine size={18} />
        {loading ? "Analyzing..." : "Analyze Manual Experience"}
      </button>
    </form>
  );
}

function TextField({ label, name }: { label: string; name: string }) {
  return (
    <label className="block space-y-2">
      <span className="label">{label}</span>
      <input className="field" name={name} type="text" />
    </label>
  );
}
