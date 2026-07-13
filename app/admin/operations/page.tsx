import Link from "next/link";
import { AlertTriangle, Bell, GitCompareArrows, HeartPulse, Sparkles } from "lucide-react";
import {
  NotificationPreferencesForm,
  RunHealthCheckButton
} from "@/components/admin/operations-actions";
import { listAllOperationsData } from "@/lib/data/store";
import { resolveNotificationRecipient } from "@/lib/portfolio-operations/email/resolve-recipient";
import { getReleaseState } from "@/lib/portfolio-operations/releases";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portfolio Operations"
};

export default async function PortfolioOperationsPage() {
  const [operations, recipient, releaseState] = await Promise.all([
    listAllOperationsData(),
    resolveNotificationRecipient(),
    getReleaseState()
  ]);
  const openIssues = operations.maintenanceIssues.filter((issue) =>
    ["open", "acknowledged"].includes(issue.status)
  );
  const critical = openIssues.filter((issue) => issue.severity === "critical").length;
  const warning = openIssues.filter((issue) => issue.severity === "warning").length;
  const info = openIssues.filter((issue) => issue.severity === "info").length;
  const pendingDuplicates = operations.duplicateLogs.filter(
    (log) => log.resolution === "pending"
  );
  const exact = pendingDuplicates.filter((log) => log.detection_type === "exact").length;
  const probable = pendingDuplicates.filter((log) => log.detection_type === "probable").length;
  const possible = pendingDuplicates.filter((log) => log.detection_type === "possible").length;
  const latestRun = operations.maintenanceRuns[0];
  const latestDelivery = operations.notificationDeliveries[0];
  const health = critical ? "Critical" : warning ? "Attention required" : "Healthy";

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Portfolio Operations</p>
          <h1 className="mt-2 text-4xl font-black">Operational control centre</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
            Monitor duplicate protection, maintenance issues, notification readiness,
            release summaries, and operational audit history.
          </p>
        </div>
        <RunHealthCheckButton />
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Overall Health" value={health} icon={<HeartPulse size={19} />} />
        <Metric label="Critical Issues" value={critical} icon={<AlertTriangle size={19} />} />
        <Metric label="Warnings" value={warning} icon={<AlertTriangle size={19} />} />
        <Metric label="Info" value={info} icon={<AlertTriangle size={19} />} />
        <Metric label="Duplicate Alerts" value={pendingDuplicates.length} icon={<GitCompareArrows size={19} />} />
        <Metric label="Unread Releases" value={releaseState.unread.length} icon={<Sparkles size={19} />} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <OperationCard
          title="Duplicate Protection"
          href="/admin/operations/duplicates"
          icon={<GitCompareArrows size={20} />}
          lines={[
            `${pendingDuplicates.length} unresolved duplicate alert(s)`,
            `Exact ${exact} / probable ${probable} / possible ${possible}`,
            operations.duplicateLogs[0]
              ? `Latest event: ${operations.duplicateLogs[0].detection_type}`
              : "No duplicate audit history yet"
          ]}
        />
        <OperationCard
          title="System Health"
          href="/admin/operations/maintenance"
          icon={<HeartPulse size={20} />}
          lines={[
            health,
            latestRun
              ? `Latest run: ${latestRun.run_type} / ${latestRun.status}`
              : "No operations maintenance run yet",
            `${openIssues.length} open or acknowledged issue(s)`
          ]}
        />
        <OperationCard
          title="Notifications"
          href="/admin/operations#notification-preferences"
          icon={<Bell size={20} />}
          lines={[
            `Weekly ${operations.notificationPreferences.weekly_maintenance_enabled ? "enabled" : "disabled"}`,
            `Monthly ${operations.notificationPreferences.monthly_design_review_enabled ? "enabled" : "disabled"}`,
            `Critical alerts ${operations.notificationPreferences.critical_alerts_enabled ? "enabled" : "disabled"}`,
            recipient.recipient
              ? `Recipient configured through ${recipient.source}`
              : "No recipient configured",
            latestDelivery ? `Last email status: ${latestDelivery.status}` : "No email delivery history"
          ]}
        />
        <OperationCard
          title="What's New"
          href="/admin/operations/releases"
          icon={<Sparkles size={20} />}
          lines={[
            releaseState.releases[0]
              ? `Current version: ${releaseState.releases[0].version}`
              : "No release synchronized yet",
            `${releaseState.unread.length} unread release(s)`,
            releaseState.releases[0]
              ? `Latest release: ${releaseState.releases[0].published_at.slice(0, 10)}`
              : "Release manifest pending"
          ]}
        />
      </section>

      <NotificationPreferencesForm
        preferences={operations.notificationPreferences}
        recipientSource={recipient.source}
      />

      <section className="card">
        <p className="eyebrow">Operations History</p>
        <div className="mt-4 space-y-3">
          {operations.operationsAuditLogs.slice(0, 8).map((audit) => (
            <div className="subtle-card" key={audit.id}>
              <p className="font-semibold">{audit.action}</p>
              <p className="mt-1 text-sm text-ink/62 dark:text-paper/62">
                {audit.entity_type} {audit.entity_id ? `- ${audit.entity_id}` : ""} ·{" "}
                {new Date(audit.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {!operations.operationsAuditLogs.length ? (
            <p className="text-sm text-ink/62 dark:text-paper/62">
              No operational audit events yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="card">
      <div className="text-moss dark:text-cyan">{icon}</div>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink/60 dark:text-paper/60">{label}</p>
    </div>
  );
}

function OperationCard({
  href,
  icon,
  lines,
  title
}: {
  href: string;
  icon: React.ReactNode;
  lines: string[];
  title: string;
}) {
  return (
    <Link className="card block transition hover:-translate-y-0.5" href={href}>
      <div className="flex items-center gap-3 text-moss dark:text-cyan">
        {icon}
        <h2 className="text-xl font-black text-ink dark:text-paper">{title}</h2>
      </div>
      <div className="mt-4 space-y-2 text-sm leading-6 text-ink/68 dark:text-paper/68">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </Link>
  );
}
