"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { PLATFORM_OPTIONS } from "@/lib/constants";

export function UploadStudyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("screenshots") as HTMLInputElement | null;
    const files = fileInput?.files;

    if (!files?.length) {
      setError("Upload at least one screenshot before running analysis.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData(form);
      const response = await fetch("/api/analyze-study", {
        method: "POST",
        body: formData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      router.push(result.reviewUrl);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} encType="multipart/form-data" className="card space-y-5">
      <div>
        <label className="label" htmlFor="screenshots">
          Screenshot evidence
        </label>
        <input
          id="screenshots"
          name="screenshots"
          type="file"
          accept="image/*"
          multiple
          required
          className="field mt-2"
        />
      </div>
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
          className="field min-h-28"
          placeholder="Example: Completed a short AI assistant evaluation and gave written feedback on clarity, trust, and task flow."
        />
      </label>
      <label className="block space-y-2">
        <span className="label">Optional memory or note</span>
        <textarea
          name="notes"
          className="field min-h-36"
          placeholder="Example: 45-minute moderated session about an AI assistant prototype with spoken feedback on trust, clarity, and task flow."
        />
      </label>
      {error ? (
        <p className="rounded-lg bg-ember/10 p-3 text-sm font-semibold text-ember">
          {error}
        </p>
      ) : null}
      <button className="btn-primary" type="submit" disabled={loading}>
        <UploadCloud size={18} />
        {loading ? "Analyzing..." : "Analyze Study"}
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
