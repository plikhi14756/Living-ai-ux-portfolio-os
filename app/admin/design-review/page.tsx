import {
  DesignReviewDecision,
  RunDesignReviewButton,
  RunMaintenanceButton
} from "@/components/forms/design-review-actions";
import {
  listDesignReviews,
  listMaintenanceReports
} from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Design Review"
};

export default async function DesignReviewPage() {
  const [reviews, reports] = await Promise.all([
    listDesignReviews(),
    listMaintenanceReports()
  ]);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Monthly Design and Maintenance Review</p>
          <h1 className="mt-2 text-4xl font-black">Review proposed site improvements</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
            The design review agent creates recommendations and preview changes,
            but it never changes the public design without approval.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RunDesignReviewButton />
          <RunMaintenanceButton />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-4">
          {reviews.map((review) => (
            <article className="card" key={review.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{review.review_month}</p>
                  <h2 className="mt-2 text-2xl font-black">
                    {review.overall_score}/100 - {review.recommendation_type}
                  </h2>
                </div>
                <span className="tag">{review.status}</span>
              </div>
              <JsonBlock title="Recommendations" value={review.recommendations} />
              <JsonBlock title="Preview design changes" value={review.preview_changes} />
              {review.status === "pending" ? (
                <div className="mt-5">
                  <DesignReviewDecision id={review.id} />
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <aside className="space-y-4">
          {reports.map((report) => (
            <article className="card" key={report.id}>
              <p className="eyebrow">{report.report_month}</p>
              <h2 className="mt-2 text-2xl font-black">Maintenance report</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-ink/70 dark:text-paper/70">
                <p>
                  <strong>PDF:</strong> {report.pdf_status}
                </p>
                <p>
                  <strong>SEO:</strong> {report.seo_status}
                </p>
                <p>
                  <strong>Mobile:</strong> {report.mobile_status}
                </p>
              </div>
              <JsonBlock title="Broken links" value={report.broken_links} />
              <JsonBlock title="Duplicate entries" value={report.duplicate_entries} />
              <JsonBlock title="Confidentiality flags" value={report.confidentiality_flags} />
              <JsonBlock title="Recommendations" value={report.recommendations} />
            </article>
          ))}
        </aside>
      </section>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="mt-4 rounded-lg border border-ink/10 bg-paper/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-bold text-ink/50 dark:text-paper/50">{title}</p>
      <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-ink/70 dark:text-paper/70">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
