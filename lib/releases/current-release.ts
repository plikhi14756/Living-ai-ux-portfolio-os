export const CURRENT_RELEASE = {
  version: "0.2.0",
  title: "Portfolio Operations",
  summary:
    "Adds duplicate protection, operational maintenance, notification readiness, and What's New release tracking for the Living AI UX Portfolio OS.",
  releaseType: "minor",
  publishedAt: "2026-07-13T00:00:00.000Z",
  deploymentReference: "portfolio-operations-system",
  changes: [
    {
      category: "Duplicate Protection",
      title: "Duplicate-study detection",
      description:
        "New entries are checked against existing study metadata and routed to duplicate review when needed."
    },
    {
      category: "Maintenance",
      title: "Portfolio operations dashboard",
      description:
        "Health checks, maintenance history, issue controls, and copyable Codex repair prompts are available in admin."
    },
    {
      category: "Notifications",
      title: "Email notification readiness",
      description:
        "Weekly maintenance, monthly design-review, critical-alert, and test-email delivery records are supported."
    },
    {
      category: "What's New",
      title: "Release summaries",
      description:
        "Admin release history and dismissible update states help track operational changes."
    }
  ]
} as const;

export type ReleaseManifest = typeof CURRENT_RELEASE;
