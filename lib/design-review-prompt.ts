import type { DesignReview } from "@/lib/types";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function redactPrivateReferences(text: string) {
  return text
    .replace(/\/api\/storage\/screenshot\/[^\s"')]+/gi, "[private screenshot route redacted]")
    .replace(/\/uploads\/studies\/[^\s"')]+/gi, "[private upload path redacted]")
    .replace(
      /https?:\/\/[^\s"')]*(?:storage|upload|uploads|screenshot|screenshots)[^\s"')]+/gi,
      "[private evidence URL redacted]"
    )
    .replace(
      /\b(OPENAI_API_KEY|NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|CRON_SECRET|ADMIN_ACCESS_TOKEN)=\S*/g,
      "$1=[redacted]"
    );
}

function readableKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatInlineValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => formatInlineValue(item)).join("; ");
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, entry]) => `${readableKey(key)}: ${formatInlineValue(entry)}`)
      .join("; ");
  }

  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  return String(value);
}

function listFromValue(value: unknown, preferredKey?: string) {
  if (Array.isArray(value)) {
    return value.map((item) => redactPrivateReferences(formatInlineValue(item)));
  }

  if (isRecord(value)) {
    const preferred = preferredKey ? value[preferredKey] : undefined;
    if (Array.isArray(preferred)) {
      return preferred.map((item) => redactPrivateReferences(formatInlineValue(item)));
    }

    return Object.entries(value)
      .filter(([key]) => key !== "risk_level" && key !== "reason")
      .map(([key, entry]) =>
        redactPrivateReferences(`${readableKey(key)}: ${formatInlineValue(entry)}`)
      );
  }

  return [redactPrivateReferences(formatInlineValue(value))];
}

function bulletList(items: string[], fallback: string) {
  const visibleItems = items.filter((item) => item && item !== "Not specified");
  if (!visibleItems.length) return `- ${fallback}`;
  return visibleItems.map((item) => `- ${item}`).join("\n");
}

function extractNestedText(value: unknown, key: string) {
  if (!isRecord(value)) return "Not specified";
  return redactPrivateReferences(formatInlineValue(value[key]));
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

export function buildCodexDesignReviewPrompt(review: DesignReview) {
  const recommendations = bulletList(
    listFromValue(review.recommendations, "recommendations"),
    "No recommendations were recorded."
  );
  const previewChanges = bulletList(
    listFromValue(review.preview_changes, "changes"),
    "No preview design changes were recorded."
  );
  const riskLevel = extractNestedText(review.preview_changes, "risk_level");
  const reason = extractNestedText(review.preview_changes, "reason");

  return `Implement the design review proposal for Living AI UX Portfolio OS.

Review details:
- Review month/date: ${redactPrivateReferences(review.review_month)}
- Created date: ${formatDate(review.created_at)}
- Approved date: ${formatDate(review.approved_at)}
- Score: ${review.overall_score}/100
- Status: ${review.status}
- Refresh type/recommendation: ${review.recommendation_type}
- Risk level: ${riskLevel}

Recommendations:
${recommendations}

Preview design changes:
${previewChanges}

Reason/context:
- ${reason}

Safe implementation instructions:
- Update only the public website design layer needed to reflect this proposal.
- If this review status is not approved, confirm with the user before implementing design changes.
- Keep the admin dashboard protected and do not redesign or weaken private admin areas.
- Do not change the database schema, Supabase migrations, seed data, or production data.
- Do not change PDF generation, PDF export routes, branded PDF layout, or document export behavior.
- Do not change the admin approval flow, protected admin routes, authentication/token logic, admin APIs, or screenshot evidence routes.
- Do not change record-only privacy logic or public filtering rules for low-score/private entries.
- Do not expose private screenshots, screenshot URLs, uploaded evidence, study IDs, completion codes, researcher names, private notes, API keys, tokens, or confidential records.
- Do not access production Supabase directly. Work only from the local repository and environment placeholders.
- Do not modify case study routes or the documents page unless the user explicitly requests that as a separate task.
- Keep public pages showing only approved, portfolio-worthy entries.
- Preserve existing public content and routing while making focused, mobile-friendly visual improvements consistent with the current brand.
- After implementation, run npm run typecheck and npm run build.`;
}
