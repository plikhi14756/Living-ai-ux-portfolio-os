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

export function testEmailTemplate() {
  const subject = "Living AI UX Portfolio OS test email";
  const text = `This is a privacy-safe test notification. Open settings: ${baseUrl()}/admin/operations`;
  const html = shell(
    subject,
    `<p>This is a privacy-safe test notification.</p><p><a href="${baseUrl()}/admin/operations">Open Portfolio Operations</a></p>`
  );
  return { subject, text, html };
}
