"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PORTFOLIO_CATEGORIES } from "@/lib/constants";

type SettingsFormProps = {
  identity: Record<string, string>;
  aiRules: unknown;
  notificationSettings: unknown;
  pdfSettings: unknown;
  privacyRules: unknown;
};

export function SettingsForm({
  aiRules,
  identity,
  notificationSettings,
  pdfSettings,
  privacyRules
}: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    const formData = new FormData(event.currentTarget);

    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: {
          brandLine: formData.get("brandLine"),
          homepageTitle: formData.get("homepageTitle"),
          homepageSubtitle: formData.get("homepageSubtitle"),
          intro: formData.get("intro"),
          confidentialityNote: formData.get("confidentialityNote")
        },
        portfolio_categories: String(formData.get("portfolio_categories") ?? "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        ai_rules: parseJsonSetting(formData.get("ai_rules"), aiRules),
        privacy_rules: parseJsonSetting(formData.get("privacy_rules"), privacyRules),
        notification_settings: parseJsonSetting(
          formData.get("notification_settings"),
          notificationSettings
        ),
        pdf_style_settings: parseJsonSetting(formData.get("pdf_style_settings"), pdfSettings)
      })
    });

    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="card space-y-4">
        <p className="eyebrow">Site Identity</p>
        <TextField name="brandLine" label="Public brand line" defaultValue={identity.brandLine ?? ""} />
        <TextField name="homepageTitle" label="Homepage title" defaultValue={identity.homepageTitle ?? ""} />
        <TextArea name="homepageSubtitle" label="Homepage subtitle" defaultValue={identity.homepageSubtitle ?? ""} />
        <TextArea name="intro" label="Intro" defaultValue={identity.intro ?? ""} />
        <TextArea name="confidentialityNote" label="Confidentiality note" defaultValue={identity.confidentialityNote ?? ""} />
      </section>

      <section className="card space-y-4">
        <p className="eyebrow">Portfolio Categories</p>
        <TextArea
          name="portfolio_categories"
          label="Categories, one per line"
          defaultValue={PORTFOLIO_CATEGORIES.join("\n")}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <JsonArea name="ai_rules" label="AI rules" value={aiRules} />
        <JsonArea name="privacy_rules" label="Privacy rules" value={privacyRules} />
        <JsonArea name="notification_settings" label="Notification settings" value={notificationSettings} />
        <JsonArea name="pdf_style_settings" label="PDF style settings" value={pdfSettings} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" type="submit" disabled={loading}>
          <Save size={18} />
          {loading ? "Saving..." : "Save settings"}
        </button>
        {saved ? (
          <span className="text-sm font-semibold text-moss dark:text-cyan">Saved</span>
        ) : null}
      </div>
    </form>
  );
}

function parseJsonSetting(value: FormDataEntryValue | null, fallback: unknown) {
  try {
    return JSON.parse(String(value ?? "{}"));
  } catch {
    return fallback;
  }
}

function TextField({
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
      <input className="field" name={name} defaultValue={defaultValue} />
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
      <textarea className="field min-h-28" name={name} defaultValue={defaultValue} />
    </label>
  );
}

function JsonArea({
  label,
  name,
  value
}: {
  label: string;
  name: string;
  value: unknown;
}) {
  return (
    <section className="card space-y-3">
      <p className="eyebrow">{label}</p>
      <textarea
        className="field min-h-52 font-mono text-xs"
        name={name}
        defaultValue={JSON.stringify(value ?? {}, null, 2)}
      />
    </section>
  );
}
