import type { DesignReview, MaintenanceIssue, MaintenanceRun } from "@/lib/types";

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f8f7f3;color:#17211f;font-family:Arial,sans-serif"><main style="max-width:640px;margin:auto;padding:28px"><h1 style="font-size:24px">${title}</h1>${body}<p style="font-size:12px;color:#62706c">This email contains only privacy-safe operational summaries. Admin authentication is required to view details.</p></main></body></html>`;
}

export function weeklyMaintenanceEmail(run: MaintenanceRun, issues: MaintenanceIssue[]) {
  const critical = issues.filter((issue) => issue.severity === "critical").length;
  const warning = issues.filter((issue) => issue.severity === "warning").length;
  const info = issues.filter((issue) => issue.severity === "info").length;
  const subject = `Weekly portfolio maintenance: ${run.overall_status}`;
  const text = [
    subject,
    `Issues: ${issues.length}. Critical: ${critical}. Warning: ${warning}. Info: ${info}.`,
    `Open admin operations: ${baseUrl()}/admin/operations`
  ].join("\n");
  const html = shell(
    subject,
    `<p>Overall portfolio health: <strong>${run.overall_status}</strong></p><ul><li>Critical: ${critical}</li><li>Warning: ${warning}</li><li>Info: ${info}</li></ul><p><a href="${baseUrl()}/admin/operations">Open Portfolio Operations</a></p>`
  );
  return { subject, text, html };
}

export function monthlyDesignReviewEmail(review: DesignReview, run?: MaintenanceRun) {
  const subject = `Monthly design review: ${review.overall_score}/100`;
  const text = [
    subject,
    `Recommendation: ${review.recommendation_type}. Status: ${review.status}.`,
    `Open design review: ${baseUrl()}/admin/design-review`,
    run ? `Maintenance run: ${run.id}` : ""
  ].filter(Boolean).join("\n");
  const html = shell(
    subject,
    `<p>Recommendation: <strong>${review.recommendation_type}</strong></p><p>Status: ${review.status}</p><p><a href="${baseUrl()}/admin/design-review">Open Design Review</a></p>`
  );
  return { subject, text, html };
}

export function criticalAlertEmail(issue: MaintenanceIssue) {
  const subject = `Critical portfolio issue: ${issue.title}`;
  const text = [
    subject,
    issue.human_summary,
    `Open operations: ${baseUrl()}/admin/operations/maintenance`
  ].join("\n");
  const html = shell(
    subject,
    `<p>${issue.human_summary}</p><p><a href="${baseUrl()}/admin/operations/maintenance">Open Maintenance Issues</a></p>`
  );
  return { subject, text, html };
}

const FALLBACK_EMAIL_TIME_ZONE = "America/Halifax";

function resolveEmailTimeZone(timeZone: string | null | undefined) {
  const candidate = timeZone?.trim() || FALLBACK_EMAIL_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return FALLBACK_EMAIL_TIME_ZONE;
  }
}

function formatEmailTimestamp(date: Date, timeZone: string | null | undefined) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: resolveEmailTimeZone(timeZone),
    timeZoneName: "short"
  }).format(date);
}

export function testEmailTemplate(sentAt = new Date(), timeZone?: string | null) {
  const subject = `Portfolio Operations test - ${formatEmailTimestamp(sentAt, timeZone)}`;

  const operationsUrl = `${baseUrl()}/admin/operations`;

  const text = [
    "Your Living AI UX Portfolio OS email notifications are working correctly.",
    "",
    "This test confirms that:",
    "- Resend is connected",
    "- Your notification recipient is configured",
    "- Portfolio Operations can send maintenance and system alerts",
    "",
    `Open Portfolio Operations: ${operationsUrl}`,
    "",
    "This message contains only privacy-safe operational information."
  ].join("\n");

  const html = shell(
    subject,
    `
      <div style="background:#ffffff;border:1px solid #dfe5e2;border-radius:16px;padding:24px;margin-bottom:20px">
        <p style="font-size:16px;line-height:1.6;margin-top:0">
          Your <strong>Living AI UX Portfolio OS</strong> email notifications
          are working correctly.
        </p>

        <p style="font-size:15px;line-height:1.6">
          This test confirms that:
        </p>

        <ul style="font-size:15px;line-height:1.8;padding-left:22px">
          <li>Resend is connected</li>
          <li>Your notification recipient is configured</li>
          <li>Portfolio Operations can send maintenance and system alerts</li>
        </ul>

        <p style="margin-top:24px">
          <a
            href="${operationsUrl}"
            style="display:inline-block;background:#17211f;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:600"
          >
            Open Portfolio Operations
          </a>
        </p>
      </div>
    `
  );

  return { subject, text, html };
}
