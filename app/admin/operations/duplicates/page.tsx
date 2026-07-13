import Link from "next/link";
import { DuplicateResolutionControls } from "@/components/admin/operations-actions";
import { getStudy, listDuplicateAuditLogs } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Duplicate Management"
};

export default async function DuplicateManagementPage({
  searchParams
}: {
  searchParams: Promise<{ audit?: string; resolution?: string; type?: string }>;
}) {
  const params = await searchParams;
  const logs = await listDuplicateAuditLogs();
  const filtered = logs.filter((log) => {
    if (params.audit && log.id !== params.audit) return false;
    if (params.resolution && log.resolution !== params.resolution) return false;
    if (params.type && log.detection_type !== params.type) return false;
    return true;
  });
  const pending = logs.filter((log) => log.resolution === "pending");
  const selected = filtered[0];
  const candidate = selected?.candidate_entry_id
    ? await getStudy(selected.candidate_entry_id)
    : null;
  const matched = selected?.matched_entry_id ? await getStudy(selected.matched_entry_id) : null;

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow">Duplicate Protection</p>
        <h1 className="mt-2 text-4xl font-black">Duplicate management</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
          Review possible duplicate records, compare privacy-safe metadata, and
          preserve an audit trail for every decision.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <Metric label="Unresolved" value={pending.length} />
        <Metric label="Exact" value={pending.filter((log) => log.detection_type === "exact").length} />
        <Metric label="Probable" value={pending.filter((log) => log.detection_type === "probable").length} />
        <Metric label="Possible" value={pending.filter((log) => log.detection_type === "possible").length} />
        <Metric label="Kept Both" value={logs.filter((log) => log.resolution === "kept_both").length} />
      </section>

      {selected ? (
        <section className="card space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Comparison</p>
              <h2 className="mt-2 text-2xl font-black">
                {selected.detection_type} match · {Math.round(selected.similarity_score * 100)}%
              </h2>
            </div>
            <span className="tag">{selected.resolution}</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <StudyCompare title="Existing Record" study={matched} />
            <StudyCompare title="New Candidate" study={candidate} />
          </div>

          <JsonBlock title="Why it was flagged" value={selected.field_comparison} />

          {selected.resolution === "pending" ? (
            <DuplicateResolutionControls auditId={selected.id} />
          ) : null}
        </section>
      ) : null}

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Audit History</p>
            <h2 className="mt-2 text-2xl font-black">Duplicate decisions</h2>
          </div>
          <Link className="btn-secondary" href="/admin/operations">
            Back to Operations
          </Link>
        </div>
        <div className="mt-5 space-y-3">
          {filtered.map((log) => (
            <Link
              className="subtle-card block transition hover:bg-paper dark:hover:bg-white/10"
              href={`/admin/operations/duplicates?audit=${log.id}`}
              key={log.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">
                  {log.detection_type} · {Math.round(log.similarity_score * 100)}%
                </p>
                <span className="tag">{log.resolution}</span>
              </div>
              <p className="mt-2 text-sm text-ink/62 dark:text-paper/62">
                Candidate {log.candidate_entry_id ?? "missing"} / Existing{" "}
                {log.matched_entry_id ?? "missing"} ·{" "}
                {new Date(log.created_at).toLocaleString()}
              </p>
            </Link>
          ))}
          {!filtered.length ? (
            <p className="text-sm text-ink/62 dark:text-paper/62">
              No duplicate audit records match this view.
            </p>
          ) : null}
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

function StudyCompare({
  study,
  title
}: {
  study: Awaited<ReturnType<typeof getStudy>>;
  title: string;
}) {
  if (!study) {
    return (
      <div className="subtle-card">
        <p className="font-bold">{title}</p>
        <p className="mt-3 text-sm text-ink/62 dark:text-paper/62">Record unavailable.</p>
      </div>
    );
  }

  const rows = [
    ["Title", study.study_title],
    ["Platform", study.platform],
    ["Duration", study.estimated_duration],
    ["Reward", study.reward],
    ["Category", study.recommended_section],
    ["Study type", study.study_type],
    ["Portfolio score", `${study.portfolio_score}/100`],
    ["Publication status", study.status],
    ["Confidentiality", study.confidentiality_risk],
    ["Source", study.source_type],
    ["Created", new Date(study.created_at).toLocaleString()],
    ["Updated", new Date(study.updated_at).toLocaleString()]
  ];

  return (
    <div className="subtle-card">
      <p className="font-bold">{title}</p>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div className="grid gap-1 text-sm sm:grid-cols-[9rem_1fr]" key={label}>
            <dt className="font-semibold text-ink/60 dark:text-paper/60">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-bold text-ink/50 dark:text-paper/50">{title}</p>
      <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-ink/70 dark:text-paper/70">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
