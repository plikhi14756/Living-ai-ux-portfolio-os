"use client";

import { Bell, Check, Copy, Mail, Play, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  DuplicateResolution,
  MaintenanceIssueStatus,
  NotificationPreferences
} from "@/lib/types";

export function RunHealthCheckButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    await fetch("/api/operations/maintenance/run", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button className="btn-primary" type="button" onClick={run} disabled={loading}>
      <Play size={18} />
      {loading ? "Running..." : "Run Full Health Check"}
    </button>
  );
}

export function CopyRepairPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await copyText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <button className="btn-secondary" type="button" onClick={copy}>
      <Copy size={16} />
      {copied ? "Copied" : "Copy Codex Repair Prompt"}
    </button>
  );
}

export function IssueStatusButton({
  id,
  status
}: {
  id: string;
  status: MaintenanceIssueStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const label =
    status === "acknowledged"
      ? "Mark Acknowledged"
      : status === "resolved"
        ? "Mark Resolved"
        : status === "ignored"
          ? "Ignore"
          : "Reopen";

  async function update() {
    setLoading(true);
    await fetch(`/api/operations/issues/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button className="btn-secondary" type="button" onClick={update} disabled={loading}>
      <Check size={16} />
      {loading ? "Saving..." : label}
    </button>
  );
}

export function DuplicateResolutionControls({ auditId }: { auditId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function resolve(resolution: Exclude<DuplicateResolution, "pending">) {
    setLoading(resolution);
    await fetch(`/api/operations/duplicates/${auditId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution })
    });
    router.refresh();
    setLoading("");
  }

  const actions: Array<{
    resolution: Exclude<DuplicateResolution, "pending">;
    label: string;
  }> = [
    { resolution: "replaced_existing", label: "Replace Existing" },
    { resolution: "kept_new", label: "Keep New" },
    { resolution: "kept_both", label: "Keep Both" },
    { resolution: "cancelled", label: "Cancel" },
    { resolution: "false_positive", label: "False Positive" }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          className={action.resolution === "replaced_existing" ? "btn-danger" : "btn-secondary"}
          type="button"
          key={action.resolution}
          disabled={Boolean(loading)}
          onClick={() => resolve(action.resolution)}
        >
          {action.resolution === "cancelled" ? <X size={16} /> : <Check size={16} />}
          {loading === action.resolution ? "Saving..." : action.label}
        </button>
      ))}
    </div>
  );
}

export function NotificationPreferencesForm({
  preferences,
  recipientSource
}: {
  preferences: NotificationPreferences;
  recipientSource: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/operations/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notification_email: formData.get("notification_email"),
        timezone: formData.get("timezone"),
        weekly_maintenance_enabled: formData.get("weekly_maintenance_enabled") === "on",
        monthly_design_review_enabled:
          formData.get("monthly_design_review_enabled") === "on",
        critical_alerts_enabled: formData.get("critical_alerts_enabled") === "on",
        weekly_day_of_week: Number(formData.get("weekly_day_of_week")),
        monthly_day_of_month: Number(formData.get("monthly_day_of_month")),
        preferred_local_hour: Number(formData.get("preferred_local_hour"))
      })
    });
    const result = await response.json();
    setMessage(response.ok ? "Notification preferences saved." : result.error ?? "Save failed.");
    router.refresh();
    setSaving(false);
  }

  return (
    <form className="card space-y-4" onSubmit={submit}>
      <div>
        <p className="eyebrow">Notification Preferences</p>
        <p className="mt-2 text-sm text-ink/64 dark:text-paper/64">
          Recipient source: {recipientSource}
        </p>
      </div>
      <label className="block space-y-2">
        <span className="label">Notification email</span>
        <input
          className="field"
          name="notification_email"
          defaultValue={preferences.notification_email ?? ""}
          placeholder="Falls back to ADMIN_NOTIFICATION_EMAIL"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <TextInput name="timezone" label="Timezone" defaultValue={preferences.timezone} />
        <TextInput
          name="weekly_day_of_week"
          label="Weekly day 0-6"
          type="number"
          defaultValue={String(preferences.weekly_day_of_week)}
        />
        <TextInput
          name="monthly_day_of_month"
          label="Monthly day 1-28"
          type="number"
          defaultValue={String(preferences.monthly_day_of_month)}
        />
        <TextInput
          name="preferred_local_hour"
          label="Local hour 0-23"
          type="number"
          defaultValue={String(preferences.preferred_local_hour)}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Checkbox
          name="weekly_maintenance_enabled"
          label="Weekly maintenance email"
          defaultChecked={preferences.weekly_maintenance_enabled}
        />
        <Checkbox
          name="monthly_design_review_enabled"
          label="Monthly design-review email"
          defaultChecked={preferences.monthly_design_review_enabled}
        />
        <Checkbox
          name="critical_alerts_enabled"
          label="Critical alerts"
          defaultChecked={preferences.critical_alerts_enabled}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" type="submit" disabled={saving}>
          <Bell size={17} />
          {saving ? "Saving..." : "Save Notification Preferences"}
        </button>
        <SendTestEmailButton />
        {message ? <span className="text-sm font-semibold">{message}</span> : null}
      </div>
    </form>
  );
}

export function SendTestEmailButton() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const response = await fetch("/api/operations/notifications/test", { method: "POST" });
    const result = await response.json();
    setMessage(result.message ?? (response.ok ? "Test complete." : "Test failed."));
    setLoading(false);
  }

  return (
    <>
      <button className="btn-secondary" type="button" onClick={send} disabled={loading}>
        <Mail size={17} />
        {loading ? "Sending..." : "Send Test Email"}
      </button>
      {message ? <span className="text-xs font-semibold">{message}</span> : null}
    </>
  );
}

export function ReleaseActionButton({
  action,
  releaseId
}: {
  action: "view" | "unread";
  releaseId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update() {
    setLoading(true);
    await fetch(`/api/operations/releases/${releaseId}/${action}`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button className="btn-secondary" type="button" onClick={update} disabled={loading}>
      {action === "unread" ? <RotateCcw size={16} /> : <Check size={16} />}
      {loading ? "Saving..." : action === "unread" ? "Mark Unread" : "Got It"}
    </button>
  );
}

function Checkbox({
  defaultChecked,
  label,
  name
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="subtle-card flex items-center gap-3">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}

function TextInput({
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
    <label className="block space-y-2">
      <span className="label">{label}</span>
      <input className="field" name={name} type={type} defaultValue={defaultValue} />
    </label>
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
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
