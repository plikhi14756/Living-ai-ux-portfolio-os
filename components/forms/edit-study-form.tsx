"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PORTFOLIO_CATEGORIES, STUDY_CLASSIFICATIONS, STUDY_STATUSES } from "@/lib/constants";
import type { Study } from "@/lib/types";

export function EditStudyForm({ study }: { study: Study }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const skills = String(formData.get("skills_demonstrated") ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const missingQuestions = String(formData.get("missing_questions") ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`/api/studies/${study.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formData.get("platform"),
          study_title: formData.get("study_title"),
          visible_topic: formData.get("visible_topic"),
          estimated_duration: formData.get("estimated_duration"),
          reward: formData.get("reward"),
          study_type: formData.get("study_type"),
          approval_status: formData.get("approval_status"),
          what_i_did: formData.get("what_i_did"),
          confidentiality_risk: formData.get("confidentiality_risk"),
          portfolio_classification: formData.get("portfolio_classification"),
          recommended_section: formData.get("recommended_section"),
          portfolio_score: Number(formData.get("portfolio_score")),
          safe_public_title: formData.get("safe_public_title"),
          safe_public_description: formData.get("safe_public_description"),
          case_study_summary: formData.get("case_study_summary"),
          skills_demonstrated: skills,
          linkedin_featured_title: formData.get("linkedin_featured_title"),
          linkedin_featured_description: formData.get("linkedin_featured_description"),
          public_publish_recommendation: formData.get("public_publish_recommendation"),
          analysis_status: formData.get("analysis_status"),
          status: formData.get("status"),
          ai_confidence: Number(formData.get("ai_confidence")),
          missing_questions: missingQuestions
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Save failed.");
      router.push(`/admin/review/${study.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="platform" label="Platform" defaultValue={study.platform} />
        <TextField name="study_title" label="Visible/internal title" defaultValue={study.study_title} />
        <TextField name="visible_topic" label="Visible topic" defaultValue={study.visible_topic} />
        <TextField name="estimated_duration" label="Estimated duration" defaultValue={study.estimated_duration} />
        <TextField name="reward" label="Reward/payment" defaultValue={study.reward} />
        <TextField name="study_type" label="Study type" defaultValue={study.study_type} />
        <TextField name="approval_status" label="Visible approval/payment status" defaultValue={study.approval_status} />
        <label className="space-y-2">
          <span className="label">Confidentiality risk</span>
          <select name="confidentiality_risk" className="field" defaultValue={study.confidentiality_risk}>
            {["low", "medium", "high", "unknown"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="label">Portfolio classification</span>
          <select name="portfolio_classification" className="field" defaultValue={study.portfolio_classification}>
            {STUDY_CLASSIFICATIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="label">Recommended section</span>
          <select name="recommended_section" className="field" defaultValue={study.recommended_section}>
            {PORTFOLIO_CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <TextField
          name="portfolio_score"
          label="Portfolio score"
          type="number"
          defaultValue={String(study.portfolio_score)}
        />
        <TextField
          name="ai_confidence"
          label="AI confidence"
          type="number"
          defaultValue={String(study.ai_confidence)}
        />
        <label className="space-y-2">
          <span className="label">Analysis status</span>
          <select name="analysis_status" className="field" defaultValue={study.analysis_status}>
            {[
              "OpenAI analyzed successfully",
              "Manual/fallback extraction only",
              "Re-analysis needed"
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="label">Status</span>
          <select name="status" className="field" defaultValue={study.status}>
            {STUDY_STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <TextArea name="what_i_did" label="What I did" defaultValue={study.what_i_did} />
      <TextField name="safe_public_title" label="Safe public title" defaultValue={study.safe_public_title} />
      <TextArea name="safe_public_description" label="Safe public description" defaultValue={study.safe_public_description} />
      <TextArea name="case_study_summary" label="Case-study summary" defaultValue={study.case_study_summary} />
      <TextArea
        name="skills_demonstrated"
        label="Skills demonstrated, one per line"
        defaultValue={study.skills_demonstrated.join("\n")}
      />
      <TextField
        name="linkedin_featured_title"
        label="LinkedIn Featured title"
        defaultValue={study.linkedin_featured_title}
      />
      <TextArea
        name="linkedin_featured_description"
        label="LinkedIn Featured description"
        defaultValue={study.linkedin_featured_description}
      />
      <TextField
        name="public_publish_recommendation"
        label="Public publish recommendation"
        defaultValue={study.public_publish_recommendation}
      />
      <TextArea
        name="missing_questions"
        label="Missing questions, one per line"
        defaultValue={study.missing_questions.join("\n")}
      />

      {error ? (
        <p className="rounded-lg bg-ember/10 p-3 text-sm font-semibold text-ember">
          {error}
        </p>
      ) : null}
      <button className="btn-primary" type="submit" disabled={loading}>
        <Save size={18} />
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

function TextField({
  defaultValue,
  label,
  name,
  type = "text"
}: {
  defaultValue: string;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="label">{label}</span>
      <input className="field" name={name} type={type} defaultValue={defaultValue} />
    </label>
  );
}

function TextArea({
  defaultValue,
  label,
  name
}: {
  defaultValue: string;
  label: string;
  name: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="label">{label}</span>
      <textarea className="field min-h-32" name={name} defaultValue={defaultValue} />
    </label>
  );
}
