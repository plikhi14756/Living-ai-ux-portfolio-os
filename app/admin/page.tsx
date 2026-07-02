import Link from "next/link";
import { Activity, FileCheck2, FileClock, FileX2, Gauge } from "lucide-react";
import { RegeneratePdfButton } from "@/components/admin/regenerate-pdf-button";
import { StudyCard } from "@/components/study-card";
import {
  listDesignReviews,
  listMaintenanceReports,
  listStudies
} from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard"
};

export default async function AdminDashboardPage() {
  const [studies, designReviews, maintenanceReports] = await Promise.all([
    listStudies(),
    listDesignReviews(),
    listMaintenanceReports()
  ]);

  const pending = studies.filter((study) => study.status === "pending");
  const approved = studies.filter((study) => study.status === "approved");
  const rejected = studies.filter((study) => study.status === "rejected");
  const latestDesign = designReviews[0];
  const latestMaintenance = maintenanceReports[0];

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow">Private Admin Dashboard</p>
        <h1 className="mt-2 text-4xl font-black">Review, approve, and publish evidence</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={<FileClock size={20} />} label="Pending studies" value={pending.length} />
        <Metric icon={<FileCheck2 size={20} />} label="Approved studies" value={approved.length} />
        <Metric icon={<FileX2 size={20} />} label="Rejected studies" value={rejected.length} />
        <Metric
          icon={<Gauge size={20} />}
          label="High-score entries"
          value={approved.filter((study) => study.portfolio_score >= 75).length}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Pending Studies</p>
              <h2 className="mt-2 text-2xl font-black">Ready for review</h2>
            </div>
            <div className="flex gap-2">
              <Link className="btn-primary" href="/admin/upload">
                Upload
              </Link>
              <Link className="btn-secondary" href="/admin/manual">
                Manual
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            {pending.slice(0, 4).map((study) => (
              <StudyCard admin study={study} key={study.id} />
            ))}
            {pending.length === 0 ? (
              <p className="text-sm text-ink/62 dark:text-paper/62">
                No pending studies right now.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <StatusPanel
            title="Monthly design review status"
            icon={<Activity size={20} />}
            body={
              latestDesign
                ? `${latestDesign.overall_score}/100 - ${latestDesign.recommendation_type} - ${latestDesign.status}`
                : "No design review yet."
            }
            href="/admin/design-review"
          />
          <StatusPanel
            title="Website health status"
            icon={<Gauge size={20} />}
            body={
              latestMaintenance
                ? `${latestMaintenance.pdf_status}. ${latestMaintenance.mobile_status}`
                : "No maintenance report yet."
            }
            href="/admin/design-review"
          />
          <RegeneratePdfButton />
          <div className="card">
            <p className="eyebrow">Recent AI Suggestions</p>
            <div className="mt-4 space-y-3">
              {studies.slice(0, 5).map((study) => (
                <Link
                  className="block rounded-lg border border-ink/10 p-3 text-sm transition hover:bg-paper dark:border-white/10 dark:hover:bg-white/10"
                  href={`/admin/review/${study.id}`}
                  key={study.id}
                >
                  <span className="font-semibold">{study.safe_public_title}</span>
                  <span className="mt-1 block text-ink/58 dark:text-paper/58">
                    {study.portfolio_classification} / {study.portfolio_score}/100
                  </span>
                </Link>
              ))}
            </div>
          </div>
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
  value: number;
}) {
  return (
    <div className="card">
      <div className="text-moss dark:text-cyan">{icon}</div>
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink/60 dark:text-paper/60">
        {label}
      </p>
    </div>
  );
}

function StatusPanel({
  body,
  href,
  icon,
  title
}: {
  body: string;
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link className="card block transition hover:-translate-y-0.5" href={href}>
      <div className="flex items-center gap-3 text-moss dark:text-cyan">
        {icon}
        <p className="font-bold text-ink dark:text-paper">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/66 dark:text-paper/66">{body}</p>
    </Link>
  );
}
