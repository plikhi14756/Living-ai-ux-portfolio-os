import Link from "next/link";
import {
  CopyRepairPromptButton,
  IssueStatusButton,
  RunHealthCheckButton
} from "@/components/admin/operations-actions";
import { listMaintenanceIssues, listMaintenanceRuns } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Maintenance Issues"
};

export default async function MaintenanceIssuesPage({
  searchParams
}: {
  searchParams: Promise<{ severity?: string; status?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [issues, runs] = await Promise.all([
    listMaintenanceIssues(),
    listMaintenanceRuns()
  ]);
  const filtered = issues.filter((issue) => {
    if (params.severity && issue.severity !== params.severity) return false;
    if (params.status && issue.status !== params.status) return false;
    if (params.category && issue.category !== params.category) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Maintenance</p>
          <h1 className="mt-2 text-4xl font-black">Health checks and repair prompts</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
            Review operational findings, copy safe Codex repair prompts, and
            acknowledge or resolve issues.
          </p>
        </div>
        <RunHealthCheckButton />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Issues" value={issues.length} />
        <Metric label="Critical" value={issues.filter((issue) => issue.severity === "critical").length} />
        <Metric label="Warning" value={issues.filter((issue) => issue.severity === "warning").length} />
        <Metric label="Runs" value={runs.length} />
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Maintenance Table</p>
            <h2 className="mt-2 text-2xl font-black">Open and historical findings</h2>
          </div>
          <Link className="btn-secondary" href="/admin/operations">
            Back to Operations
          </Link>
        </div>
        <div className="mt-5 space-y-4">
          {filtered.map((issue) => (
            <article className="subtle-card" key={issue.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="tag">{issue.severity}</span>
                    <span className="tag">{issue.category}</span>
                    <span className="tag">{issue.status}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-black">{issue.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/68 dark:text-paper/68">
                    {issue.human_summary}
                  </p>
                </div>
                <CopyRepairPromptButton prompt={issue.codex_repair_prompt} />
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                <p>
                  <strong>Check:</strong> {issue.check_key}
                </p>
                <p>
                  <strong>First detected:</strong>{" "}
                  {new Date(issue.first_detected_at).toLocaleString()}
                </p>
                <p>
                  <strong>Last detected:</strong>{" "}
                  {new Date(issue.last_detected_at).toLocaleString()}
                </p>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Technical details
                </summary>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-paper/70 p-3 text-xs leading-5 dark:bg-white/[0.04]">
                  {JSON.stringify(issue.technical_details, null, 2)}
                </pre>
              </details>
              <div className="mt-4 flex flex-wrap gap-2">
                <IssueStatusButton id={issue.id} status="acknowledged" />
                <IssueStatusButton id={issue.id} status="resolved" />
                <IssueStatusButton id={issue.id} status="ignored" />
              </div>
            </article>
          ))}
          {!filtered.length ? (
            <p className="text-sm text-ink/62 dark:text-paper/62">
              No maintenance issues match this view.
            </p>
          ) : null}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Maintenance History</p>
        <div className="mt-4 space-y-3">
          {runs.slice(0, 12).map((run) => (
            <div className="subtle-card" key={run.id}>
              <p className="font-semibold">
                {run.run_type} · {run.status} · {run.overall_status}
              </p>
              <p className="mt-1 text-sm text-ink/62 dark:text-paper/62">
                {new Date(run.started_at).toLocaleString()} · {run.issue_count} issue(s)
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink/60 dark:text-paper/60">{label}</p>
    </div>
  );
}
