import Link from "next/link";
import { ReleaseActionButton } from "@/components/admin/operations-actions";
import { getReleaseState } from "@/lib/portfolio-operations/releases";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Release History"
};

export default async function ReleaseHistoryPage() {
  const { releases, unread, views } = await getReleaseState();
  const dismissed = new Set(
    views.filter((view) => view.dismissed_at).map((view) => view.release_id)
  );
  const unreadIds = new Set(unread.map((release) => release.id));

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">What&apos;s New</p>
          <h1 className="mt-2 text-4xl font-black">Release history</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
            Source-controlled release summaries for operational changes in the
            Living AI UX Portfolio OS.
          </p>
        </div>
        <Link className="btn-secondary" href="/admin/operations">
          Back to Operations
        </Link>
      </section>

      <section className="grid gap-5">
        {releases.map((release) => (
          <article className="card" key={release.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="tag">v{release.version}</span>
                  <span className="tag">{release.release_type}</span>
                  <span className="tag">
                    {unreadIds.has(release.id)
                      ? "unviewed"
                      : dismissed.has(release.id)
                        ? "dismissed"
                        : "viewed"}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-black">{release.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/68 dark:text-paper/68">
                  {release.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ReleaseActionButton action="view" releaseId={release.id} />
                <ReleaseActionButton action="unread" releaseId={release.id} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {Array.isArray(release.change_items)
                ? release.change_items.map((change, index) => {
                    const item = change as {
                      category?: string;
                      title?: string;
                      description?: string;
                    };
                    return (
                      <div className="subtle-card" key={`${release.id}-${index}`}>
                        <p className="eyebrow">{item.category ?? "Update"}</p>
                        <h3 className="mt-2 font-black">{item.title ?? "Release item"}</h3>
                        <p className="mt-2 text-sm leading-6 text-ink/66 dark:text-paper/66">
                          {item.description ?? ""}
                        </p>
                      </div>
                    );
                  })
                : null}
            </div>
          </article>
        ))}
        {!releases.length ? (
          <div className="card text-sm text-ink/62 dark:text-paper/62">
            No release records have been synchronized yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
